# PulseMate — Smart CPR Feedback Platform

A Touch to Revive. Real-time CPR feedback designed for better practice and better outcomes.

---

## 🚀 How to Run the Project (Project Kaise Run Karein)

### 1. Requirements:
- **Node.js** (v18 or higher recommended)
- **npm** (comes with Node.js)

### 2. Steps to Run:

1. **Extract the ZIP folder** (ZIP ko kisi bhi folder me extract karein).
2. Open terminal / command prompt inside the extracted folder:
   ```bash
   cd CPR
   ```
3. **Install dependencies** (Libraries download karein):
   ```bash
   npm install
   ```
4. **Start the local development server**:
   ```bash
   npm run dev
   ```
5. Open your browser and visit:
   ```
   http://localhost:5173
   ```

---

## 📦 Production Build (Already Built inside `dist/`)

The compiled and optimized production build is included in the `dist/` folder.
To test the production build locally:
```bash
npm run preview
```

---

## 🛠️ Tech Stack
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS 3
- **Icons**: Lucide React


## Connect the current PulseMate ESP32-S3 firmware (local testing)

1. Connect the computer and ESP32-S3 to the same phone hotspot.
2. Copy the current IP from Arduino Serial Monitor, for example `10.202.206.142`.
3. In the project root, create a file named `.env.local` with this line (replace the IP with the current one):

   ```env
   VITE_ESP32_WS_URL=ws://10.202.206.142:81
   ```

4. In a terminal opened in this project folder, run:

   ```bash
   npm install
   npm run dev
   ```

5. Open the local Vite URL (usually `http://localhost:5173`), navigate to **Live Monitor**, then select **LIVE ESP32**.
6. The Live Monitor should show the connection state and actual incoming telemetry. If the hotspot reconnects and the ESP32 IP changes, update `.env.local` and restart `npm run dev`.

The adapter accepts the current firmware packet (`sample_seq`, `sensor_ok`, `ax`, `ay`, `az`, `tilt_deg`, `rate`, `comp_in_cycle`, `total_compressions`, etc.) and normalizes it for the dashboard. If `rate` is `null`, the UI shows no valid rate yet instead of inventing one.

**Scope note:** this direct `ws://` connection is for local testing on the same network. A public HTTPS deployment cannot directly use this local `ws://` address; public access requires a secure hosted gateway/backend and a suitable device-to-cloud path. Do not treat prototype sensor output as clinically validated CPR guidance.
