"use client";

import { BayStatus } from "@/lib/types";
import { CarFront, SquareParking } from "lucide-react";

interface LotSchematicProps {
  bays: BayStatus[];
  free?: number;
}

export function LotSchematic({ bays }: LotSchematicProps) {
  const sortedBays = [...bays].sort((a, b) => a.id - b.id);

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)] p-5 sm:p-6 relative overflow-hidden">
      {/* Schematic Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-sky-400" />
          <h2 className="text-sm sm:text-base font-bold uppercase tracking-tight text-[var(--foreground)]">
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

            return (
              <div
                key={bay.id}
                id={`schematic-bay-slot-${bay.id}`}
                className={`flex flex-col items-center justify-between h-48 sm:h-52 rounded-xl border-2 p-3.5 transition-all duration-300 relative ${
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

                {/* Car Silhouette or Available slot representation */}
                <div className="my-auto flex flex-col items-center justify-center">
                  {isOccupied ? (
                    <div className="w-20 h-28 rounded-lg bg-[var(--card-high)] border border-rose-500/50 flex flex-col items-center justify-center text-rose-400 shadow-md">
                      <CarFront className="w-9 h-9" />
                      <span className="text-[10px] font-mono tracking-wider text-[var(--muted)] mt-1.5 uppercase font-bold">
                        VEHICLE
                      </span>
                    </div>
                  ) : (
                    <div className="w-20 h-28 rounded-lg border-2 border-dashed border-emerald-500/40 flex flex-col items-center justify-center text-emerald-400/80">
                      <SquareParking className="w-8 h-8" />
                      <span className="text-[10px] font-mono tracking-wider uppercase mt-1.5 font-bold">
                        FREE
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
