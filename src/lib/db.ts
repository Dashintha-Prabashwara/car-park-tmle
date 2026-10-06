import { Db } from "mongodb";
import clientPromise from "./mongodb";
import {
  BayDocument,
  CarParkStatus,
  DeviceDocument,
  EventDocument,
  EventType,
  UpdatePayload,
} from "./types";

const DB_NAME = "smartpark";
let isDbInitialized = false;

/**
 * Returns the MongoDB database instance for 'smartpark'.
 */
export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db(DB_NAME);
}

/**
 * Ensures required collections, indexes, and initial bay seeds are in place.
 */
export async function ensureDbInitialized(db: Db): Promise<void> {
  if (isDbInitialized) return;

  try {
    const eventsCollection = db.collection<EventDocument>("events");
    await eventsCollection.createIndex({ createdAt: -1 });

    const baysCollection = db.collection<BayDocument>("bays");
    const existingBays = await baysCollection
      .find({ _id: { $in: [1, 2, 3] } })
      .toArray();

    const existingIds = new Set(existingBays.map((b) => b._id));
    const now = new Date();

    const missingBays: BayDocument[] = [];
    for (const bayId of [1, 2, 3] as const) {
      if (!existingIds.has(bayId)) {
        missingBays.push({
          _id: bayId,
          occupied: false,
          changedAt: now,
        });
      }
    }

    if (missingBays.length > 0) {
      await baysCollection.insertMany(missingBays);
    }

    isDbInitialized = true;
  } catch (err) {
    console.error("Failed to initialize database indexes/seeds:", err);
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
 * Updates device heartbeat, bay occupancy (updating changedAt ONLY when occupancy flips),
 * and records non-heartbeat events.
 */
export async function processEsp32Update(payload: UpdatePayload): Promise<void> {
  const db = await getDb();
  await ensureDbInitialized(db);

  const now = new Date();

  // 1. Update device lastSeen on EVERY request, including HEARTBEAT
  const deviceCol = db.collection<DeviceDocument>("device");
  await deviceCol.updateOne(
    { _id: "esp32" },
    { $set: { lastSeen: now } },
    { upsert: true }
  );

  // 2. Update bays: update changedAt ONLY when occupied actually changes
  const baysCol = db.collection<BayDocument>("bays");
  const existingBays = await baysCol
    .find({ _id: { $in: [1, 2, 3] } })
    .toArray();
  const bayMap = new Map(existingBays.map((b) => [b._id, b]));

  const bayStates: Record<1 | 2 | 3, boolean> = {
    1: payload.p1 === 1,
    2: payload.p2 === 1,
    3: payload.p3 === 1,
  };

  for (const bayId of [1, 2, 3] as const) {
    const isOccupied = bayStates[bayId];
    const existing = bayMap.get(bayId);

    if (!existing) {
      await baysCol.updateOne(
        { _id: bayId },
        { $set: { occupied: isOccupied, changedAt: now } },
        { upsert: true }
      );
    } else if (existing.occupied !== isOccupied) {
      await baysCol.updateOne(
        { _id: bayId },
        { $set: { occupied: isOccupied, changedAt: now } }
      );
    }
  }

  // 3. Store event in 'events' collection (do NOT store HEARTBEAT events)
  if (payload.event !== "HEARTBEAT") {
    const eventsCol = db.collection<EventDocument>("events");
    const eventDoc: EventDocument = {
      createdAt: now,
      event: payload.event,
    };
    if (typeof payload.bay === "number") {
      eventDoc.bay = payload.bay;
      if (payload.bay === 1) eventDoc.state = payload.p1 === 1;
      else if (payload.bay === 2) eventDoc.state = payload.p2 === 1;
      else if (payload.bay === 3) eventDoc.state = payload.p3 === 1;
    }
    await eventsCol.insertOne(eventDoc);
  }
}

/**
 * Retrieves the complete real-time status snapshot from MongoDB.
 */
export async function getStatusSnapshot(): Promise<CarParkStatus> {
  const db = await getDb();
  await ensureDbInitialized(db);

  const now = new Date();

  // Read bays
  const baysCol = db.collection<BayDocument>("bays");
  const bayDocs = await baysCol.find({ _id: { $in: [1, 2, 3] } }).toArray();

  // Ensure default 3 bays if any missing
  const bayMap = new Map(bayDocs.map((b) => [b._id, b]));
  const formattedBays = ([1, 2, 3] as const).map((id) => {
    const doc = bayMap.get(id);
    return {
      id,
      occupied: doc ? doc.occupied : false,
      changedAt: doc ? doc.changedAt.toISOString() : now.toISOString(),
    };
  });

  const freeCount = formattedBays.filter((b) => !b.occupied).length;

  // Read device lastSeen
  const deviceCol = db.collection<DeviceDocument>("device");
  const deviceDoc = await deviceCol.findOne({ _id: "esp32" });

  const lastSeenDate = deviceDoc?.lastSeen ?? null;
  const isOnline =
    lastSeenDate !== null && now.getTime() - lastSeenDate.getTime() <= 25000;

  // Read recent 10 events (ordered createdAt descending)
  const eventsCol = db.collection<EventDocument>("events");
  const recentDocs = await eventsCol
    .find()
    .sort({ createdAt: -1 })
    .limit(10)
    .toArray();

  const formattedRecent = recentDocs.map((doc) => ({
    id: (doc._id as { toString: () => string }).toString(),
    createdAt: doc.createdAt.toISOString(),
    event: doc.event,
    ...(typeof doc.bay === "number" ? { bay: doc.bay } : {}),
    ...(typeof doc.state === "boolean" ? { state: doc.state } : {}),
  }));

  // Count ENTRY events since midnight in Asia/Colombo
  const colomboMidnight = getColomboMidnightUTC(now);
  const vehiclesToday = await eventsCol.countDocuments({
    event: "ENTRY",
    createdAt: { $gte: colomboMidnight },
  });

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
