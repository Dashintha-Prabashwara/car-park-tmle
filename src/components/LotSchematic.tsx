"use client";

import { useEffect, useState } from "react";
import { BayStatus, AnomalyReport } from "@/lib/types";
import { formatLiveDwellTimer } from "@/lib/format";
import { CarFront, SquareParking, AlertTriangle, Clock } from "lucide-react";

interface LotSchematicProps {
  bays: BayStatus[];
  free?: number;
  anomalies?: AnomalyReport;
}

export function LotSchematic({ bays, anomalies }: LotSchematicProps) {
  const [nowMs, setNowMs] = useState<number>(Date.now());

  // Client-side 1-second ticker for live dwell duration (costing 0 server requests)
  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const sortedBays = [...bays].sort((a, b) => a.id - b.id);

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)] p-5 sm:p-6 relative overflow-hidden">
      {/* Schematic Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-sky-400" />
          <h2 className="text-sm sm:text-base font-bold uppercase tracking-tight text-[var(--foreground)] font-mono">
            Technical Lot Schematic
          </h2>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-emerald-400" />
            <span className="text-[var(--muted)]">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-rose-500" />
            <span className="text-[var(--muted)]">Occupied</span>
          </div>
        </div>
      </div>

      {/* Blueprint Schematic Field */}
      <div className="mt-5 rounded-xl bg-[var(--card-subtle)] border border-[var(--border-subtle)] p-4 sm:p-6 relative">
        {/* 3 Bays Layout Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {sortedBays.map((bay) => {
            const isOccupied = bay.occupied;
            const dwellString = formatLiveDwellTimer(bay.changedAt, nowMs);

            const isStale = anomalies?.staleSensors?.includes(bay.id);
            const stuckInfo = anomalies?.stuckOccupiedBays?.find((s) => s.bay === bay.id);

            return (
              <div
                key={bay.id}
                id={`schematic-bay-slot-${bay.id}`}
                className={`flex flex-col items-center justify-between min-h-56 rounded-xl border-2 p-3.5 transition-all duration-300 relative ${
                  isOccupied
                    ? "border-rose-500/60 bg-rose-500/5 shadow-[inset_0_0_20px_rgba(255,84,73,0.06)]"
                    : "border-dashed border-emerald-500/50 bg-emerald-500/5 shadow-[inset_0_0_20px_rgba(78,222,163,0.06)]"
                }`}
              >
                {/* Bay Header */}
                <div className="w-full flex items-center justify-between font-mono text-xs font-bold">
                  <span className={isOccupied ? "text-rose-400" : "text-emerald-400"}>
                    BAY P{bay.id}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase ${
                      isOccupied
                        ? "bg-rose-500/20 text-rose-400"
                        : "bg-emerald-500/20 text-emerald-400"
                    }`}
                  >
                    {isOccupied ? "OCCUPIED" : "VACANT"}
                  </span>
                </div>

                {/* Sensor Anomaly Warnings if triggered */}
                {isStale && (
                  <div className="w-full mt-1.5 px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/40 text-[10px] font-mono text-amber-300 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    <span>Flickering sensor</span>
                  </div>
                )}
                {stuckInfo && (
                  <div className="w-full mt-1.5 px-2 py-0.5 rounded bg-rose-500/15 border border-rose-500/40 text-[10px] font-mono text-rose-300 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    <span>Stuck &gt; 24h ({stuckInfo.hours}h)</span>
                  </div>
                )}

                {/* Car Silhouette or Available slot representation */}
                <div className="my-auto py-3 flex flex-col items-center justify-center">
                  {isOccupied ? (
                    <div className="w-20 h-24 rounded-lg bg-[var(--card-high)] border border-rose-500/50 flex flex-col items-center justify-center text-rose-400 shadow-md">
                      <CarFront className="w-9 h-9" />
                      <span className="text-[10px] font-mono tracking-wider text-[var(--muted)] mt-1 uppercase font-bold">
                        PARKED
                      </span>
                    </div>
                  ) : (
                    <div className="w-20 h-24 rounded-lg border-2 border-dashed border-emerald-500/40 flex flex-col items-center justify-center text-emerald-400/80">
                      <SquareParking className="w-8 h-8" />
                      <span className="text-[10px] font-mono tracking-wider uppercase mt-1 font-bold">
                        FREE
                      </span>
                    </div>
                  )}
                </div>

                {/* Live Dwell Timer Footer (client-side real-time calculation) */}
                <div className="w-full pt-2 border-t border-[var(--border-subtle)] flex items-center justify-center gap-1.5 text-[11px] font-mono">
                  <Clock className="w-3 h-3 text-[var(--muted)]" />
                  <span className="text-[var(--muted)]">
                    {isOccupied ? "Occupied:" : "Vacant:"}
                  </span>
                  <span className="font-bold text-[var(--foreground)] tabular-nums">
                    {dwellString}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
