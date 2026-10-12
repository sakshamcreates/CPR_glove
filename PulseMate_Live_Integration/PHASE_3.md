# SANJEEVANI Phase 3 — Real ESP32-S3 Integration Guide

## 1. System Architecture

```
[ Physical ESP32-S3 Glove ]
  • MPU6050 Motion Sensor (I2C GPIO 8/9)
  • Multimodal Feedback (LED GPIO 4/7/5, Buzzer GPIO 10, Motor GPIO 3)
  • ESP-IDF / Arduino WebSocket Client
                  │
                  ▼  (Wi-Fi / LAN: JSON Telemetry)
┌───────────────────────────────────────────────┐
│       WebSocket Gateway Server (Node.js)      │
│                Port 3001                      │
│   • Validates incoming telemetry contract     │
│   • Broadcasts packets to connected browsers  │
└───────────────────────────────────────────────┘
                  │
                  ▼  (ws://localhost:3001)
┌───────────────────────────────────────────────┐
│               SANJEEVANI Web UI               │
│   • DataAdapter Architecture                  │
│       ├── DemoAdapter (Offline Simulation)    │
│       └── ESP32Adapter (WebSocket Client)     │
│   • Live Monitor HUD (/live)                  │
│   • Real-Time Acceleration Waveform           │
│   • LocalStorage Session Recording            │
└───────────────────────────────────────────────┘
```

---

## 2. WebSocket Telemetry Contract

All telemetry packets transmitted by the ESP32-S3 or simulator must strictly match this JSON schema:

```json
{
  "type": "telemetry",
  "timestamp": 1727691234,
  "compressionCount": 18,
  "cprRate": 112,
  "peakAcceleration": 4.82,
  "tilt": 14,
  "status": "OPTIMAL"
}
```

### Field Definitions

| Field | Type | Description |
|---|---|---|
| `type` | `"telemetry"` | Constant identifier for CPR telemetry messages |
| `timestamp` | `number` | Unix epoch timestamp (seconds or milliseconds) |
| `compressionCount` | `number` | Incremental compression count in current cycle (e.g. 1 to 30) |
| `cprRate` | `number` | Computed compression cadence in compressions per minute (CPM) |
| `peakAcceleration` | `number` | Peak stroke acceleration vector in standard g units (e.g. `4.82`) |
| `tilt` | `number` | Palm angle deviation from vertical sternal axis in degrees (e.g. `14`) |
| `status` | `string` | One of `"OPTIMAL"`, `"SLOW"`, `"FAST"`, `"TILT"`, `"PAUSED"` |

### Status Criteria
- **`OPTIMAL`**: Rate between 100 and 120 CPM, tilt ≤ 18°.
- **`SLOW`**: Rate < 100 CPM.
- **`FAST`**: Rate > 120 CPM.
- **`TILT`**: Hand tilt > 18° off-vertical.
- **`PAUSED`**: No compression motion detected for > 3 seconds.

---

## 3. Environment Variables

Create or edit `.env` in the project root:

```bash
# WebSocket Gateway Server URL for browser connection
VITE_ESP32_WS_URL=ws://localhost:3001
```

If not provided, the frontend safely defaults to `ws://localhost:3001`.

---

## 4. How to Start the WebSocket Server

The server is built with zero external dependencies using native Node.js:

```bash
# Start the WebSocket Gateway Server on port 3001
npm run server
```

Server output:
```
====================================================
SANJEEVANI WebSocket Gateway listening on port 3001
WebSocket URL: ws://localhost:3001
Accepting ESP32-S3 hardware & browser client streams
====================================================
```

---

## 5. How to Run the Frontend

In a separate terminal:

```bash
npm run dev
```

Open `http://localhost:5173/live` in your browser.

---

## 6. How to Test Without ESP32 Hardware

Since the physical ESP32 is not present, use the built-in simulator script. It pushes valid, realistic packets conforming exactly to the hardware contract:

1. Ensure the gateway server is running:
   ```bash
   npm run server
   ```
2. In another terminal, run the simulator:
   ```bash
   npm run test:esp32
   ```
3. On the web dashboard at `http://localhost:5173/live`:
   - Click the mode switch pill: **LIVE ESP32**
   - The indicator will immediately show **● DEVICE CONNECTED**
   - Live CPR Rate, Compression Count, Hand Tilt, and Peak Acceleration will update in real time from the simulator.
   - The continuous acceleration waveform will react dynamically to the live stream.
   - Click **Start Session**, wait a few seconds, then click **Stop Session**. Verify the completed session summary is saved to LocalStorage and appears on `/sessions`.

> [!NOTE]
> The simulator periodically transmits a malformed packet to verify error resilience. Notice the gateway and frontend discard it safely with a warning without crashing.

---

## 7. How the Real ESP32 Connects Later

When flashing the physical ESP32-S3 glove firmware:

1. Connect the ESP32-S3 to the same Wi-Fi network as the computer running the gateway.
2. Configure the ESP32 WebSocket client URI to:
   ```c
   // In ESP-IDF esp_websocket_client or ArduinoWebSockets:
   const char* ws_server_url = "ws://<GATEWAY_IP_ADDRESS>:3001";
   ```
3. Whenever a compression stroke apex occurs (or at ~100–500ms intervals):
   Serialize the telemetry struct into JSON matching the schema and call `esp_websocket_client_send_text(client, json_payload, strlen(json_payload), portMAX_DELAY)`.
4. The gateway will immediately ingest, validate, and broadcast to all connected browser screens.

---

## 8. Troubleshooting

| Symptom | Cause | Solution |
|---|---|---|
| Indicator shows `● RECONNECTING` | Gateway server is not running | Run `npm run server` in terminal |
| Indicator shows `● CONNECTION ERROR` | Incorrect URL or port blocked | Verify `VITE_ESP32_WS_URL` in `.env` and port 3001 accessibility |
| Packets not updating on UI | Mode toggle is set to `DEMO MODE` | Click `LIVE ESP32` toggle on `/live` |
| Malformed telemetry warnings in server log | Non-compliant JSON payload sent | Verify payload keys and types match the Telemetry Contract above |
| Session not appearing in `/sessions` | LocalStorage cleared or private window | Ensure session was stopped via `Stop Session` button |
