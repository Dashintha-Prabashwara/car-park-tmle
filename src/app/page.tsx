"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useCarParkStatus } from "@/hooks/useCarParkStatus";
import { Header } from "@/components/Header";
import { OfflineBanner } from "@/components/OfflineBanner";
import { OccupancyHero } from "@/components/OccupancyHero";
import { LotSchematic } from "@/components/LotSchematic";
import { VehiclesTodayCard } from "@/components/VehiclesTodayCard";
import { RecentActivity } from "@/components/RecentActivity";
import { AnomalyAlerts } from "@/components/AnomalyAlerts";
import { ToastContainer, ToastMessage } from "@/components/Toast";
import { AlertCircle, Car, CheckCircle2, Navigation, RefreshCw } from "lucide-react";

// Lazy-load Analytics and Event Audit views for instant First Contentful Paint
const AnalyticsView = dynamic(
  () => import("@/components/AnalyticsView").then((mod) => mod.AnalyticsView),
  {
    loading: () => (
      <div className="w-full h-96 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-subtle)] animate-pulse flex items-center justify-center text-xs font-mono text-[var(--muted)]">
        Loading Analytics Engine...
      </div>
    ),
  }
);

const EventAuditLogView = dynamic(
  () => import("@/components/EventAuditLogView").then((mod) => mod.EventAuditLogView),
  {
    loading: () => (
      <div className="w-full h-96 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-subtle)] animate-pulse flex items-center justify-center text-xs font-mono text-[var(--muted)]">
        Loading Historical Event Logs...
      </div>
    ),
  }
);

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

  const [activeTab, setActiveTab] = useState<"live" | "analytics" | "events">("live");
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Previous state trackers to detect meaningful live transitions
  const prevStatusRef = useRef<{
    free: number;
    bays: { id: number; occupied: boolean }[];
    online: boolean;
  } | null>(null);

  // Helper to push toast
  const addToast = (title: string, type: ToastMessage["type"]) => {
    const timeStr = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Colombo",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }).format(new Date());

    const newToast: ToastMessage = {
      id: Math.random().toString(36).substring(2, 9),
      title,
      type,
      time: timeStr,
    };

    setToasts((prev) => [newToast, ...prev.slice(0, 3)]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
    }, 4500);
  };

  // State diff detector for Toasts
  useEffect(() => {
    if (!status) return;

    if (!prevStatusRef.current) {
      prevStatusRef.current = {
        free: status.free,
        bays: status.bays.map((b) => ({ id: b.id, occupied: b.occupied })),
        online: isOnline,
      };
      return;
    }

    const prev = prevStatusRef.current;

    // 1. Bay transitions
    status.bays.forEach((currBay) => {
      const oldBay = prev.bays.find((b) => b.id === currBay.id);
      if (oldBay && oldBay.occupied !== currBay.occupied) {
        if (currBay.occupied) {
          addToast(`Bay P${currBay.id} is now OCCUPIED`, "info");
        } else {
          addToast(`Bay P${currBay.id} is now VACANT`, "success");
        }
      }
    });

    // 2. Full Lockout Transition
    if (prev.free > 0 && status.free === 0) {
      addToast("Car park is now FULL. Entry gate locked.", "warning");
    }

    // 3. Controller Online/Offline transition
    if (prev.online && !isOnline) {
      addToast("Controller went OFFLINE. Showing last known state.", "error");
    } else if (!prev.online && isOnline) {
      addToast("Controller connection RESTORED (Online).", "success");
    }

    prevStatusRef.current = {
      free: status.free,
      bays: status.bays.map((b) => ({ id: b.id, occupied: b.occupied })),
      online: isOnline,
    };
  }, [status, isOnline]);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)] selection:bg-sky-500/20 selection:text-sky-300">
      {/* 1. Header with persistent theme and tabs */}
      <Header
        isOnline={isOnline}
        serverTime={status?.serverTime ?? null}
        connectionMode={connectionMode}
        activeTab={activeTab}
        onTabChange={setActiveTab}
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
            <h2 className="text-xl font-bold uppercase tracking-tight text-[var(--foreground)] font-mono">
              Unable to Load Telemetry Stream
            </h2>
            <p className="text-sm font-mono text-[var(--muted)] mt-1.5 max-w-md">
              {error}. Verify that your MySQL connection settings are configured in your environment.
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
          <>
            {/* TAB 1: LIVE OPERATIONS */}
            {activeTab === "live" && (
              <div className="flex flex-col gap-6 sm:gap-8 animate-fadeIn">
                {/* Mobile "Check Before You Drive" Quick Card */}
                <div className="block sm:hidden p-4 rounded-xl bg-gradient-to-r from-sky-500/15 to-emerald-500/15 border border-sky-500/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Navigation className="w-4 h-4 text-sky-400" />
                      <span className="text-xs font-mono font-bold uppercase text-[var(--foreground)]">
                        Check Before You Drive
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-black uppercase ${
                        status.free > 0
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-rose-500/20 text-rose-400"
                      }`}
                    >
                      {status.free > 0 ? `${status.free} SPACES AVAILABLE` : "LOT FULL"}
                    </span>
                  </div>
                </div>

                {/* Hardware Sensor Anomaly Alerts if any trigger */}
                <AnomalyAlerts anomalies={status.anomalies} />

                {/* Top-to-Bottom Structure */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
                  {/* Left Column: Spaces Free Hero & Vehicles Today */}
                  <div className="lg:col-span-6 flex flex-col gap-6">
                    {/* Very large count of free spaces */}
                    <OccupancyHero free={status.free} totalBays={3} />

                    {/* Vehicles Today Count */}
                    <VehiclesTodayCard vehiclesToday={status.vehiclesToday} />
                  </div>

                  {/* Right Column: Schematic & Recent Activity */}
                  <div className="lg:col-span-6 flex flex-col gap-6">
                    {/* Minimal flat top-down schematic with live dwell timers */}
                    <LotSchematic
                      bays={status.bays}
                      free={status.free}
                      anomalies={status.anomalies}
                    />

                    {/* Recent Activity Telemetry Table */}
                    <RecentActivity events={status.recent} />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: HISTORICAL ANALYTICS & TRENDS */}
            {activeTab === "analytics" && <AnalyticsView />}

            {/* TAB 3: EVENT AUDIT LOG & CSV EXPORT */}
            {activeTab === "events" && <EventAuditLogView />}
          </>
        ) : null}
      </main>

      {/* Floating State Diff Toasts */}
      <ToastContainer
        toasts={toasts}
        onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />

      {/* Footer */}
      <footer className="w-full border-t border-[var(--border-subtle)] bg-[var(--background)] py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-[var(--muted)]">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="uppercase font-semibold">SMART CAR PARK PHYSICAL IOT SYSTEM</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Active Transport: {connectionMode === "sse" ? "SSE Push" : "HTTP Polling"}</span>
            <span>Asia/Colombo (+05:30)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
