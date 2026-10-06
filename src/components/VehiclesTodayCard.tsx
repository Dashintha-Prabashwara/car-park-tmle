"use client";

import { Car, Clock, ShieldCheck } from "lucide-react";

interface VehiclesTodayCardProps {
  vehiclesToday: number;
}

export function VehiclesTodayCard({ vehiclesToday }: VehiclesTodayCardProps) {
  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)] p-6 flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono uppercase tracking-wider text-[var(--muted)] font-semibold">
          Daily Throughput Volume
        </span>
        <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-400/30 flex items-center justify-center text-sky-400">
          <Car className="w-4 h-4" />
        </div>
      </div>

      <div className="my-4">
        <div className="flex items-baseline gap-2">
          <span
            id="vehicles-today-metric"
            className="font-mono text-5xl sm:text-6xl font-extrabold text-[var(--foreground)] tracking-tight tabular-nums"
          >
            {vehiclesToday}
          </span>
          <span className="text-base sm:text-lg font-medium text-[var(--muted)]">
            {vehiclesToday === 1 ? "vehicle" : "vehicles"}
          </span>
        </div>
        <p className="text-xs sm:text-sm text-[var(--muted)] mt-1.5 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-sky-400" />
          <span>Processed today since 00:00 Asia/Colombo</span>
        </p>
      </div>

      <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs font-mono text-[var(--muted)]">
        <span className="flex items-center gap-1.5 text-emerald-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Physical Entry Gate Tally</span>
        </span>
        <span className="text-[11px] uppercase font-bold text-sky-400">
          ENTRY SENSOR ONLY
        </span>
      </div>
    </div>
  );
}
