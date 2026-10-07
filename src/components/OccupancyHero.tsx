"use client";

import { AlertTriangle } from "lucide-react";

interface OccupancyHeroProps {
  free: number;
  totalBays?: number;
}

export function OccupancyHero({ free, totalBays = 3 }: OccupancyHeroProps) {
  const isFull = free === 0;
  const occupiedCount = totalBays - free;
  const percentage = Math.round((occupiedCount / totalBays) * 100);
  const freeLabel = free === 1 ? "space free" : "spaces free";

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-6 sm:p-8 transition-all duration-300 ${
        isFull
          ? "bg-[var(--card-bg)] border-rose-500/50 shadow-[0_0_24px_rgba(255,84,73,0.12)]"
          : "bg-[var(--card-bg)] border-[var(--border-subtle)]"
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        {/* Availability Hero Display */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono tracking-widest uppercase font-semibold text-[var(--muted)]">
              REAL-TIME SPACE AVAILABILITY
            </span>
          </div>

          <div className="flex items-baseline gap-4 mt-2">
            <span
              id="hero-free-count"
              className={`font-mono text-7xl sm:text-8xl md:text-9xl font-extrabold tracking-tighter tabular-nums transition-colors duration-300 ${
                isFull ? "text-rose-500" : "text-sky-400"
              }`}
            >
              {free}
            </span>
            <div className="flex flex-col">
              <span
                id="hero-free-label"
                className={`text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight uppercase ${
                  isFull ? "text-rose-400" : "text-[var(--foreground)]"
                }`}
              >
                {freeLabel}
              </span>
              <span className="text-xs sm:text-sm font-mono text-[var(--muted)] mt-0.5">
                OF {totalBays} TOTAL DOCK BAYS
              </span>
            </div>
          </div>
        </div>

        {/* Facility Load */}
        <div className="flex flex-col md:items-end justify-between border-t md:border-t-0 border-[var(--border-subtle)] pt-4 md:pt-0">
          <div className="md:text-right">
            <span className="text-xs font-mono text-[var(--muted)] uppercase tracking-wider">
              FACILITY LOAD
            </span>
            <div className="font-mono text-3xl sm:text-4xl font-bold text-[var(--foreground)] mt-1 tabular-nums">
              {percentage}%
            </div>
          </div>
        </div>
      </div>

      {/* Occupancy Gauge Progress Bar */}
      <div className="mt-6 pt-5 border-t border-[var(--border-subtle)]">
        <div className="flex items-center justify-between text-xs font-mono text-[var(--muted)] mb-2">
          <span className="uppercase tracking-wider">OCCUPANCY GAUGE</span>
          <span className="font-bold text-[var(--foreground)] tabular-nums">
            {occupiedCount} / {totalBays} Bays Filled
          </span>
        </div>
        <div className="w-full h-3 rounded-full bg-[var(--card-subtle)] overflow-hidden p-0.5 border border-[var(--border-subtle)]">
          <div
            id="occupancy-progress-bar"
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              isFull
                ? "bg-rose-500 shadow-[0_0_12px_rgba(255,84,73,0.5)]"
                : "bg-sky-400 shadow-[0_0_12px_rgba(142,213,255,0.4)]"
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Prominent Full State Banner */}
      {isFull && (
        <div
          role="alert"
          className="mt-5 p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/50 flex items-center gap-3 text-rose-200 animate-fadeIn"
        >
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 animate-pulse" />
          <div className="flex flex-col">
            <span className="text-xs sm:text-sm font-mono font-bold uppercase tracking-wider text-white">
              CAR PARK FULL
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
