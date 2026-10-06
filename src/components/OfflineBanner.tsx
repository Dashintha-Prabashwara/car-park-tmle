"use client";

import { WifiOff } from "lucide-react";
import { formatColomboTime } from "@/lib/format";

interface OfflineBannerProps {
  isOnline: boolean;
  lastSeen: string | null;
  secondsSinceLastSeen: number | null;
}

export function OfflineBanner({
  isOnline,
  lastSeen,
  secondsSinceLastSeen,
}: OfflineBannerProps) {
  if (isOnline) return null;

  return (
    <div
      role="alert"
      className="w-full bg-rose-950/70 border-b border-rose-500/40 text-rose-200 px-4 py-2.5 transition-all duration-300"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs sm:text-sm font-mono">
        <div className="flex items-center gap-2">
          <WifiOff className="w-4 h-4 text-rose-400 shrink-0 animate-pulse" />
          <span className="font-semibold tracking-wide text-white">
            Controller offline. Showing last known status.
          </span>
        </div>
        <div className="text-rose-300 text-xs">
          {lastSeen ? (
            <span>
              Last heartbeat: <strong className="text-white">{formatColomboTime(lastSeen, true)}</strong>
              {secondsSinceLastSeen !== null ? ` (${secondsSinceLastSeen}s ago)` : ""}
            </span>
          ) : (
            <span>No telemetry recorded yet from ESP32</span>
          )}
        </div>
      </div>
    </div>
  );
}
