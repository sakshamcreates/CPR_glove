# PulseMate — Deployment & Configuration Guide

## Quick Start (Local Development)

```powershell
# 1. Set your ESP32's current IP in .env.local
#    (find it from the Arduino Serial Monitor "Wi-Fi connected. IP=X.X.X.X" line)

# 2. Edit .env.local:
VITE_ESP32_WS_URL=ws://10.197.64.142:81

# 3. Start the dev server (MUST restart after editing .env.local)
npm.cmd run dev

# 4. Open http://localhost:5173 — the dashboard auto-connects in Real ESP32 Mode
```

> **Important:** After editing `.env.local`, you **must restart** the Vite dev server
> (`Ctrl+C`, then `npm.cmd run dev`). Vite embeds env vars at build/transform time, not at runtime.

---

## Environment Variable

| Variable | Purpose | Example |
|---|---|---|
| `VITE_ESP32_WS_URL` | WebSocket URL of the ESP32 firmware server | `ws://10.197.64.142:81` |

The IP changes whenever the ESP32 reconnects to a hotspot. Find the new IP from the serial
monitor line: `[NET] Wi-Fi connected. IP=<NEW_IP>`.

`.env.local` is **git-ignored** and must never be committed. Your hotspot credentials or device
IP are private and should stay local.

---

## Operating Modes

### Demo Mode
- Uses the built-in physics simulator — no hardware required.
- All metrics are clearly labelled **DEMO**.
- No WebSocket connections are opened while Demo Mode is active.
- Select via the **DEMO MODE** button on Dashboard or Live Monitor.

### Real ESP32 Mode (default)
- Connects directly to `VITE_ESP32_WS_URL` over a plain WebSocket (`ws://`).
- Shows **REAL HARDWARE / LIVE ESP32** labels everywhere.
- Shows `Connecting → Connected / Error` states.
- Automatically reconnects after drops (exponential backoff, capped at 8 s).
- Never falls back to demo data while this mode is active.
- Select via the **LIVE ESP32** button.

---

## Is `npm run server` Required?

**No — for direct ESP32 connection, the gateway is not needed.**

`npm run server` starts the optional Node.js gateway (`server/gateway.js`) on port 3001.
It was part of an older indirect architecture. It is only useful if you want to relay data
through a local Node server (e.g., for logging, or running the built-in simulator
`npm run test:esp32`).

For real hardware, leave the gateway off. The frontend connects directly to the ESP32.

---

## Public / HTTPS Deployment Limitations

| Scenario | Works? | Reason |
|---|---|---|
| Same local network, `http://localhost` | ✅ Yes | Plain `ws://` allowed from non-HTTPS pages |
| Same local network, `http://192.168.x.x` | ✅ Yes | Plain `ws://` allowed |
| Deployed to **HTTPS** (Netlify, Vercel, GitHub Pages…) | ❌ No | Browsers block **mixed content**: loading `ws://` from an `https://` page is forbidden |
| Deployed to HTTPS, ESP32 on **public internet** | ❌ Not practical | The ESP32 has a private LAN IP not reachable from the internet |

### Why `ws://` fails on HTTPS

Modern browsers enforce **mixed content security**: an HTTPS page cannot open an insecure
`ws://` WebSocket. Attempting it results in a browser error:

```
Mixed Content: The page at 'https://yoursite.com' was loaded over HTTPS, but attempted
to connect to the insecure WebSocket endpoint 'ws://192.168.x.x:81'.
This request has been blocked.
```

### If you need public HTTPS + real hardware

You need a **secure WebSocket proxy** that:

1. Terminates TLS (`wss://`) on a public server you control.
2. Forwards the WebSocket traffic to the ESP32 on your local network via a
   reverse-tunnel (e.g., [ngrok](https://ngrok.com), [Cloudflare Tunnel](https://www.cloudflare.com/products/tunnel/),
   or your own VPS with nginx).

Architecture:
```
Browser (HTTPS)
  └─ wss://your-server.com/esp32  (TLS terminated by public server)
       └─ [reverse tunnel / proxy]
            └─ ws://192.168.x.x:81  (ESP32 on your LAN)
```

Update `.env.local` on the build machine (or set the env var in your deployment platform)
to point at the secure proxy URL:

```env
VITE_ESP32_WS_URL=wss://your-server.com/esp32
```

**The dashboard itself does not require any code changes** — it reads the URL from
`VITE_ESP32_WS_URL`.

### Demo Mode on a public HTTPS site

Demo Mode always works on any HTTPS deployment because it uses the built-in simulator
with no WebSocket connections. The public site should default to Demo Mode, or clearly
tell users that Real ESP32 Mode requires a local network connection.

---

## How to Verify Live Hardware Is Updating the UI

1. Open the Arduino Serial Monitor. Confirm the device shows:
   ```
   [WS] client #0 connected from <your-laptop-IP> (clients=1)
   ```
   This confirms the laptop's browser opened the WebSocket and the firmware counted it.

2. In the browser, the Live Monitor banner must show:
   ```
   ● ESP32-S3 LIVE STREAM CONNECTED: Seq #NNNNN · Sensor: MPU6050 OK · Session: STANDBY
   Last update: Xs ago
   ```

3. The sequence number (`Seq #`) must **increase with every packet**. If it stays at 0,
   data is not arriving.

4. When you physically tilt the glove, `HAND TILT` must respond within ~100 ms.

5. When compressions begin, `CPR RATE` changes from `—` to a number (e.g. `112 /min`).

---

## Files Affected by This Integration

| File | Role |
|---|---|
| `.env.local` | ESP32 WebSocket URL — **edit this when the IP changes** |
| `src/services/esp32Adapter.ts` | WebSocket lifecycle, reconnect, telemetry state |
| `src/services/telemetryValidator.ts` | Parses & validates firmware JSON packets |
| `src/services/dataAdapter.ts` | Singleton mode manager (demo ↔ esp32) |
| `src/services/demoAdapter.ts` | Physics simulator for Demo Mode |
| `src/hooks/useCPRData.ts` | React hook exposing live data to all pages |
| `src/types/cpr.ts` | Type definitions for telemetry, adapter, session |
| `src/pages/DashboardPage.tsx` | Overview with mode switcher, live metrics |
| `src/pages/LiveMonitorPage.tsx` | Full HUD with rate, tilt, accel, freshness |
| `src/pages/DevicePage.tsx` | Hardware spec, sensor status, hello info |
| `src/pages/LandingPage.tsx` | Hero with live connection status |
| `src/components/common/Navbar.tsx` | Persistent connection status indicator |
