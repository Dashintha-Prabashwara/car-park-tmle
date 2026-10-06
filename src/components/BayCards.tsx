"use client";

import { BayStatus } from "@/lib/types";
import { formatSinceTime, formatDwellDuration } from "@/lib/format";
import { Car, CheckCircle2, Radio } from "lucide-react";

interface BayCardsProps {
  bays: BayStatus[];
}

export function BayCards({ bays }: BayCardsProps) {
  // Ensure we display bays 1, 2, 3 in order
  const sortedBays = [...bays].sort((a, b) => a.id - b.id);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm sm:text-base font-bold uppercase tracking-tight text-[var(--foreground)] flex items-center gap-2">
          <Radio className="w-4 h-4 text-sky-400" />
          <span>Dedicated Bay Nodes</span>
        </h2>
        <span className="text-[11px] font-mono text-[var(--muted)] uppercase tracking-wider">
          ULTRASONIC &lt; 10CM
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {sortedBays.map((bay) => {
          const isOccupied = bay.occupied;
          const sinceText = formatSinceTime(bay.changedAt);
          const dwell = formatDwellDuration(bay.changedAt);

          return (
            <div
              key={bay.id}
              id={`bay-card-p${bay.id}`}
              className={`rounded-xl border p-5 flex flex-col justify-between transition-all duration-300 relative overflow-hidden ${
                isOccupied
                  ? "bg-[var(--card-bg)] border-rose-500/40 shadow-[0_0_15px_rgba(255,84,73,0.08)]"
                  : "bg-[var(--card-bg)] border-emerald-500/40 shadow-[0_0_15px_rgba(78,222,163,0.08)]"
              }`}
            >
              {/* Subtle top indicator bar */}
              <div
                className={`absolute top-0 inset-x-0 h-1 transition-colors duration-300 ${
                  isOccupied ? "bg-rose-500" : "bg-emerald-400"
                }`}
              />

              {/* Bay Name & Status Badge */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl font-black font-mono text-[var(--foreground)] tracking-tight">
                  P{bay.id}
                </span>

                <span
                  id={`bay-badge-p${bay.id}`}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-bold uppercase tracking-wider border transition-colors duration-300 ${
                    isOccupied
                      ? "bg-rose-500/15 text-rose-400 border-rose-500/40"
                      : "bg-emerald-500/15 text-emerald-400 border-emerald-500/40"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isOccupied ? "bg-rose-500" : "bg-emerald-400 animate-beacon"
                    }`}
                  />
                  <span>{isOccupied ? "OCCUPIED" : "AVAILABLE"}</span>
                </span>
              </div>

              {/* Icon & Detail */}
              <div className="flex items-center gap-3.5 py-3">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center transition-colors duration-300 shrink-0 ${
                    isOccupied
                      ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                      : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                  }`}
                >
                  {isOccupied ? (
                    <Car className="w-6 h-6" />
                  ) : (
                    <CheckCircle2 className="w-6 h-6" />
                  )}
                </div>

                <div className="flex flex-col min-w-0">
                  <span className="text-xs text-[var(--muted)] font-mono truncate">
                    {isOccupied ? "Vehicle in bay" : "Sonar beam clear"}
                  </span>
                  <span
                    className={`text-sm font-bold font-mono uppercase tracking-tight truncate ${
                      isOccupied ? "text-[var(--foreground)]" : "text-emerald-400"
                    }`}
                  >
                    {isOccupied ? "Sensor Active" : "Ready for Ingress"}
                  </span>
                </div>
              </div>

              {/* Footer: since HH:mm and dwell */}
              <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs font-mono text-[var(--muted)]">
                <span>{sinceText}</span>
                <span className="font-semibold text-[var(--foreground)] tabular-nums">
                  {dwell}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
