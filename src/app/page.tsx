"use client";

import { useCarParkStatus } from "@/hooks/useCarParkStatus";
import { Header } from "@/components/Header";
import { OfflineBanner } from "@/components/OfflineBanner";
import { OccupancyHero } from "@/components/OccupancyHero";
import { LotSchematic } from "@/components/LotSchematic";
import { VehiclesTodayCard } from "@/components/VehiclesTodayCard";
import { RecentActivity } from "@/components/RecentActivity";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function SmartCarParkPage() {
  const {
    status,
    isLoading,
    error,
    isOnline,
    secondsSinceLastSeen,
    connectionMode,
    refetch,
  } = useCarParkStatus();

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)] selection:bg-sky-500/20 selection:text-sky-300">
      {/* 1. Header */}
      <Header
        isOnline={isOnline}
        serverTime={status?.serverTime ?? null}
        connectionMode={connectionMode}
      />

      {/* Controller Offline Banner */}
      <OfflineBanner
        isOnline={isOnline}
        lastSeen={status?.lastSeen ?? null}
        secondsSinceLastSeen={secondsSinceLastSeen}
      />

      {/* Main Telemetry Body */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Loading Skeleton */}
        {isLoading && !status ? (
          <div className="w-full flex flex-col gap-6 animate-pulse">
            <div className="h-64 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-subtle)]" />
            <div className="h-44 rounded-xl bg-[var(--card-bg)] border border-[var(--border-subtle)]" />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-6 h-80 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-subtle)]" />
              <div className="lg:col-span-6 h-80 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-subtle)]" />
            </div>
          </div>
        ) : error && !status ? (
          /* Error State */
          <div className="w-full py-16 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold uppercase tracking-tight text-[var(--foreground)]">
              Unable to Load Telemetry Stream
            </h2>
            <p className="text-sm font-mono text-[var(--muted)] mt-1.5 max-w-md">
              {error}. Verify that your MongoDB connection URI is configured in your environment.
            </p>
            <button
              onClick={() => refetch()}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-500 text-slate-950 font-bold font-mono text-xs uppercase tracking-wider hover:bg-sky-400 transition-colors focus:ring-2 focus:ring-sky-400"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry Connection</span>
            </button>
          </div>
        ) : status ? (
          /* Live Dashboard Layout */
          <div className="flex flex-col gap-6 sm:gap-8">
            {/* Top-to-Bottom Structure */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
              {/* Left Column: Spaces Free Hero & Vehicles Today */}
              <div className="lg:col-span-6 flex flex-col gap-6">
                {/* 2. Very large count of free spaces */}
                <OccupancyHero free={status.free} totalBays={3} />

                {/* 5. Vehicles Today Count */}
                <VehiclesTodayCard vehiclesToday={status.vehiclesToday} />
              </div>

              {/* Right Column: Schematic & Recent Activity */}
              <div className="lg:col-span-6 flex flex-col gap-6">
                {/* 4. Minimal flat top-down schematic */}
                <LotSchematic bays={status.bays} free={status.free} />

                {/* 6. Recent Activity Telemetry Table */}
                <RecentActivity events={status.recent} />
              </div>
            </div>
          </div>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-[var(--border-subtle)] bg-[var(--background)] py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-[var(--muted)]">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="uppercase font-semibold">SMART CAR PARK PHYSICAL IOT SYSTEM</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
