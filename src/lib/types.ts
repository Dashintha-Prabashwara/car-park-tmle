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
  | "HEARTBEAT"
  | "ONLINE"
  | "OFFLINE";

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

export interface AnomalyReport {
  staleSensors: number[]; // bay IDs with rapid state flips
  stuckOccupiedBays: { bay: number; hours: number }[]; // bay IDs occupied > 24 hours
  dataConsistencyIssues: string[]; // discrepancy notes
}

export interface ConnectionQuality {
  measuredHeartbeatIntervalMs: number;
  estimatedLatencyMs: number;
  uptimePercent24h: number;
  outagesCount24h: number;
}

export interface CarParkStatus {
  bays: BayStatus[];
  free: number;
  vehiclesToday: number;
  recent: RecentEvent[];
  online: boolean;
  lastSeen: string | null;
  serverTime: string;
  anomalies?: AnomalyReport;
  quality?: ConnectionQuality;
}

export interface UpdatePayload {
  event: EventType;
  bay?: number;
  p1: number;
  p2: number;
  p3: number;
  total?: number;
}

// --- Analytics Types ---

export interface HeatmapCell {
  weekday: number; // 1 = Sunday, 2 = Monday, ..., 7 = Saturday
  hour: number;    // 0 to 23
  count: number;
}

export interface ParkingDurationStats {
  averageMinutes: number;
  medianMinutes: number;
  longestMinutes: number;
  sampleCount: number;
}

export interface BayUtilization {
  bayId: 1 | 2 | 3;
  utilizationPercent: number;
  minutesOccupiedToday: number;
}

export interface OccupancyPoint {
  timestamp: string; // ISO string
  timeLabel: string; // e.g. "14:00"
  occupied: number;
  free: number;
}

export interface ThroughputStats {
  today: number;
  yesterday: number;
  lastWeekSameDay: number;
  thisWeek: number;
  lastWeek: number;
  thisMonth: number;
}

export interface FullLotStats {
  timesReachedFullToday: number;
  totalMinutesFullToday: number;
  turnawaysToday: number; // FULL events
}

export interface AnalyticsResponse {
  heatmap: HeatmapCell[];
  duration: ParkingDurationStats;
  utilization: BayUtilization[];
  occupancyHistory: OccupancyPoint[];
  throughput: ThroughputStats;
  fullStats: FullLotStats;
  uptime24h: number;
  cachedAt: string;
}

export interface EventFilterQuery {
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  cursor?: string;
  limit?: number;
}
