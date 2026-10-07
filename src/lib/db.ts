import getPool from "./mysql";
import {
  CarParkStatus,
  EventType,
  UpdatePayload,
} from "./types";
import { RowDataPacket } from "mysql2/promise";

let isDbInitialized = false;

interface BayDbRow extends RowDataPacket {
  id: number;
  occupied: number | boolean;
  changed_at: Date | string;
}

interface DeviceDbRow extends RowDataPacket {
  id: string;
  last_seen: Date | string;
}

interface EventDbRow extends RowDataPacket {
  id: number;
  created_at: Date | string;
  event: EventType;
  bay: number | null;
  state: number | boolean | null;
}

interface CountDbRow extends RowDataPacket {
  cnt: number;
}

/**
 * Ensures required MySQL tables and default initial bay seeds are in place.
 */
export async function ensureDbInitialized(): Promise<void> {
  if (isDbInitialized) return;

  const pool = getPool();

  try {
    // 1. Bays table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bays (
        id INT PRIMARY KEY,
        occupied BOOLEAN NOT NULL DEFAULT FALSE,
        changed_at DATETIME(3) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 2. Device table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS device (
        id VARCHAR(32) PRIMARY KEY,
        last_seen DATETIME(3) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 3. Events table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        created_at DATETIME(3) NOT NULL,
        event VARCHAR(32) NOT NULL,
        bay INT NULL,
        state BOOLEAN NULL,
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 4. Ensure initial seed rows for bays 1, 2, 3
    const now = new Date();
    await pool.query(
      `
      INSERT IGNORE INTO bays (id, occupied, changed_at) VALUES 
        (1, FALSE, ?),
        (2, FALSE, ?),
        (3, FALSE, ?)
      `,
      [now, now, now]
    );

    isDbInitialized = true;
  } catch (err) {
    console.error("Failed to initialize MySQL schema/seeds:", err);
    throw err;
  }
}

/**
 * Computes midnight in Asia/Colombo (+05:30) as a UTC Date.
 */
export function getColomboMidnightUTC(now: Date = new Date()): Date {
  // Asia/Colombo is strictly UTC + 5:30 (330 minutes) without Daylight Saving Time
  const COLOMBO_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
  const colomboTime = new Date(now.getTime() + COLOMBO_OFFSET_MS);

  const year = colomboTime.getUTCFullYear();
  const month = colomboTime.getUTCMonth();
  const date = colomboTime.getUTCDate();

  // Midnight 00:00:00 in Colombo
  const colomboMidnightUTC = Date.UTC(year, month, date, 0, 0, 0, 0);

  // Return the equivalent UTC Date
  return new Date(colomboMidnightUTC - COLOMBO_OFFSET_MS);
}

/**
 * Processes an incoming ESP32 update payload.
 * Updates device heartbeat, bay occupancy (updating changed_at ONLY when occupancy flips),
 * and records non-heartbeat events.
 */
export async function processEsp32Update(payload: UpdatePayload): Promise<void> {
  const pool = getPool();
  const now = new Date();

  const p1 = payload.p1 === 1, p2 = payload.p2 === 1, p3 = payload.p3 === 1;

  const tasks: Promise<unknown>[] = [];

  // 1. device heartbeat
  tasks.push(
    pool.query(
      `INSERT INTO device (id, last_seen) VALUES ('esp32', ?)
       ON DUPLICATE KEY UPDATE last_seen = VALUES(last_seen)`,
      [now]
    )
  );

  // 2. all three bays in ONE statement; changed_at only moves when occupied flips
  //    (changed_at must be listed BEFORE occupied so it sees the old value)
  tasks.push(
    pool.query(
      `INSERT INTO bays (id, occupied, changed_at)
       VALUES (1, ?, ?), (2, ?, ?), (3, ?, ?)
       ON DUPLICATE KEY UPDATE
         changed_at = IF(occupied <> VALUES(occupied), VALUES(changed_at), changed_at),
         occupied   = VALUES(occupied)`,
      [p1, now, p2, now, p3, now]
    )
  );

  // 3. event row (not for HEARTBEAT)
  if (payload.event !== "HEARTBEAT") {
    let bayValue: number | null = null;
    let stateValue: boolean | null = null;
    if (typeof payload.bay === "number") {
      bayValue = payload.bay;
      if (payload.bay === 1) stateValue = p1;
      else if (payload.bay === 2) stateValue = p2;
      else if (payload.bay === 3) stateValue = p3;
    }
    tasks.push(
      pool.query(
        "INSERT INTO events (created_at, event, bay, state) VALUES (?, ?, ?, ?)",
        [now, payload.event, bayValue, stateValue]
      )
    );
  }

  await Promise.all(tasks);
}

/**
 * Retrieves the complete real-time status snapshot from MySQL.
 */
export async function getStatusSnapshot(): Promise<CarParkStatus> {
  await ensureDbInitialized();
  const pool = getPool();
  const now = new Date();

  // Read bays
  const [bayRows] = await pool.query<BayDbRow[]>(
    "SELECT id, occupied, changed_at FROM bays WHERE id IN (1, 2, 3) ORDER BY id ASC"
  );

  const bayMap = new Map<number, BayDbRow>(bayRows.map((b) => [b.id, b]));
  const formattedBays = ([1, 2, 3] as const).map((id) => {
    const row = bayMap.get(id);
    const occupied = row ? Boolean(row.occupied) : false;
    const changedAtDate = row?.changed_at ? new Date(row.changed_at) : now;
    return {
      id,
      occupied,
      changedAt: changedAtDate.toISOString(),
    };
  });

  const freeCount = formattedBays.filter((b) => !b.occupied).length;

  // Read device last_seen
  const [deviceRows] = await pool.query<DeviceDbRow[]>(
    "SELECT last_seen FROM device WHERE id = 'esp32' LIMIT 1"
  );

  const lastSeenDate = deviceRows.length > 0 && deviceRows[0].last_seen
    ? new Date(deviceRows[0].last_seen)
    : null;

  const isOnline =
    lastSeenDate !== null && now.getTime() - lastSeenDate.getTime() <= 25000;

  // Read recent 10 events (ordered created_at descending)
  const [recentRows] = await pool.query<EventDbRow[]>(
    "SELECT id, created_at, event, bay, state FROM events ORDER BY created_at DESC, id DESC LIMIT 10"
  );

  const formattedRecent = recentRows.map((row) => ({
    id: String(row.id),
    createdAt: new Date(row.created_at).toISOString(),
    event: row.event,
    ...(typeof row.bay === "number" ? { bay: row.bay } : {}),
    ...(row.state !== null && row.state !== undefined
      ? { state: Boolean(row.state) }
      : {}),
  }));

  // Count ENTRY events since midnight in Asia/Colombo
  const colomboMidnight = getColomboMidnightUTC(now);
  const [countRows] = await pool.query<CountDbRow[]>(
    "SELECT COUNT(*) as cnt FROM events WHERE event = 'ENTRY' AND created_at >= ?",
    [colomboMidnight]
  );

  const vehiclesToday = countRows.length > 0 ? Number(countRows[0].cnt) : 0;

  return {
    bays: formattedBays,
    free: freeCount,
    vehiclesToday,
    recent: formattedRecent,
    online: isOnline,
    lastSeen: lastSeenDate ? lastSeenDate.toISOString() : null,
    serverTime: now.toISOString(),
  };
}
