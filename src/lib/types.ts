import type { ObjectId } from "mongodb";

export interface BayDocument {
  _id: 1 | 2 | 3;
  occupied: boolean;
  changedAt: Date;
}

export type EventType =
  | "SYSTEM_START"
  | "BAY"
  | "ENTRY"
  | "EXIT"
  | "FULL"
  | "HEARTBEAT";

export interface EventDocument {
  _id?: ObjectId;
  createdAt: Date;
  event: EventType;
  bay?: number;
  state?: boolean;
}

export interface DeviceDocument {
  _id: "esp32";
  lastSeen: Date;
}

export interface BayStatus {
  id: 1 | 2 | 3;
  occupied: boolean;
  changedAt: string; // ISO UTC string
}

export interface RecentEvent {
  id: string;
  createdAt: string; // ISO UTC string
  event: EventType;
  bay?: number;
  state?: boolean;
}

export interface CarParkStatus {
  bays: BayStatus[];
  free: number;
  vehiclesToday: number;
  recent: RecentEvent[];
  online: boolean;
  lastSeen: string | null;
  serverTime: string;
}

export interface UpdatePayload {
  event: EventType;
  bay?: number;
  p1: number;
  p2: number;
  p3: number;
  total?: number;
}
