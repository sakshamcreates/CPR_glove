# PulseMate — Deployed Website (Vercel) + ESP32 Live Telemetry Guide

This guide explains how to connect your deployed Vercel site (`https://cprglove.vercel.app/`) to your real ESP32-S3 hardware when your laptop and ESP32 are connected to the same Wi-Fi/hotspot.

---

## 1. Browser Security Reality: Why Direct `ws://` is Blocked on Deployed Sites

When you open `https://cprglove.vercel.app/` in Chrome, Edge, or Firefox:
* The web page is loaded over **HTTPS** (secure context).
* The ESP32 WebSocket server runs plain **`ws://<ESP32_IP>:81`** (insecure, no TLS encryption).
* **Browser Mixed Content Policy strictly blocks** `new WebSocket("ws://10.197.64.142:81")` from any HTTPS page:
  ```text
  Mixed Content: The page at 'https://cprglove.vercel.app/' was loaded over HTTPS,
  but attempted to connect to the insecure WebSocket endpoint 'ws://10.197.64.142:81'.
  This request has been blocked.
  ```
* **Being on the same Wi-Fi does NOT bypass this security restriction.** The restriction is enforced inside your web browser sandbox, not by the router or network.

---

## 2. The Solution: Lightweight Local WSS Bridge

To satisfy browser HTTPS security without running any heavy frontend dev servers (`npm run dev` is **NOT** needed), a tiny background bridge (`server/bridge.js`) runs on your laptop:

```text
[ESP32-S3] ──(ws://10.197.64.142:81 over Wi-Fi)──> [Laptop Bridge] ──(wss://localhost:3001)──> [Vercel Browser Tab]
```

### Why this satisfies all requirements:
1. **No frontend server needed**: Vercel serves the static HTML/JS/CSS.
2. **No internet proxy/relay needed**: Telemetry never leaves your local Wi-Fi.
3. **Pure native Node.js**: Zero external npm dependencies.
4. **Dynamic IP configuration**: If the ESP32 IP changes, you can pass it via `ESP32_WS_URL=ws://<NEW_IP>:81` or change it on the website UI.

---

## 3. How to Use the Deployed Website (`https://cprglove.vercel.app/`)

### Step 1: Start the Local Bridge on your Laptop
Open PowerShell in the project directory and run:

```powershell
npm.cmd run bridge
```

*(If the ESP32 IP changed, pass the new IP: `$env:ESP32_WS_URL="ws://<NEW_IP>:81"; npm.cmd run bridge`)*

The bridge will automatically generate a self-signed TLS cert for `localhost` and begin listening on `wss://localhost:3001`.

### Step 2: One-Time Certificate Trust in Browser (Takes 5 seconds)
Because the bridge uses a local self-signed TLS certificate for `wss://localhost:3001`, your browser requires you to accept it once:
1. Open this link in your browser: **[https://localhost:3001](https://localhost:3001)**
2. Chrome / Edge will show: *"Your connection isn't private"*
3. Click **"Advanced"** → **"Proceed to localhost (unsafe)"**
4. You will see the green confirmation page: **"Certificate Accepted! Secure Bridge is active."**

### Step 3: Open the Deployed Website
1. Go to **[https://cprglove.vercel.app/live](https://cprglove.vercel.app/live)**
2. The page connects to `wss://localhost:3001` automatically and begins streaming real ESP32 telemetry!
3. You will see:
   * **ESP32-S3 LIVE STREAM CONNECTED**
   * Real **`Seq #`** ticking upward
   * Active Hand Tilt, Accelerations, and CPR Cadence

---

## 4. UI Custom Endpoint & URL Parameter Override

The deployed frontend now includes an **Endpoint Switcher** on the Live Monitor page:
* Click **"Change Endpoint"** in the top banner to connect to any WebSocket address without rebuilding or redeploying.
* Quick preset buttons:
  * **Local Bridge (wss://)**: `wss://localhost:3001` (for deployed HTTPS)
  * **Direct ESP32 (ws://)**: `ws://10.197.64.142:81` (for local HTTP access)
* You can also bookmark the URL with a query parameter:
  `https://cprglove.vercel.app/live?wsUrl=wss://localhost:3001`

---

## 5. Summary of Running Processes

| To Use | Run `npm run dev`? | Run `npm run server`? | Run `npm run bridge`? |
|---|---|---|---|
| **Demo Mode on Vercel** | ❌ No | ❌ No | ❌ No |
| **Real ESP32 on Deployed Vercel (HTTPS)** | ❌ No | ❌ No | ✅ **Yes** (`npm run bridge`) |
| **Local Development (HTTP)** | ✅ Yes (`npm run dev`) | ❌ No | ❌ No (connects direct to `ws://`) |
