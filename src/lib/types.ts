export interface BayRow {
  id: 1 | 2 | 3;
  occupied: boolean;
  changed_at: Date;
}

export type EventType =
  | "SYSTEM_START"
  | "BAY"
  | "ENTRY"
  | "EXIT"
  | "FULL"
  | "HEARTBEAT";

export interface EventRow {
  id?: number;
  created_at: Date;
  event: EventType;
  bay?: number | null;
  state?: boolean | null;
}

export interface DeviceRow {
  id: "esp32";
  last_seen: Date;
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
