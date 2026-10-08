"use client";

import { useEffect, useState } from "react";
import { AnalyticsResponse } from "@/lib/types";
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  Flame,
  Layers,
  RefreshCw,
  TrendingUp,
} from "lucide-react";

export function AnalyticsView() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async (isManual = false) => {
    if (isManual) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const url = isManual
        ? `/api/analytics?fresh=true&t=${Date.now()}`
        : `/api/analytics?t=${Date.now()}`;

      // Enforce minimum 650ms spin animation on manual refresh so user clearly sees the activity
      const [res] = await Promise.all([
        fetch(url, { cache: "no-store" }),
        isManual ? new Promise((resolve) => setTimeout(resolve, 650)) : Promise.resolve(),
      ]);

      if (!res.ok) throw new Error("Failed to load analytics");
      const json: AnalyticsResponse = await res.json();
      setData(json);
      setError(null);

      if (isManual) {
        setRefreshMessage("Analytics & trends successfully refreshed!");
        setTimeout(() => setRefreshMessage(null), 3500);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error loading data");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(false);
  }, []);

  if (isLoading && !data) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-64 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-subtle)]" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-44 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-subtle)]" />
          <div className="h-44 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-subtle)]" />
          <div className="h-44 rounded-2xl bg-[var(--card-bg)] border border-[var(--border-subtle)]" />
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm font-mono text-rose-400">{error}</p>
        <button
          onClick={() => fetchAnalytics(true)}
          className="mt-4 px-4 py-2 rounded-lg bg-sky-500 text-slate-950 font-bold font-mono text-xs uppercase"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Heatmap max calculation for color scaling
  const maxHeatmapCount = Math.max(1, ...data.heatmap.map((c) => c.count));

  // Occupancy Chart SVG calculation
  const chartPoints = data.occupancyHistory || [];
  const svgWidth = 800;
  const svgHeight = 160;
  const paddingX = 40;
  const paddingY = 20;

  const pointCoords = chartPoints.map((pt, i) => {
    const x = paddingX + (i / Math.max(1, chartPoints.length - 1)) * (svgWidth - paddingX * 2);
    const y = svgHeight - paddingY - (pt.occupied / 3) * (svgHeight - paddingY * 2);
    return { x, y, pt };
  });

  const pathD = pointCoords.reduce(
    (acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`,
    ""
  );

  const areaD =
    pathD && pointCoords.length > 0
      ? `${pathD} L ${pointCoords[pointCoords.length - 1].x.toFixed(1)} ${svgHeight - paddingY} L ${pointCoords[0].x.toFixed(1)} ${svgHeight - paddingY} Z`
      : "";

  return (
    <div className="flex flex-col gap-6 sm:gap-8 animate-fadeIn font-sans">
      {/* Analytics Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[var(--border-subtle)]">
        <div>
          <h2 className="text-lg font-bold uppercase tracking-tight text-[var(--foreground)] font-mono">
            Historical SCADA Intelligence
          </h2>
          <p className="text-xs text-[var(--muted)] font-mono">
            Aggregated patterns, parking dwell distributions, and facility load trends
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {refreshMessage && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono animate-fadeIn">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{refreshMessage}</span>
            </div>
          )}
          <button
            onClick={() => fetchAnalytics(true)}
            disabled={isRefreshing}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--card-subtle)] hover:bg-[var(--card-high)] text-xs font-mono text-[var(--muted)] hover:text-sky-400 transition-colors disabled:opacity-60"
            title="Force refresh analytics metrics from database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-sky-400" : ""}`} />
            <span>{isRefreshing ? "Refreshing..." : "Refresh Analytics"}</span>
          </button>
        </div>
      </div>

      {/* Row 1: Throughput Comparison Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today vs Yesterday */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)] p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-[var(--muted)]">
            <span>TODAY VS YESTERDAY</span>
            <TrendingUp className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="text-3xl font-black font-mono text-[var(--foreground)] tabular-nums">
              {data.throughput.today}
            </span>
            <span className="text-xs font-mono text-[var(--muted)]">
              vs {data.throughput.yesterday} yesterday
            </span>
          </div>
          <div className="mt-3 text-[11px] font-mono text-emerald-400">
            {data.throughput.today >= data.throughput.yesterday
              ? `▲ +${data.throughput.today - data.throughput.yesterday} vehicles`
              : `▼ ${data.throughput.today - data.throughput.yesterday} vehicles`}
          </div>
        </div>

        {/* Same Day Last Week */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)] p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-[var(--muted)]">
            <span>SAME WEEKDAY PRIOR</span>
            <Calendar className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="text-3xl font-black font-mono text-[var(--foreground)] tabular-nums">
              {data.throughput.today}
            </span>
            <span className="text-xs font-mono text-[var(--muted)]">
              vs {data.throughput.lastWeekSameDay} prior week
            </span>
          </div>
          <div className="mt-3 text-[11px] font-mono text-[var(--muted)]">
            7-day cycle baseline
          </div>
        </div>

        {/* Weekly Throughput */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)] p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-[var(--muted)]">
            <span>WEEKLY THROUGHPUT</span>
            <BarChart3 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="text-3xl font-black font-mono text-[var(--foreground)] tabular-nums">
              {data.throughput.thisWeek}
            </span>
            <span className="text-xs font-mono text-[var(--muted)]">
              vs {data.throughput.lastWeek} last week
            </span>
          </div>
          <div className="mt-3 text-[11px] font-mono text-[var(--muted)]">
            Rolling 7 days
          </div>
        </div>

        {/* Full Lot & Turnaways */}
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)] p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-[var(--muted)]">
            <span>FULL LOCKOUT STATS</span>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="text-3xl font-black font-mono text-rose-400 tabular-nums">
              {data.fullStats.timesReachedFullToday}
            </span>
            <span className="text-xs font-mono text-[var(--muted)]">
              episodes ({data.fullStats.totalMinutesFullToday}m total)
            </span>
          </div>
          <div className="mt-3 text-[11px] font-mono text-rose-400">
            {data.fullStats.turnawaysToday} turnaways recorded
          </div>
        </div>
      </div>

      {/* Row 2: Occupancy Over Time Chart (SVG 24h Area Chart) */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)] p-5 sm:p-6">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-bold uppercase tracking-tight text-[var(--foreground)] font-mono">
              Occupancy Over Time (Past 24 Hours)
            </h3>
          </div>
          <span className="text-xs font-mono text-[var(--muted)]">
            0 TO 3 BAYS
          </span>
        </div>

        {/* SVG Chart Canvas */}
        <div className="mt-4 w-full overflow-hidden">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-44 overflow-visible"
          >
            <defs>
              <linearGradient id="occGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8ed5ff" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#8ed5ff" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines (0, 1, 2, 3 bays) */}
            {[0, 1, 2, 3].map((val) => {
              const y = svgHeight - paddingY - (val / 3) * (svgHeight - paddingY * 2);
              return (
                <g key={`grid-${val}`}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={svgWidth - paddingX}
                    y2={y}
                    stroke="var(--border-subtle)"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  <text
                    x={paddingX - 10}
                    y={y + 4}
                    fill="var(--muted)"
                    fontSize="10"
                    fontFamily="monospace"
                    textAnchor="end"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Filled Area */}
            {areaD && <path d={areaD} fill="url(#occGradient)" />}

            {/* Solid Line */}
            {pathD && (
              <path
                d={pathD}
                fill="none"
                stroke="#8ed5ff"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Data points */}
            {pointCoords.map((pt, idx) => (
              <circle
                key={`pt-${idx}`}
                cx={pt.x}
                cy={pt.y}
                r="3.5"
                fill="#0f131d"
                stroke="#8ed5ff"
                strokeWidth="2"
              />
            ))}
          </svg>
        </div>

        {/* X-axis time label row */}
        <div className="flex justify-between text-[10px] font-mono text-[var(--muted)] px-8 mt-1 border-t border-[var(--border-subtle)] pt-2">
          <span>24h ago</span>
          <span>18h ago</span>
          <span>12h ago</span>
          <span>6h ago</span>
          <span>Now</span>
        </div>
      </div>

      {/* Row 3: Peak Hours Heatmap (7x24 Grid) */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)] p-5 sm:p-6 overflow-x-auto">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)] min-w-[860px]">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-bold uppercase tracking-tight text-[var(--foreground)] font-mono">
              Peak Hours Ingress Heatmap (7 × 24 Weekday &amp; Hour)
            </h3>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--muted)]">
            <span>Low</span>
            <div className="w-3 h-3 rounded bg-[var(--card-subtle)] border border-[var(--border-subtle)]" />
            <div className="w-3 h-3 rounded bg-sky-900/60" />
            <div className="w-3 h-3 rounded bg-sky-600" />
            <div className="w-3 h-3 rounded bg-sky-400" />
            <span>Peak</span>
          </div>
        </div>

        {/* 7x24 Heatmap Grid Table */}
        <div className="mt-5 min-w-[860px]">
          {/* Hour column labels */}
          <div className="grid grid-cols-25 gap-1 mb-1 font-mono text-[9px] text-[var(--muted)] text-center">
            <div className="text-left font-bold">DAY</div>
            {Array.from({ length: 24 }).map((_, h) => {
              const hour12 = h % 12 === 0 ? 12 : h % 12;
              const period = h < 12 ? "AM" : "PM";
              return (
                <div
                  key={`hr-lbl-${h}`}
                  className="whitespace-nowrap text-[8px] sm:text-[9px] font-mono leading-tight flex flex-col items-center justify-center"
                  title={`${hour12} ${period}`}
                >
                  <span className="font-semibold">{hour12}</span>
                  <span className="text-[7.5px] opacity-75">{period}</span>
                </div>
              );
            })}
          </div>

          {/* Weekday rows */}
          {weekdays.map((dayName, dayIndex) => {
            const dow = dayIndex + 1; // 1 = Sun, ..., 7 = Sat
            return (
              <div
                key={`day-${dayName}`}
                className="grid grid-cols-25 gap-1 my-1 items-center font-mono text-xs"
              >
                {/* Day label */}
                <div className="text-[10px] font-bold text-[var(--muted)]">{dayName}</div>

                {/* 24 Hour blocks */}
                {Array.from({ length: 24 }).map((_, hour) => {
                  const cell = data.heatmap.find((c) => c.weekday === dow && c.hour === hour);
                  const count = cell ? cell.count : 0;
                  const ratio = count / maxHeatmapCount;
                  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
                  const period = hour < 12 ? "AM" : "PM";

                  let bgClass = "bg-[var(--card-subtle)] border-[var(--border-subtle)]";
                  if (count > 0) {
                    if (ratio > 0.6) bgClass = "bg-sky-400 text-slate-950 font-bold";
                    else if (ratio > 0.3) bgClass = "bg-sky-600/80 text-white";
                    else bgClass = "bg-sky-900/50 text-sky-200";
                  }

                  return (
                    <div
                      key={`cell-${dow}-${hour}`}
                      title={`${dayName} at ${hour12}:00 ${period} - ${count} vehicle entries`}
                      className={`h-6 rounded flex items-center justify-center text-[9px] border transition-transform hover:scale-110 cursor-pointer ${bgClass}`}
                    >
                      {count > 0 ? count : ""}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Row 4: Average Duration & Per-Bay Utilization */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Parking Duration Stats */}
        <div className="lg:col-span-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)] p-5 sm:p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold uppercase tracking-tight text-[var(--foreground)] font-mono">
                Parking Dwell Time Statistics
              </h3>
            </div>
            <span className="text-[10px] font-mono text-[var(--muted)]">
              {data.duration.sampleCount} COMPLETED STAYS
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 my-4 font-mono text-center">
            <div className="p-3.5 rounded-xl bg-[var(--card-subtle)] border border-[var(--border-subtle)]">
              <span className="text-[10px] text-[var(--muted)] uppercase">AVERAGE STAY</span>
              <div className="text-2xl font-black text-sky-400 mt-1 tabular-nums">
                {data.duration.averageMinutes}m
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-[var(--card-subtle)] border border-[var(--border-subtle)]">
              <span className="text-[10px] text-[var(--muted)] uppercase">MEDIAN STAY</span>
              <div className="text-2xl font-black text-emerald-400 mt-1 tabular-nums">
                {data.duration.medianMinutes}m
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-[var(--card-subtle)] border border-[var(--border-subtle)]">
              <span className="text-[10px] text-[var(--muted)] uppercase">LONGEST STAY</span>
              <div className="text-2xl font-black text-indigo-400 mt-1 tabular-nums">
                {data.duration.longestMinutes}m
              </div>
            </div>
          </div>

          <p className="text-xs font-mono text-[var(--muted)] pt-2 border-t border-[var(--border-subtle)]">
            Calculated from physical sensor occupied/vacant transition timestamps in MySQL.
          </p>
        </div>

        {/* Per-Bay Utilization Today */}
        <div className="lg:col-span-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)] p-5 sm:p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold uppercase tracking-tight text-[var(--foreground)] font-mono">
                Per-Bay Utilization (Today)
              </h3>
            </div>
            <span className="text-[10px] font-mono text-[var(--muted)]">
              PERCENTAGE OCCUPIED
            </span>
          </div>

          <div className="flex flex-col gap-4 my-4">
            {data.utilization.map((bay) => (
              <div key={`util-${bay.bayId}`} className="flex flex-col gap-1.5 font-mono text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[var(--foreground)]">BAY P{bay.bayId}</span>
                  <span className="text-[var(--muted)] tabular-nums">
                    {bay.utilizationPercent}% ({bay.minutesOccupiedToday} mins occupied)
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-[var(--card-subtle)] overflow-hidden border border-[var(--border-subtle)]">
                  <div
                    className="h-full rounded-full bg-sky-400 transition-all duration-500"
                    style={{ width: `${bay.utilizationPercent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs font-mono text-[var(--muted)] pt-2 border-t border-[var(--border-subtle)]">
            Identifies uneven driver preference across bay positions (e.g. entrance proximity).
          </p>
        </div>
      </div>
    </div>
  );
}
