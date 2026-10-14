/**
 * PulseMate Local WSS/HTTPS Bridge
 *
 * Why this is needed:
 *   When accessing the deployed website on HTTPS (e.g. https://cprglove.vercel.app/),
 *   browsers forbid mixed content (connecting to insecure ws:// from an https:// page).
 *   This lightweight script runs on your laptop, connects to the ESP32 WebSocket
 *   (ws://<ESP32_IP>:81) over local Wi-Fi, and serves a secure WebSocket endpoint
 *   (wss://localhost:3001) that the Vercel site can connect to without issues.
 *
 * Zero external npm dependencies: uses native Node.js https, http, crypto.
 */

import https from 'https';
import http from 'http';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

function resolveEsp32Url() {
  const cliArg = process.argv[2];
  const envUrl = process.env.ESP32_WS_URL || process.env.VITE_ESP32_WS_URL;
  const raw = cliArg || envUrl || '10.103.136.142:81';

  let target = raw.trim();
  if (!target.startsWith('ws://') && !target.startsWith('wss://')) {
    target = 'ws://' + target;
  }
  try {
    const parsed = new URL(target);
    if (!parsed.port) {
      target = `${parsed.protocol}//${parsed.hostname}:81${parsed.pathname || ''}${parsed.search || ''}`;
    }
  } catch {
    // Keep target as is if URL parse fails
  }
  return target;
}

const ESP32_WS_URL = resolveEsp32Url();
const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

// Active connected browser clients
const browserClients = new Set();
let esp32Socket = null;
let esp32Connected = false;
let esp32ConnectAttempts = 0;
let lastConnectError = null;
let reconnectTimer = null;
let lastTelemetry = null;
let lastTelemetryTimestamp = null;
let telemetryPacketCount = 0;

// Ensure TLS certificate for localhost
const certDir = path.join(__dirname, 'certs');
const keyPath = path.join(certDir, 'localhost.key');
const certPath = path.join(certDir, 'localhost.crt');

function ensureCertificates() {
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    return {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };
  }

  if (!fs.existsSync(certDir)) {
    fs.mkdirSync(certDir, { recursive: true });
  }

  console.log('[Bridge] Generating self-signed TLS certificate for localhost...');
  try {
    execSync(
      `openssl req -x509 -newkey rsa:2048 -keyout "${keyPath}" -out "${certPath}" -days 365 -nodes -subj "/CN=localhost"`,
      { stdio: 'pipe' }
    );
    console.log('[Bridge] Certificate generated successfully.');
    return {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };
  } catch (err) {
    console.error('[Bridge] Failed to generate certificate with openssl:', err.message);
    throw err;
  }
}

const certs = ensureCertificates();

function getBridgeStatusPayload() {
  return JSON.stringify({
    type: 'bridge_status',
    bridgeOk: true,
    esp32Connected,
    targetUrl: ESP32_WS_URL,
    lastError: lastConnectError,
    telemetryCount: telemetryPacketCount,
    lastTelemetryTime: lastTelemetryTimestamp,
    connectedBrowsers: browserClients.size,
    message: esp32Connected
      ? `Bridge connected to ESP32 at ${ESP32_WS_URL}`
      : `Bridge active, searching for ESP32 at ${ESP32_WS_URL}...`,
  });
}

function broadcastBridgeStatus(targetSocket = null) {
  const frame = createTextFrame(getBridgeStatusPayload());
  if (targetSocket) {
    try {
      targetSocket.write(frame);
    } catch {}
  } else {
    for (const client of browserClients) {
      try {
        client.write(frame);
      } catch {
        browserClients.delete(client);
      }
    }
  }
}

/**
 * Connect to physical ESP32-S3 over local Wi-Fi WebSocket
 */
function connectToEsp32() {
  if (esp32Socket) {
    try {
      esp32Socket.close();
    } catch {}
    esp32Socket = null;
  }

  esp32ConnectAttempts++;
  console.log(`[Bridge] Connecting to ESP32 at ${ESP32_WS_URL} (Attempt #${esp32ConnectAttempts})...`);

  try {
    const ws = new WebSocket(ESP32_WS_URL);
    esp32Socket = ws;

    ws.onopen = () => {
      esp32Connected = true;
      lastConnectError = null;
      console.log(`[Bridge] Connected successfully to ESP32 at ${ESP32_WS_URL}!`);
      broadcastBridgeStatus();
    };

    ws.onmessage = (event) => {
      const dataStr = typeof event.data === 'string' ? event.data : event.data.toString('utf8');
      lastTelemetry = dataStr;
      lastTelemetryTimestamp = Date.now();
      telemetryPacketCount++;

      // Forward message to all connected browser clients
      broadcastToBrowsers(dataStr);
    };

    ws.onerror = (err) => {
      lastConnectError = err.message || 'Connection refused or host unreachable';
      console.warn(`[Bridge] ESP32 connection error (${ESP32_WS_URL}):`, lastConnectError);
    };

    ws.onclose = () => {
      esp32Connected = false;
      esp32Socket = null;
      console.log('[Bridge] ESP32 disconnected. Retrying in 2 seconds...');
      broadcastBridgeStatus();

      if (!reconnectTimer) {
        reconnectTimer = setTimeout(() => {
          reconnectTimer = null;
          connectToEsp32();
        }, 2000);
      }
    };
  } catch (err) {
    lastConnectError = err.message;
    console.warn('[Bridge] Exception initiating ESP32 connection:', err.message);
    if (!reconnectTimer) {
      reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        connectToEsp32();
      }, 2000);
    }
  }
}

/**
 * Create unmasked WebSocket frame
 */
function createTextFrame(text) {
  const payload = Buffer.from(text, 'utf8');
  const length = payload.length;

  let header;
  if (length <= 125) {
    header = Buffer.alloc(2);
    header[0] = 0x81;
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

function broadcastToBrowsers(text) {
  if (browserClients.size === 0) return;
  const frame = createTextFrame(text);
  for (const client of browserClients) {
    try {
      client.write(frame);
    } catch {
      browserClients.delete(client);
    }
  }
}

/**
 * Handle incoming WebSocket connection upgrade from browser
 */
function handleUpgrade(req, socket, head) {
  const clientKey = req.headers['sec-websocket-key'];
  if (!clientKey) {
    socket.destroy();
    return;
  }

  const acceptKey = crypto
    .createHash('sha1')
    .update(clientKey + WS_GUID)
    .digest('base64');

  const headers = [
    'HTTP/1.1 101 Switching Protocols',
    'Upgrade: websocket',
    'Connection: Upgrade',
    `Sec-WebSocket-Accept: ${acceptKey}`,
    '\r\n',
  ];

  socket.write(headers.join('\r\n'));
  browserClients.add(socket);
  console.log(`[Bridge] Browser connected from ${req.socket.remoteAddress} (Total browsers: ${browserClients.size})`);

  // ALWAYS send immediate bridge status upon client handshake
  broadcastBridgeStatus(socket);

  // If ESP32 is connected and recent telemetry exists, send it for immediate display
  if (esp32Connected && lastTelemetry && lastTelemetryTimestamp && (Date.now() - lastTelemetryTimestamp < 30000)) {
    try {
      socket.write(createTextFrame(lastTelemetry));
    } catch {}
  }

  socket.on('data', (buffer) => {
    if (buffer.length < 2) return;
    const opcode = buffer[0] & 0x0f;
    if (opcode === 0x8) {
      // Close frame
      browserClients.delete(socket);
      try { socket.end(); } catch {}
    } else if (opcode === 0x9) {
      // Ping -> Pong
      const pong = Buffer.alloc(2);
      pong[0] = 0x8a;
      pong[1] = 0;
      socket.write(pong);
    } else if (opcode === 0x1) {
      // Text frame from browser -> forward to ESP32
      try {
        const masked = (buffer[1] & 0x80) === 0x80;
        let payloadLen = buffer[1] & 0x7f;
        let offset = 2;
        if (payloadLen === 126) {
          payloadLen = buffer.readUInt16BE(2);
          offset = 4;
        } else if (payloadLen === 127) {
          offset = 10;
        }
        let payload;
        if (masked) {
          const mask = buffer.slice(offset, offset + 4);
          offset += 4;
          payload = Buffer.alloc(payloadLen);
          for (let i = 0; i < payloadLen; i++) {
            payload[i] = buffer[offset + i] ^ mask[i % 4];
          }
        } else {
          payload = buffer.slice(offset, offset + payloadLen);
        }
        const msgStr = payload.toString('utf8');
        if (esp32Socket && esp32Connected) {
          esp32Socket.send(msgStr);
        }
      } catch {}
    }
  });

  const cleanup = () => {
    browserClients.delete(socket);
    console.log(`[Bridge] Browser disconnected (Remaining: ${browserClients.size})`);
  };

  socket.on('end', cleanup);
  socket.on('close', cleanup);
  socket.on('error', cleanup);
}

// Create HTTPS/WSS Server (for deployed HTTPS Vercel frontend)
const httpsServer = https.createServer(certs, (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>PulseMate WSS Bridge</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; padding: 2rem; max-width: 640px; margin: 0 auto; line-height: 1.5; }
          .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 1.5rem; }
          .ok { color: #10b981; font-weight: bold; font-size: 1.15rem; }
          .warn { color: #f59e0b; font-weight: bold; }
          .badge { display: inline-block; padding: 0.25rem 0.5rem; background: #064e3b; color: #34d399; border-radius: 6px; font-size: 0.85rem; font-family: monospace; }
          .badge-warn { background: #78350f; color: #fde68a; }
          .btn { display: inline-block; padding: 0.5rem 1rem; background: #173F35; color: white; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 1rem; }
          code { background: #0f172a; padding: 0.2rem 0.4rem; border-radius: 4px; font-family: monospace; color: #38bdf8; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>PulseMate HTTPS / WSS Bridge</h2>
          <p class="ok">TLS Certificate Accepted!</p>
          <p>Your browser now trusts this secure local bridge for <code>wss://localhost:${PORT}</code>.</p>
          <hr style="border: none; border-top: 1px solid #334155; margin: 1rem 0;" />
          <p>Target ESP32: <code>${ESP32_WS_URL}</code></p>
          <p>Hardware Status: <span class="badge ${esp32Connected ? '' : 'badge-warn'}">${esp32Connected ? 'CONNECTED' : 'DISCONNECTED / SEARCHING'}</span></p>
          <p>Connected Browser Tabs: <strong>${browserClients.size}</strong></p>
          <p>Packets Forwarded: <strong>${telemetryPacketCount}</strong></p>
          ${!esp32Connected ? '<p class="warn">If ESP32 is not connecting, confirm that your laptop is connected to Wi-Fi SSID "saksham" and ESP32 IP is ' + ESP32_WS_URL + '.</p>' : ''}
          <a class="btn" href="https://cprglove.vercel.app/live" target="_blank">Return to Live CPR Monitor</a>
        </div>
      </body>
    </html>
  `);
});

httpsServer.on('upgrade', handleUpgrade);

httpsServer.listen(PORT, '0.0.0.0', () => {
  console.log('================================================================');
  console.log(' PULSEMATE HTTPS / WSS LOCAL BRIDGE');
  console.log('================================================================');
  console.log(` Secure WebSocket listening on : wss://localhost:${PORT}`);
  console.log(` Target ESP32 WebSocket       : ${ESP32_WS_URL}`);
  console.log(` Connected Browsers           : ${browserClients.size}`);
  console.log(` Deployed Website             : https://cprglove.vercel.app/`);
  console.log('================================================================');
  console.log(' FIRST-TIME BROWSER SETUP:');
  console.log(' 1. Ensure your laptop is connected to the same Wi-Fi as ESP32 ("saksham").');
  console.log(' 2. Open https://localhost:3001 in your browser ONCE and click');
  console.log('    "Advanced" -> "Proceed to localhost (unsafe)" to trust the cert.');
  console.log(' 3. Open https://cprglove.vercel.app/live to view live telemetry!');
  console.log('================================================================\n');

  // Start connecting to ESP32
  connectToEsp32();
});
