import { RecentEvent } from "./types";

/**
 * Formats a Date or ISO timestamp into 24-hour time in Asia/Colombo timezone.
 */
export function formatColomboTime(
  dateInput: string | Date | null | undefined,
  includeSeconds = true
): string {
  if (!dateInput) return "-";
  try {
    const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return "-";

    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Colombo",
      hour: "2-digit",
      minute: "2-digit",
      ...(includeSeconds ? { second: "2-digit" } : {}),
      hour12: false,
    }).format(d);
  } catch {
    return "-";
  }
}

/**
 * Formats changedAt into "since HH:mm" in Asia/Colombo timezone.
 */
export function formatSinceTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return "since -";
  const timeStr = formatColomboTime(dateInput, false);
  return `since ${timeStr}`;
}

/**
 * Computes elapsed dwell time (e.g., "14m", "1h 22m").
 */
export function formatDwellDuration(
  dateInput: string | Date | null | undefined,
  nowMs = Date.now()
): string {
  if (!dateInput) return "0m";
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  const diffMs = Math.max(0, nowMs - d.getTime());
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return "< 1m";
  if (diffMinutes < 60) return `${diffMinutes}m`;
  const hours = Math.floor(diffMinutes / 60);
  const remainingMinutes = diffMinutes % 60;
  return `${hours}h ${remainingMinutes.toString().padStart(2, "0")}m`;
}

/**
 * Maps an event into a clear plain sentence and a SCADA category badge.
 */
export function formatEventSentence(event: RecentEvent): {
  sentence: string;
  category: string;
  badgeClass: string;
} {
  switch (event.event) {
    case "ENTRY":
      return {
        sentence: "Vehicle entered via Entry Gate",
        category: "GATEWAY",
        badgeClass: "bg-sky-500/20 text-sky-400 border border-sky-500/40",
      };
    case "EXIT":
      return {
        sentence: "Vehicle exited via Exit Gate",
        category: "DISPATCH",
        badgeClass: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40",
      };
    case "BAY": {
      const bayNum = event.bay ?? "?";
      if (event.state === true) {
        return {
          sentence: `Bay ${bayNum} occupied`,
          category: `BAY P${bayNum}`,
          badgeClass: "bg-rose-500/20 text-rose-400 border border-rose-500/40",
        };
      } else if (event.state === false) {
        return {
          sentence: `Bay ${bayNum} available`,
          category: `BAY P${bayNum}`,
          badgeClass: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40",
        };
      }
      return {
        sentence: `Bay ${bayNum} state updated`,
        category: `BAY P${bayNum}`,
        badgeClass: "bg-amber-500/20 text-amber-400 border border-amber-500/40",
      };
    }
    case "FULL":
      return {
        sentence: "Entry blocked, car park full",
        category: "LOCKOUT",
        badgeClass: "bg-rose-500/20 text-rose-400 border border-rose-500/40 font-bold",
      };
    case "SYSTEM_START":
      return {
        sentence: "System started",
        category: "SYSTEM",
        badgeClass: "bg-indigo-500/20 text-indigo-400 border border-indigo-500/40",
      };
    case "HEARTBEAT":
      return {
        sentence: "Controller heartbeat pulse received",
        category: "DEVICE",
        badgeClass: "bg-slate-500/20 text-slate-400 border border-slate-500/40",
      };
    default:
      return {
        sentence: `Event recorded: ${event.event}`,
        category: "TELEMETRY",
        badgeClass: "bg-slate-500/20 text-slate-400 border border-slate-500/40",
      };
  }
}
