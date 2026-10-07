# 🚗 Smart Car Park - Real-Time IoT Telemetry Dashboard

A real-time SCADA telemetry web dashboard for a physical 3-bay miniature car park controlled by an ESP32 microcontroller. Built with **Next.js (App Router, TypeScript)**, **Tailwind CSS**, and **MySQL** using the high-performance `mysql2` driver. Designed for high reliability, real-time Server-Sent Events (SSE) streaming with automated polling fallback, and seamless deployment.

---

## 🛠 Physical System Overview

- **3 Parking Bays (P1, P2, P3)**: Each monitored by an ultrasonic sensor. A bay counts as occupied when an object is closer than 10 cm, confirmed across 3 consecutive readings. Each bay has physical green (available) and red (occupied) LEDs.
- **Entry Gate (Servo Barrier)**: Has its own sensor. Opens when a car arrives and at least one bay is free, then closes once the vehicle has cleared. If all 3 bays are occupied, the entry barrier remains closed and the ESP32 reports `FULL`.
- **Exit Gate (Servo Barrier)**: Opens when a car approaches from inside, then closes once passed.
- **Interlock**: Only one servo barrier can be open at any time.
- **ESP32 Data Stream**: The ESP32 is the single source of truth. It pushes state via HTTPS POST to `/api/update`. The website never sends commands to the ESP32 and never fabricates or simulates state - every value shown on the dashboard comes directly from MySQL.

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

## 🗄 Database Design (MySQL `smartpark`)

- **`bays`**: `id INT PRIMARY KEY`, `occupied BOOLEAN`, `changed_at DATETIME(3)`.
  - Automatically created and seeded on first connection (`1`, `2`, `3`).
  - `changed_at` is updated **only** when `occupied` actually transitions state.
- **`events`**: `id INT AUTO_INCREMENT PRIMARY KEY`, `created_at DATETIME(3)`, `event VARCHAR(32)`, `bay INT NULL`, `state BOOLEAN NULL`.
  - Stores all operational events (`ENTRY`, `EXIT`, `BAY`, `FULL`, `SYSTEM_START`).
  - Indexed on `created_at` for high query performance.
  - **Does NOT store HEARTBEAT events** to prevent table bloat.
- **`device`**: `id VARCHAR(32) PRIMARY KEY`, `last_seen DATETIME(3)`.
  - Updated on **every single request**, including heartbeats (every 10s).
- **Timezone**: Stored in UTC, formatted in **`Asia/Colombo` (+05:30)** on the dashboard.
- **Vehicles Today**: Count of `ENTRY` events since midnight in `Asia/Colombo`.
- **Controller Online**: True if `last_seen` was received within the last 25 seconds.

---

## ⚡ Real-Time Architecture

1. **Immediate Snapshot**: On page load, the client instantly fetches `/api/status` to prevent empty flashes.
2. **Server-Sent Events (`/api/stream`)**: The client connects via `EventSource('/api/stream')`. The endpoint monitors database snapshots roughly every 1s and pushes changes immediately to the client. Keep-alive comments (`: keep-alive\n\n`) are sent every 15s.
3. **Resilient Polling Fallback**: If SSE fails or reconnects more than 3 times in a row, the client automatically falls back to polling `/api/status` every 2 seconds until SSE connectivity is restored.
4. **Client-Side Heartbeat Evaluation**: The client recomputes controller online/offline status every second based on `last_seen` and `serverTime`. If the ESP32 goes silent, the UI flips to offline within 25 seconds even without incoming messages, presenting the banner:  
   *"Controller offline. Showing last known status."*

---

## 🚀 MySQL Setup Guide (From Scratch)

### 1. Install & Start MySQL

Choose any of the following options:

#### Option A: Local MySQL Server / MySQL Workbench (Windows/Mac/Linux)
1. Download and install **MySQL Community Server** from [mysql.com](https://dev.mysql.com/downloads/mysql/).
2. During installation, set your root password (e.g. `root` or your preferred password) and leave default port `3306`.
3. Start the MySQL service.

#### Option B: XAMPP (Windows/Mac)
1. Download and install [XAMPP](https://www.apachefriends.org/).
2. Open the **XAMPP Control Panel** and click **Start** next to **MySQL** (runs on port `3306` with user `root` and empty password by default).

#### Option C: Docker (Instant)
Run a MySQL container with one command:
```bash
docker run -d --name smartpark-mysql -p 3306:3306 -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=smartpark mysql:8.0
```

#### Option D: Cloud MySQL (Remote / Serverless)
You can use cloud MySQL providers such as **Aiven**, **PlanetScale**, **Railway**, or **AWS RDS**:
- Create a free MySQL database.
- Obtain the connection URI (e.g. `mysql://user:password@host:port/smartpark?ssl={"rejectUnauthorized":true}`).

---

### 2. Create the Database & Tables

Open your MySQL command line client, MySQL Workbench, or phpMyAdmin, and run:

```sql
CREATE DATABASE IF NOT EXISTS smartpark
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

> **Note**: The application automatically creates the tables (`bays`, `device`, `events`) and inserts the initial seed rows on startup!  
> You can also manually run the provided [`schema.sql`](./schema.sql) file:
> ```bash
> mysql -u root -p smartpark < schema.sql
> ```

---

### 3. Configure Environment Variables

Edit `.env.local` in the project root:

```env
# MySQL Configuration (Discrete Parameters)
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=smartpark

# Alternatively, you can use a single URI:
# MYSQL_URI=mysql://root:your_mysql_password@localhost:3306/smartpark

# ESP32 Authentication Key
API_KEY=your_secret_esp32_api_key_here
```

---

## 💻 Local Development Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
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
  -H "x-api-key: test-esp32-key" \
  -d '{"event":"HEARTBEAT","p1":0,"p2":0,"p3":0,"total":1}'

# Vehicle enters and parks in Bay 1
curl -X POST http://localhost:3000/api/update \
  -H "Content-Type: application/json" \
  -H "x-api-key: test-esp32-key" \
  -d '{"event":"ENTRY","p1":0,"p2":0,"p3":0,"total":2}'

curl -X POST http://localhost:3000/api/update \
  -H "Content-Type: application/json" \
  -H "x-api-key: test-esp32-key" \
  -d '{"event":"BAY","bay":1,"p1":1,"p2":0,"p3":0,"total":3}'
```

---

## 🔒 Security Best Practices
- **Constant-Time Verification**: API keys are checked using Node's `crypto.timingSafeEqual` to prevent timing attacks.
- **Strict Input Validation**: All payloads, bay indices, and occupancy values are validated before database writes.
- **Read-Only Client Access**: The browser client only ever calls read routes (`/api/status` and `/api/stream`). Only authenticated ESP32 requests can write to MySQL.
