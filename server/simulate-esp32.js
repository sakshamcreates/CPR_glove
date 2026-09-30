/**
 * SANJEEVANI — Phase 3 ESP32-S3 Hardware Simulator
 *
 * Simulates physical ESP32-S3 glove firmware by connecting to the
 * WebSocket gateway and streaming compliant CPR telemetry packets.
 *
 * Used for end-to-end pipeline verification:
 *   ESP32 Simulator ──WS──> Gateway (3001) ──WS──> Browser (/live)
 */

const WS_URL = process.env.WS_URL || 'ws://localhost:3001';

console.log('====================================================');
console.log('SANJEEVANI — ESP32-S3 Firmware Simulator');
console.log(`Connecting to Gateway at ${WS_URL}...`);
console.log('====================================================');

const ws = new WebSocket(WS_URL);

let compressionCount = 0;
let cycle = 1;
const peakPool = [4.82, 5.65, 6.12, 6.65, 5.40, 7.05, 4.95, 6.30];
let peakIdx = 0;
let packetCount = 0;

ws.addEventListener('open', () => {
  console.log('[Simulator] Connected to Gateway as ESP32-S3 client.');
  console.log('[Simulator] Beginning telemetry stream at ~112 CPM...\n');

  // ~112 CPM cadence = 1 compression every ~535 ms
  const intervalMs = Math.round((60 / 112) * 1000);

  setInterval(() => {
    packetCount++;
    compressionCount++;

    if (compressionCount > 30) {
      compressionCount = 1;
      cycle++;
    }

    // Select varying peak acceleration
    peakIdx = (peakIdx + 1) % peakPool.length;
    const peakAcceleration = Number((peakPool[peakIdx] + (Math.random() - 0.5) * 0.2).toFixed(2));

    // Realistic rate with subtle natural variance (109 - 115 CPM)
    const cprRate = Math.round(112 + Math.sin(packetCount * 0.3) * 3);

    // Realistic tilt (12° - 16°)
    const tilt = Math.round(14 + Math.sin(packetCount * 0.2) * 2);

    // Determine status
    let status = 'OPTIMAL';
    if (tilt > 20) status = 'TILT';
    else if (cprRate < 100) status = 'SLOW';
    else if (cprRate > 120) status = 'FAST';

    // 1. Regular compliant telemetry packet
    const telemetryPacket = {
      type: 'telemetry',
      timestamp: Math.floor(Date.now() / 1000),
      compressionCount,
      cprRate,
      peakAcceleration,
      tilt,
      status,
    };

    try {
      ws.send(JSON.stringify(telemetryPacket));
      console.log(
        `[Simulator] Transmitted packet #${packetCount}: ` +
        `Rate=${cprRate} CPM, Compressions=${compressionCount}/30 (Cycle ${cycle}), ` +
        `Peak=${peakAcceleration}g, Tilt=${tilt}°, Status=${status}`
      );
    } catch (err) {
      console.error('[Simulator] Failed to send packet:', err.message);
    }

    // Periodically (every 25 packets) test malformed message resilience
    if (packetCount % 25 === 0) {
      console.log('[Simulator] Testing error resilience: sending malformed packet...');
      try {
        const malformed = { type: 'corrupt_data', foo: 'bar', timestamp: -99 };
        ws.send(JSON.stringify(malformed));
      } catch (e) {
        // ignore
      }
    }
  }, intervalMs);
});

ws.addEventListener('error', (err) => {
  console.error('[Simulator] WebSocket connection error:', err.message || err);
});

ws.addEventListener('close', () => {
  console.log('[Simulator] Connection closed by Gateway.');
  process.exit(0);
});
