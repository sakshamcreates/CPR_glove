# PulseMate — Deployed Website (Vercel) + ESP32 Live Telemetry Guide

This guide explains how to connect your deployed Vercel site (`https://cprglove.vercel.app/`) to your real ESP32-S3 hardware when your laptop and ESP32 are connected to the same Wi-Fi/hotspot (`saksham`).

---

## 1. Browser Security Reality: Why Direct `ws://` is Blocked on Deployed Sites

When you open `https://cprglove.vercel.app/` in Chrome, Edge, or Firefox:
* The web page is loaded over **HTTPS** (secure context).
* The ESP32 WebSocket server runs plain **`ws://<ESP32_IP>:81`** (insecure, unencrypted).
* **Browser Mixed Content Policy strictly blocks** `new WebSocket("ws://10.103.136.142:81")` from any HTTPS page:
  ```text
  Mixed Content: The page at 'https://cprglove.vercel.app/' was loaded over HTTPS,
  but attempted to connect to the insecure WebSocket endpoint 'ws://10.103.136.142:81'.
  This request has been blocked.
  ```
* **Being on the same Wi-Fi does NOT bypass this browser security restriction.** The restriction is enforced by the browser engine security sandbox, not by your router.

---

## 2. The Solution: Lightweight Local WSS Bridge

To satisfy browser HTTPS security without running any heavy frontend dev servers (`npm run dev` is **NOT** needed), a zero-dependency background bridge (`server/bridge.js`) runs on your laptop:

```text
[ESP32-S3] ──(ws://10.103.136.142:81 over Wi-Fi)──> [Laptop Bridge] ──(wss://localhost:3001)──> [Vercel Browser Tab]
```

### Why this satisfies all requirements:
1. **No frontend server needed**: Vercel serves the static HTML/JS/CSS.
2. **No external cloud relay needed**: Telemetry never leaves your local Wi-Fi.
3. **Pure native Node.js**: Zero external npm dependencies.
4. **Dynamic IP configuration**: Pass any IP or mDNS as CLI argument: `node server/bridge.js 10.103.136.142:81`.
5. **Bidirectional communication**: Immediate status packets, ping/pong, and raw frames.

---

## 3. How to Connect Real ESP32 Hardware

### Step 0: Ensure Laptop and ESP32 are on the Same Wi-Fi
* Confirm your laptop is connected to Wi-Fi SSID **"saksham"** (or whichever network the ESP32 is on).
* Verify reachability in PowerShell:
  ```powershell
  Test-NetConnection -ComputerName 10.103.136.142 -Port 81
  ```

### Step 1: Start the Local Bridge on your Laptop
Open PowerShell in the project directory and run:

```powershell
npm.cmd run bridge
```

Or pass a specific IP/port directly:
```powershell
node server/bridge.js 10.103.136.142:81
# Or using mDNS:
node server/bridge.js pulsemate.local:81
```

The bridge automatically uses the local TLS certificate and listens on `wss://localhost:3001`.

### Step 2: One-Time Certificate Trust in Browser
Because the bridge uses a local self-signed TLS certificate for `wss://localhost:3001`, your browser requires you to accept it once:
1. Open this link in your browser: **[https://localhost:3001](https://localhost:3001)**
2. Chrome / Edge will show: *"Your connection isn't private"*
3. Click **"Advanced"** → **"Proceed to localhost (unsafe)"**
4. You will see the green confirmation card: **"TLS Certificate Accepted!"**

### Step 3: Open the Deployed Website
1. Go to **[https://cprglove.vercel.app/live](https://cprglove.vercel.app/live)**
2. The page connects to `wss://localhost:3001` automatically and streams live ESP32 sensor telemetry!
3. You will see:
   * **ESP32-S3 LIVE STREAM CONNECTED**
   * Real **`Seq #`** ticking upward
   * Active Hand Tilt, Accelerations, and CPR Cadence

---

## 4. UI Custom Endpoint & URL Parameter Override

The deployed frontend includes an **Endpoint Switcher** on the Live Monitor page:
* Click **"Change Endpoint"** in the top banner to connect to any WebSocket address without rebuilding or redeploying.
* Quick preset buttons:
  * **Local Bridge (wss://)**: `wss://localhost:3001` (for deployed HTTPS)
  * **Direct IP (ws://)**: `ws://10.103.136.142:81`
  * **mDNS (ws://)**: `ws://pulsemate.local:81`
* Bookmark with a query parameter:
  `https://cprglove.vercel.app/live?wsUrl=wss://localhost:3001`

---

## 5. Summary of Running Processes

| Scenario | Run `npm run dev`? | Run `server/bridge.js`? |
|---|---|---|
| **Demo Mode on Vercel** | ❌ No | ❌ No |
| **Real ESP32 on Deployed Vercel (HTTPS)** | ❌ No | ✅ **Yes** (`npm.cmd run bridge`) |
| **Local Development (HTTP)** | ✅ Yes (`npm.cmd run dev`) | ❌ No (can connect direct to `ws://`) |
