# 🚗 Smart Car Park — Real-Time IoT Telemetry Dashboard

A real-time SCADA telemetry web dashboard for a physical 3-bay miniature car park controlled by an ESP32 microcontroller. Built with **Next.js (App Router, TypeScript)**, **Tailwind CSS**, and **MongoDB Atlas** using the official `mongodb` driver. Designed for high reliability, real-time Server-Sent Events (SSE) streaming with automated polling fallback, and seamless deployment on **Vercel**.

---

## 🛠 Physical System Overview

- **3 Parking Bays (P1, P2, P3)**: Each monitored by an ultrasonic sensor. A bay counts as occupied when an object is closer than 10 cm, confirmed across 3 consecutive readings. Each bay has physical green (available) and red (occupied) LEDs.
- **Entry Gate (Servo Barrier)**: Has its own sensor. Opens when a car arrives and at least one bay is free, then closes once the vehicle has cleared. If all 3 bays are occupied, the entry barrier remains closed and the ESP32 reports `FULL`.
- **Exit Gate (Servo Barrier)**: Opens when a car approaches from inside, then closes once passed.
- **Interlock**: Only one servo barrier can be open at any time.
- **ESP32 Data Stream**: The ESP32 is the single source of truth. It pushes state via HTTPS POST to `/api/update`. The website never sends commands to the ESP32 and never fabricates or simulates state—every value shown on the dashboard comes directly from MongoDB.

---

## 📡 ESP32 API Protocol

Every telemetry event is sent as an HTTPS POST request:

- **Endpoint**: `POST /api/update`
- **Header**: `x-api-key: <API_KEY>` (verified in constant time)
- **JSON Body**:
  ```json
  {
    "event": "BAY",
    "bay": 2,
    "p1": 1,
    "p2": 1,
    "p3": 0,
    "total": 5
  }
  ```
  - `event`: One of `SYSTEM_START`, `BAY`, `ENTRY`, `EXIT`, `FULL`, `HEARTBEAT`
  - `bay`: Required if event is `BAY` (`1`, `2`, or `3`)
  - `p1`, `p2`, `p3`: Current state of all 3 bays (`1` = occupied, `0` = available)
  - `total`: Boot counter (used for telemetry diagnostic; vehicles today is calculated from entry events)
- **Response**: `200 {"ok": true}`. Returns `401` for invalid API keys and `400` for invalid payloads.

---

## 🗄 Database Design (MongoDB `smartpark`)

- **`bays`**: `{ _id: 1|2|3, occupied: boolean, changedAt: Date }`.
  - Automatically seeded on first run (`P1`, `P2`, `P3`).
  - `changedAt` is updated **only** when `occupied` actually transitions state.
- **`events`**: `{ createdAt: Date, event: string, bay?: number, state?: boolean }`.
  - Stores all operational events (`ENTRY`, `EXIT`, `BAY`, `FULL`, `SYSTEM_START`).
  - Indexed descending on `createdAt: -1`.
  - **Does NOT store HEARTBEAT events** to prevent database bloat.
- **`device`**: `{ _id: "esp32", lastSeen: Date }`.
  - Updated on **every single request**, including heartbeats (every 10s).
- **Timezone**: Stored in UTC, formatted in **`Asia/Colombo` (+05:30)** on the dashboard.
- **Vehicles Today**: Count of `ENTRY` events since midnight in `Asia/Colombo`.
- **Controller Online**: True if `lastSeen` was received within the last 25 seconds.

---

## ⚡ Real-Time Architecture

1. **Immediate Snapshot**: On page load, the client instantly fetches `/api/status` to prevent empty flashes.
2. **Server-Sent Events (`/api/stream`)**: The client connects via `EventSource('/api/stream')`. The endpoint monitors MongoDB snapshots roughly every 1s and pushes changes immediately to the client. Keep-alive comments (`: keep-alive\n\n`) are sent every 15s.
3. **Resilient Polling Fallback**: If SSE fails or reconnects more than 3 times in a row, the client automatically falls back to polling `/api/status` every 2 seconds until SSE connectivity is restored.
4. **Client-Side Heartbeat Evaluation**: The client recomputes controller online/offline status every second based on `lastSeen` and `serverTime`. If the ESP32 goes silent, the UI flips to offline within 25 seconds even without incoming messages, presenting the banner:  
   *"Controller offline. Showing last known status."*

---

## 🚀 MongoDB Atlas Setup Guide

### 1. Create a Free MongoDB Atlas Cluster
1. Sign in or create an account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a new cluster and choose the free **M0 (Shared)** tier.
3. Select your preferred cloud provider and closest region.

### 2. Configure Database User
1. In the Atlas dashboard, navigate to **Security** > **Database Access**.
2. Click **Add New Database User**.
3. Choose **Password** authentication.
4. Set a username (e.g. `smartpark_admin`) and a secure password.
5. Grant the **Read and write to any database** privilege.
6. Click **Add User**.

### 3. Configure Network Access (Important for Vercel)
Vercel serverless functions use dynamic IP addresses.
1. Navigate to **Security** > **Network Access**.
2. Click **Add IP Address**.
3. Select **Allow Access from Anywhere** (`0.0.0.0/0`).
4. Click **Confirm**.

### 4. Get the Connection URI
1. Navigate to **Deployment** > **Database**.
2. Click **Connect** next to your cluster.
3. Choose **Drivers** (Node.js).
4. Copy the connection string. Append `/smartpark` to the URI so it targets the `smartpark` database:
   ```
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/smartpark?retryWrites=true&w=majority
   ```

---

## 💻 Local Development Setup

### 1. Clone & Install Dependencies
```bash
git clone <your-repo-url>
cd car-park-tmle
npm install
```

### 2. Set Up Environment Variables
Create a `.env.local` file in the project root:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/smartpark?retryWrites=true&w=majority
API_KEY=your_secret_esp32_api_key_here
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing with the Hardware Simulator

To test the live dashboard without physical ESP32 hardware, use the included simulator script:

### Continuous Realistic Simulation
Simulates boot, periodic heartbeats every 10s, vehicle arrivals, parking in free bays, exiting, and lot full events:
```bash
npm run simulate
# or: npx tsx scripts/simulate.ts
```

### Fill All Bays (Lot Full)
Simulates cars entering and occupying all 3 bays, followed by an inbound car blocked at the entry gate:
```bash
npx tsx scripts/simulate.ts --fill
```

### Empty All Bays
Simulates parked vehicles leaving their bays and exiting through the exit gate:
```bash
npx tsx scripts/simulate.ts --empty
```

### Reset Lot
Sends a `SYSTEM_START` event with all bays vacant:
```bash
npx tsx scripts/simulate.ts --reset
```

### Heartbeat Pulse Only
Sends a single `HEARTBEAT` request to keep the controller online:
```bash
npx tsx scripts/simulate.ts --heartbeat
```

### Testing with `curl`
You can also send updates directly using `curl`:
```bash
# Heartbeat
curl -X POST http://localhost:3000/api/update \
  -H "Content-Type: application/json" \
  -H "x-api-key: your_secret_esp32_api_key_here" \
  -d '{"event":"HEARTBEAT","p1":0,"p2":0,"p3":0,"total":1}'

# Vehicle enters and parks in Bay 1
curl -X POST http://localhost:3000/api/update \
  -H "Content-Type: application/json" \
  -H "x-api-key: your_secret_esp32_api_key_here" \
  -d '{"event":"ENTRY","p1":0,"p2":0,"p3":0,"total":2}'

curl -X POST http://localhost:3000/api/update \
  -H "Content-Type: application/json" \
  -H "x-api-key: your_secret_esp32_api_key_here" \
  -d '{"event":"BAY","bay":1,"p1":1,"p2":0,"p3":0,"total":3}'
```

---

## 🌐 Deploying to Vercel

### Option 1: Via Vercel Web Dashboard (Recommended)
1. Push your repository to GitHub, GitLab, or Bitbucket.
2. Go to [vercel.com](https://vercel.com) and click **Add New...** > **Project**.
3. Import your repository.
4. Under **Environment Variables**, add:
   - `MONGODB_URI`: Your MongoDB Atlas connection URI (with `/smartpark`).
   - `API_KEY`: Your secret API key.
5. Click **Deploy**.

### Option 2: Via Vercel CLI
```bash
npm i -g vercel
vercel
# Follow prompts, then add secrets:
vercel env add MONGODB_URI
vercel env add API_KEY
vercel --prod
```

### Target Simulator at Deployed URL
You can point the simulator at your live Vercel deployment:
```bash
SIMULATE_URL=https://your-app.vercel.app/api/update API_KEY=your_secret_esp32_api_key_here npm run simulate
```

---

## 🔒 Security Best Practices
- **Constant-Time Verification**: API keys are checked using Node's `crypto.timingSafeEqual` to prevent timing attacks.
- **Strict Input Validation**: All payloads, bay indices, and occupancy values are validated before database writes.
- **Read-Only Client Access**: The browser client only ever calls read routes (`/api/status` and `/api/stream`). Only authenticated ESP32 requests can write to MongoDB.
