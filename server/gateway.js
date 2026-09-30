/**
 * SANJEEVANI — Phase 3 Lightweight WebSocket Gateway Server
 *
 * Responsibilities:
 * - Accepts WebSocket connections from ESP32 hardware and browser frontends.
 * - Validates incoming telemetry packets against the standard CPR data contract.
 * - Broadcasts valid telemetry to all connected browser clients.
 * - Zero external dependencies (uses native Node.js http and crypto modules).
 *
 * Architecture:
 *   ESP32-S3 (or Simulator) ──WebSocket──> Gateway (Port 3001) ──WebSocket──> Browsers (/live)
 */

import http from 'http';
import crypto from 'crypto';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
const VALID_STATUSES = new Set(['OPTIMAL', 'SLOW', 'FAST', 'TILT', 'PAUSED']);

// Track active connected sockets
const clients = new Set();

/**
 * Validate incoming telemetry payload
 */
function validateTelemetry(obj) {
  if (!obj || typeof obj !== 'object') return false;
  if (obj.type !== 'telemetry') return false;
  if (typeof obj.timestamp !== 'number' || !Number.isFinite(obj.timestamp)) return false;
  if (typeof obj.compressionCount !== 'number' || !Number.isFinite(obj.compressionCount)) return false;
  if (typeof obj.cprRate !== 'number' || !Number.isFinite(obj.cprRate)) return false;
  if (typeof obj.peakAcceleration !== 'number' || !Number.isFinite(obj.peakAcceleration)) return false;
  if (typeof obj.tilt !== 'number' || !Number.isFinite(obj.tilt)) return false;
  if (typeof obj.status !== 'string' || !VALID_STATUSES.has(obj.status)) return false;
  return true;
}

/**
 * Create unmasked WebSocket text frame to send to clients
 */
function createTextFrame(text) {
  const payload = Buffer.from(text, 'utf8');
  const length = payload.length;

  let header;
  if (length <= 125) {
    header = Buffer.alloc(2);
    header[0] = 0x81; // FIN + text opcode
    header[1] = length;
  } else if (length <= 65535) {
    header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(length, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(length), 2);
  }

  return Buffer.concat([header, payload]);
}

/**
 * Broadcast message to all connected clients (except optionally the sender)
 */
function broadcast(text, excludeSocket = null) {
  const frame = createTextFrame(text);
  for (const client of clients) {
    if (client !== excludeSocket && client.writable) {
      try {
        client.write(frame);
      } catch (err) {
        console.error('[Gateway] Failed to write frame to client:', err.message);
      }
    }
  }
}

// HTTP Server to accept WebSocket Upgrade
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('SANJEEVANI WebSocket Gateway is running on port ' + PORT + '\n');
});

server.on('upgrade', (req, socket, head) => {
  const secKey = req.headers['sec-websocket-key'];
  if (!secKey) {
    socket.destroy();
    return;
  }

  // Calculate RFC 6455 accept token
  const hash = crypto.createHash('sha1').update(secKey + WS_GUID).digest('base64');
  const headers = [
    'HTTP/1.1 101 Switching Protocols',
    'Upgrade: websocket',
    'Connection: Upgrade',
    `Sec-WebSocket-Accept: ${hash}`,
    '\r\n',
  ];

  socket.write(headers.join('\r\n'));
  clients.add(socket);
  const clientId = `client-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`;
  console.log(`[Gateway] New connection: ${clientId} (Total active: ${clients.size})`);

  let buffer = Buffer.alloc(0);

  socket.on('data', (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);

    while (buffer.length >= 2) {
      const firstByte = buffer[0];
      const secondByte = buffer[1];
      const opcode = firstByte & 0x0f;
      const isMasked = Boolean(secondByte & 0x80);
      let payloadLength = secondByte & 0x7f;
      let offset = 2;

      if (payloadLength === 126) {
        if (buffer.length < offset + 2) break;
        payloadLength = buffer.readUInt16BE(offset);
        offset += 2;
      } else if (payloadLength === 127) {
        if (buffer.length < offset + 8) break;
        payloadLength = Number(buffer.readBigUInt64BE(offset));
        offset += 8;
      }

      let maskKey = null;
      if (isMasked) {
        if (buffer.length < offset + 4) break;
        maskKey = buffer.subarray(offset, offset + 4);
        offset += 4;
      }

      if (buffer.length < offset + payloadLength) {
        break; // Wait for complete frame
      }

      const payload = Buffer.from(buffer.subarray(offset, offset + payloadLength));
      buffer = buffer.subarray(offset + payloadLength);

      // Unmask if masked
      if (isMasked && maskKey) {
        for (let i = 0; i < payload.length; i++) {
          payload[i] ^= maskKey[i % 4];
        }
      }

      // Handle Opcodes
      if (opcode === 0x8) {
        // Close frame
        socket.end();
        break;
      } else if (opcode === 0x9) {
        // Ping -> respond with Pong (opcode 0xA)
        const pong = Buffer.alloc(2);
        pong[0] = 0x8a;
        pong[1] = 0;
        socket.write(pong);
      } else if (opcode === 0x1) {
        // Text frame
        const messageStr = payload.toString('utf8');
        try {
          const parsed = JSON.parse(messageStr);
          if (validateTelemetry(parsed)) {
            console.log(
              `[Gateway] Valid telemetry from ${clientId}: ` +
              `Rate=${parsed.cprRate} CPM, Count=${parsed.compressionCount}, Peak=${parsed.peakAcceleration}g, ` +
              `Tilt=${parsed.tilt}°, Status=${parsed.status}`
            );
            // Broadcast valid telemetry to all other connected clients
            broadcast(messageStr, socket);
          } else {
            console.warn(`[Gateway] Rejected malformed telemetry from ${clientId}:`, messageStr.slice(0, 120));
          }
        } catch (e) {
          console.warn(`[Gateway] Ignored non-JSON payload from ${clientId}:`, messageStr.slice(0, 80));
        }
      }
    }
  });

  const cleanup = () => {
    clients.delete(socket);
    console.log(`[Gateway] Connection closed: ${clientId} (Remaining active: ${clients.size})`);
  };

  socket.on('end', cleanup);
  socket.on('close', cleanup);
  socket.on('error', (err) => {
    console.warn(`[Gateway] Socket error on ${clientId}:`, err.message);
    cleanup();
  });
});

server.listen(PORT, () => {
  console.log('====================================================');
  console.log(`SANJEEVANI WebSocket Gateway listening on port ${PORT}`);
  console.log(`WebSocket URL: ws://localhost:${PORT}`);
  console.log('Accepting ESP32-S3 hardware & browser client streams');
  console.log('====================================================');
});
