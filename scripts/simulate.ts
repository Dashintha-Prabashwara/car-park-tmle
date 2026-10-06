/**
 * Smart Car Park - ESP32 Hardware Simulator
 * 
 * Simulates physical ESP32 microcontroller events and sends HTTPS/HTTP POST
 * requests to /api/update with strict x-api-key authentication.
 *
 * Usage:
 *   npx tsx scripts/simulate.ts
 *   npx tsx scripts/simulate.ts --fill
 *   npx tsx scripts/simulate.ts --empty
 *   npx tsx scripts/simulate.ts --reset
 *   npx tsx scripts/simulate.ts --heartbeat
 */

import http from "http";
import https from "https";
import { URL } from "url";
import fs from "fs";
import path from "path";

// Load environment variables from .env or .env.local if present
function loadEnv() {
  const envFiles = [".env.local", ".env"];
  for (const file of envFiles) {
    const fullPath = path.resolve(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, "utf-8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const [key, ...values] = trimmed.split("=");
        if (key && values.length > 0) {
          const val = values.join("=").replace(/^["']|["']$/g, "").trim();
          if (!process.env[key.trim()]) {
            process.env[key.trim()] = val;
          }
        }
      }
    }
  }
}

loadEnv();

const TARGET_URL = process.env.SIMULATE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000/api/update";
const API_KEY = process.env.API_KEY || "test-esp32-key";

type EventType = "SYSTEM_START" | "BAY" | "ENTRY" | "EXIT" | "FULL" | "HEARTBEAT";

interface UpdatePayload {
  event: EventType;
  bay?: number;
  p1: number;
  p2: number;
  p3: number;
  total: number;
}

class Esp32Simulator {
  private p1 = 0;
  private p2 = 0;
  private p3 = 0;
  private total = 0;
  private targetUrl: string;
  private apiKey: string;

  constructor(targetUrl = TARGET_URL, apiKey = API_KEY) {
    this.targetUrl = targetUrl;
    this.apiKey = apiKey;
  }

  public getOccupancy(): { p1: number; p2: number; p3: number } {
    return { p1: this.p1, p2: this.p2, p3: this.p3 };
  }

  public getFreeCount(): number {
    return 3 - (this.p1 + this.p2 + this.p3);
  }

  public async send(event: EventType, bay?: number): Promise<boolean> {
    this.total += 1;

    const payload: UpdatePayload = {
      event,
      p1: this.p1,
      p2: this.p2,
      p3: this.p3,
      total: this.total,
    };

    if (bay !== undefined) {
      payload.bay = bay;
    }

    const payloadStr = JSON.stringify(payload);
    const parsed = new URL(this.targetUrl);
    const isHttps = parsed.protocol === "https:";
    const client = isHttps ? https : http;

    return new Promise((resolve) => {
      const options = {
        hostname: parsed.hostname,
        port: parsed.port || (isHttps ? 443 : 80),
        path: parsed.pathname + parsed.search,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payloadStr),
          "x-api-key": this.apiKey,
        },
      };

      const req = client.request(options, (res) => {
        let resData = "";
        res.on("data", (chunk) => {
          resData += chunk;
        });
        res.on("end", () => {
          const timestamp = new Date().toLocaleTimeString();
          if (res.statusCode === 200) {
            console.log(
              `\x1b[32m[${timestamp}] ✓ 200 OK\x1b[0m | Event: \x1b[36m${event.padEnd(12)}\x1b[0m | Bays: [P1:${this.p1} P2:${this.p2} P3:${this.p3}] | Free: ${this.getFreeCount()} | Total: ${this.total}`
            );
            resolve(true);
          } else {
            console.error(
              `\x1b[31m[${timestamp}] ✗ ${res.statusCode} ERROR\x1b[0m | Response: ${resData}`
            );
            resolve(false);
          }
        });
      });

      req.on("error", (err) => {
        console.error(
          `\x1b[31m[Connection Error]\x1b[0m Unable to reach ${this.targetUrl}: ${err.message}`
        );
        resolve(false);
      });

      req.write(payloadStr);
      req.end();
    });
  }

  // Quick sequences
  public async resetLot(): Promise<void> {
    this.p1 = 0;
    this.p2 = 0;
    this.p3 = 0;
    console.log("\n--- Resetting car park: SYSTEM_START (all bays free) ---");
    await this.send("SYSTEM_START");
  }

  public async fillLot(): Promise<void> {
    console.log("\n--- Simulating vehicles filling all 3 bays ---");
    // Car 1 enters & parks in Bay 1
    await this.send("ENTRY");
    await sleep(800);
    this.p1 = 1;
    await this.send("BAY", 1);
    await sleep(800);

    // Car 2 enters & parks in Bay 2
    await this.send("ENTRY");
    await sleep(800);
    this.p2 = 1;
    await this.send("BAY", 2);
    await sleep(800);

    // Car 3 enters & parks in Bay 3
    await this.send("ENTRY");
    await sleep(800);
    this.p3 = 1;
    await this.send("BAY", 3);
    await sleep(800);

    // Car 4 arrives at entry gate while full -> FULL
    console.log("--- Inbound vehicle attempts entry while full ---");
    await this.send("FULL");
  }

  public async emptyLot(): Promise<void> {
    console.log("\n--- Simulating all vehicles exiting ---");
    if (this.p1 === 1) {
      this.p1 = 0;
      await this.send("BAY", 1);
      await sleep(600);
      await this.send("EXIT");
      await sleep(600);
    }
    if (this.p2 === 1) {
      this.p2 = 0;
      await this.send("BAY", 2);
      await sleep(600);
      await this.send("EXIT");
      await sleep(600);
    }
    if (this.p3 === 1) {
      this.p3 = 0;
      await this.send("BAY", 3);
      await sleep(600);
      await this.send("EXIT");
      await sleep(600);
    }
  }

  // Continuous realistic loop
  public async runLiveSimulation(): Promise<void> {
    console.log("\x1b[35m====================================================\x1b[0m");
    console.log("\x1b[1m  SMART CAR PARK - PHYSICAL ESP32 REALISTIC SIMULATOR\x1b[0m");
    console.log(`  Target: \x1b[34m${this.targetUrl}\x1b[0m`);
    console.log(`  API Key: \x1b[33m${this.apiKey.slice(0, 4)}****\x1b[0m`);
    console.log("\x1b[35m====================================================\x1b[0m\n");

    // Initial system boot event
    console.log("-> Sending initial SYSTEM_START...");
    await this.send("SYSTEM_START");

    // Heartbeat ticker every 10 seconds (as specified in prompt)
    setInterval(async () => {
      await this.send("HEARTBEAT");
    }, 10000);

    // Event generator loop
    while (true) {
      // Random delay between 4 and 8 seconds
      const delay = Math.floor(Math.random() * 4000) + 4000;
      await sleep(delay);

      const freeBays: (1 | 2 | 3)[] = [];
      if (this.p1 === 0) freeBays.push(1);
      if (this.p2 === 0) freeBays.push(2);
      if (this.p3 === 0) freeBays.push(3);

      const occupiedBays: (1 | 2 | 3)[] = [];
      if (this.p1 === 1) occupiedBays.push(1);
      if (this.p2 === 1) occupiedBays.push(2);
      if (this.p3 === 1) occupiedBays.push(3);

      // Decision: Car arrival or car departure
      const shouldArrive = freeBays.length > 0 && (occupiedBays.length === 0 || Math.random() > 0.45);

      if (shouldArrive) {
        // Vehicle arrives at entry gate
        await this.send("ENTRY");
        await sleep(1500);

        // Vehicle parks in a random free bay
        const chosenBay = freeBays[Math.floor(Math.random() * freeBays.length)];
        if (chosenBay === 1) this.p1 = 1;
        else if (chosenBay === 2) this.p2 = 1;
        else if (chosenBay === 3) this.p3 = 1;

        await this.send("BAY", chosenBay);
      } else if (occupiedBays.length === 3 && Math.random() > 0.5) {
        // Lot is full, another car tries to enter -> FULL event
        await this.send("FULL");
      } else if (occupiedBays.length > 0) {
        // Vehicle leaves bay
        const chosenBay = occupiedBays[Math.floor(Math.random() * occupiedBays.length)];
        if (chosenBay === 1) this.p1 = 0;
        else if (chosenBay === 2) this.p2 = 0;
        else if (chosenBay === 3) this.p3 = 0;

        await this.send("BAY", chosenBay);
        await sleep(1500);

        // Vehicle triggers exit barrier
        await this.send("EXIT");
      }
    }
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// CLI Execution
async function main() {
  const args = process.argv.slice(2);
  const sim = new Esp32Simulator();

  if (args.includes("--reset")) {
    await sim.resetLot();
  } else if (args.includes("--fill")) {
    await sim.fillLot();
  } else if (args.includes("--empty")) {
    await sim.emptyLot();
  } else if (args.includes("--heartbeat")) {
    console.log("-> Sending single HEARTBEAT pulse...");
    await sim.send("HEARTBEAT");
  } else {
    // Default: run continuous realistic simulation
    await sim.runLiveSimulation();
  }
}

main().catch((err) => {
  console.error("Simulator error:", err);
  process.exit(1);
});
