"use client";

import { Car } from "lucide-react";

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

      <div className="mt-4">
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
      </div>
    </div>
  );
}
