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
const ESP32_WS_URL = process.env.ESP32_WS_URL || process.env.VITE_ESP32_WS_URL || 'ws://10.197.64.142:81';
const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

// Active connected browser clients
const browserClients = new Set();
let esp32Socket = null;
let esp32Connected = false;
let reconnectTimer = null;
let lastTelemetry = null;

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
    // Generate valid self-signed certificate using OpenSSL
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

  console.log(`[Bridge] Connecting to ESP32 at ${ESP32_WS_URL}...`);
  try {
    const ws = new WebSocket(ESP32_WS_URL);
    esp32Socket = ws;

    ws.onopen = () => {
      esp32Connected = true;
      console.log(`[Bridge] Connected to ESP32 at ${ESP32_WS_URL}`);
    };

    ws.onmessage = (event) => {
      const dataStr = typeof event.data === 'string' ? event.data : event.data.toString('utf8');
      try {
        lastTelemetry = dataStr;
      } catch {}
      // Forward telemetry to all connected browser clients
      broadcastToBrowsers(dataStr);
    };

    ws.onerror = (err) => {
      console.warn(`[Bridge] ESP32 connection error (${ESP32_WS_URL}):`, err.message || 'unreachable');
    };

    ws.onclose = () => {
      esp32Connected = false;
      esp32Socket = null;
      console.log('[Bridge] ESP32 disconnected. Retrying in 2 seconds...');
      if (!reconnectTimer) {
        reconnectTimer = setTimeout(() => {
          reconnectTimer = null;
          connectToEsp32();
        }, 2000);
      }
    };
  } catch (err) {
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

  // Immediately send the last known telemetry packet so dashboard has instant data
  if (lastTelemetry) {
    try {
      socket.write(createTextFrame(lastTelemetry));
    } catch {}
  }

  socket.on('data', (buffer) => {
    // Process frames from browser if any (e.g. ping/pong)
    if (buffer.length < 2) return;
    const opcode = buffer[0] & 0x0f;
    if (opcode === 0x8) {
      // Close
      browserClients.delete(socket);
      try { socket.end(); } catch {}
    } else if (opcode === 0x9) {
      // Ping -> Pong
      const pong = Buffer.alloc(2);
      pong[0] = 0x8a;
      pong[1] = 0;
      socket.write(pong);
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

// 1. Create HTTPS/WSS Server (for deployed HTTPS Vercel frontend)
const httpsServer = https.createServer(certs, (req, res) => {
  // Helpful friendly page when visited in browser to accept self-signed cert
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>PulseMate WSS Bridge</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; padding: 2rem; max-width: 600px; margin: 0 auto; line-height: 1.5; }
          .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 1.5rem; }
          .ok { color: #10b981; font-weight: bold; }
          .badge { display: inline-block; padding: 0.25rem 0.5rem; background: #064e3b; color: #34d399; border-radius: 6px; font-size: 0.85rem; font-family: monospace; }
          a { color: #38bdf8; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>PulseMate HTTPS / WSS Bridge</h2>
          <p class="ok">Certificate Accepted! Secure Bridge is active.</p>
          <p>Status: <span class="badge">${esp32Connected ? 'ESP32 CONNECTED (' + ESP32_WS_URL + ')' : 'CONNECTING TO ESP32 (' + ESP32_WS_URL + ')'}</span></p>
          <p>Connected browsers: <strong>${browserClients.size}</strong></p>
          <hr style="border: none; border-top: 1px solid #334155; margin: 1.5rem 0;" />
          <p>You can now go back to <a href="https://cprglove.vercel.app/live" target="_blank">cprglove.vercel.app/live</a> and live data will stream automatically.</p>
        </div>
      </body>
    </html>
  `);
});

httpsServer.on('upgrade', handleUpgrade);

// 2. Also listen on plain HTTP/WS so local dev or direct tools can connect too
const httpServer = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' });
  res.end('PulseMate Bridge Running');
});
httpServer.on('upgrade', handleUpgrade);

httpsServer.listen(PORT, '0.0.0.0', () => {
  console.log('================================================================');
  console.log(' PULSEMATE HTTPS / WSS LOCAL BRIDGE');
  console.log('================================================================');
  console.log(` Secure WebSocket listening on : wss://localhost:${PORT}`);
  console.log(` Target ESP32 WebSocket       : ${ESP32_WS_URL}`);
  console.log(` Deployed Website             : https://cprglove.vercel.app/`);
  console.log('================================================================');
  console.log(' IMPORTANT FIRST-TIME STEP:');
  console.log(' Open https://localhost:3001 in Chrome/Edge ONCE and click');
  console.log(' "Advanced" -> "Proceed to localhost (unsafe)" to trust the cert.');
  console.log(' Then open https://cprglove.vercel.app/live to view real-time data!');
  console.log('================================================================\n');

  // Start connecting to ESP32
  connectToEsp32();
});
