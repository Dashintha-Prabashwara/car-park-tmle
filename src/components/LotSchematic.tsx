"use client";

import { BayStatus } from "@/lib/types";
import { ArrowRight, ShieldCheck, ShieldAlert, Car, Download } from "lucide-react";

interface LotSchematicProps {
  bays: BayStatus[];
  free: number;
}

export function LotSchematic({ bays, free }: LotSchematicProps) {
  const isFull = free === 0;
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
        {/* Entry & Exit Gate Bar */}
        <div className="flex items-center justify-between gap-2 mb-6">
          {/* Entry Gate (Left) */}
          <div
            id="schematic-entry-gate"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-all duration-300 ${
              isFull
                ? "bg-rose-500/10 border-rose-500/40 text-rose-400"
                : "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
            }`}
          >
            {isFull ? (
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <div className="flex flex-col">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)]">
                ENTRY GATE (SERVO)
              </span>
              <span className="text-xs font-mono font-bold">
                {isFull ? "[CLOSED / FULL]" : "[OPEN / READY]"}
              </span>
            </div>
          </div>

          {/* Lane Directive Corridor Arrows */}
          <div className="hidden sm:flex items-center gap-1 text-[var(--muted)] opacity-60 font-mono text-[11px] uppercase tracking-widest">
            <span>TRAFFIC FLOW</span>
            <ArrowRight className="w-3.5 h-3.5 text-sky-400" />
            <ArrowRight className="w-3.5 h-3.5 text-sky-400" />
            <ArrowRight className="w-3.5 h-3.5 text-sky-400" />
          </div>

          {/* Exit Gate (Right) */}
          <div
            id="schematic-exit-gate"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-[var(--border-strong)] bg-[var(--card-high)] text-[var(--foreground)]"
          >
            <div className="flex flex-col text-right">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--muted)]">
                EXIT GATE (SERVO)
              </span>
              <span className="text-xs font-mono font-bold text-sky-400">
                [ARMED / SENSOR]
              </span>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse shrink-0" />
          </div>
        </div>

        {/* 3 Bays Layout Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 border-y border-dashed border-[var(--border-strong)] relative">
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
                      <Car className="w-9 h-9" />
                      <span className="text-[10px] font-mono tracking-wider text-[var(--muted)] mt-1.5 uppercase font-bold">
                        VEHICLE
                      </span>
                    </div>
                  ) : (
                    <div className="w-20 h-28 rounded-lg border-2 border-dashed border-emerald-500/40 flex flex-col items-center justify-center text-emerald-400/80">
                      <Download className="w-7 h-7" />
                      <span className="text-[10px] font-mono tracking-wider uppercase mt-1.5 font-bold">
                        FREE
                      </span>
                    </div>
                  )}
                </div>

                {/* Sensor Line */}
                <div className="w-full text-center border-t border-[var(--border-subtle)] pt-1.5 font-mono text-[10px] text-[var(--muted)]">
                  ULTRASONIC SENSOR #{bay.id}
                </div>
              </div>
            );
          })}
        </div>

        {/* Corridor Technical Specs Footnote */}
        <div className="flex flex-wrap items-center justify-between pt-3 text-[11px] font-mono text-[var(--muted)]">
          <span className="flex items-center gap-1">
            <span className="text-emerald-400">•</span> GATE INTERLOCK ACTIVE
          </span>
          <span>ULTRASONIC THRESHOLD: &lt; 10 CM (3X VERIFIED)</span>
          <span className="text-sky-400">PHYSICAL SENSORS SYNCHRONIZED</span>
        </div>
      </div>
    </div>
  );
}
