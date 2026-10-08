"use client";

import { useEffect, useState } from "react";
import { formatColomboTime, formatEventSentence } from "@/lib/format";
import { RecentEvent } from "@/lib/types";
import {
  Download,
  Filter,
  RefreshCw,
  Search,
  Activity,
  LogIn,
  LogOut,
  CarFront,
  SquareParking,
  AlertTriangle,
} from "lucide-react";

function renderEventIcon(event: string, state?: boolean) {
  switch (event) {
    case "ENTRY":
      return <LogIn className="w-3 h-3 shrink-0" />;
    case "EXIT":
      return <LogOut className="w-3 h-3 shrink-0" />;
    case "BAY":
      return state ? (
        <CarFront className="w-3 h-3 shrink-0" />
      ) : (
        <SquareParking className="w-3 h-3 shrink-0" />
      );
    case "FULL":
      return <AlertTriangle className="w-3 h-3 shrink-0" />;
    default:
      return <Activity className="w-3 h-3 shrink-0" />;
  }
}

export function EventAuditLogView() {
  const [events, setEvents] = useState<RecentEvent[]>([]);
  const [category, setCategory] = useState<string>("ALL");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const fetchEvents = async (cursor?: string) => {
    if (!cursor) setIsLoading(true);
    else setIsLoadingMore(true);

    try {
      const params = new URLSearchParams();
      if (category !== "ALL") params.set("category", category);
      if (cursor) params.set("cursor", cursor);
      params.set("limit", "25");

      const res = await fetch(`/api/events?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load events");
      const data = await res.json();

      const formatted: RecentEvent[] = data.events.map((r: { id: number; created_at: string; event: string; bay?: number; state?: boolean }) => ({
        id: String(r.id),
        createdAt: new Date(r.created_at).toISOString(),
        event: r.event as RecentEvent["event"],
        bay: r.bay,
        state: r.state !== null && r.state !== undefined ? Boolean(r.state) : undefined,
      }));

      if (cursor) {
        setEvents((prev) => [...prev, ...formatted]);
      } else {
        setEvents(formatted);
      }

      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [category]);

  const filteredEvents = events.filter((ev) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const sentence = formatEventSentence(ev).sentence.toLowerCase();
    return sentence.includes(q) || ev.event.toLowerCase().includes(q);
  });

  const exportCsvUrl = `/api/events/export${category !== "ALL" ? `?category=${category}` : ""}`;

  return (
    <div className="flex flex-col gap-6 animate-fadeIn font-mono text-xs">
      {/* Header & Filter Controls */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)] p-5 sm:p-6 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
          <div>
            <h2 className="text-base sm:text-lg font-bold uppercase tracking-tight text-[var(--foreground)]">
              Historical Event Audit Log
            </h2>
            <p className="text-xs text-[var(--muted)] font-sans">
              Searchable, filterable audit trail of all physical IoT gate transitions &amp; bay status updates
            </p>
          </div>

          {/* CSV Export Button */}
          <a
            href={exportCsvUrl}
            download
            className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold uppercase tracking-wider transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </a>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            {["ALL", "ENTRY", "EXIT", "BAY", "FULL", "SYSTEM_START"].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-lg font-bold uppercase text-[11px] whitespace-nowrap transition-colors border ${
                  category === cat
                    ? "bg-sky-500 text-slate-950 border-sky-400"
                    : "bg-[var(--card-subtle)] border-[var(--border-subtle)] text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search box & Refresh */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[var(--card-subtle)] border border-[var(--border-subtle)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-1 focus:ring-sky-400"
              />
            </div>

            <button
              onClick={() => fetchEvents()}
              title="Refresh log"
              className="p-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--card-subtle)] hover:bg-[var(--card-high)] text-[var(--muted)] hover:text-sky-400 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Events Table */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)] p-5 sm:p-6 overflow-x-auto">
        {isLoading ? (
          <div className="py-16 text-center text-[var(--muted)]">Loading events...</div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-16 text-center text-[var(--muted)]">No matching events found.</div>
        ) : (
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="text-[var(--muted)] border-b border-[var(--border-subtle)] uppercase text-[10px] tracking-wider">
                <th className="py-3 pr-3 font-semibold">ID</th>
                <th className="py-3 px-3 font-semibold">Time (Asia/Colombo)</th>
                <th className="py-3 px-3 font-semibold">Category</th>
                <th className="py-3 pl-3 font-semibold">Telemetry Event</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--foreground)]">
              {filteredEvents.map((event) => {
                const { sentence, category: catLabel, badgeClass } = formatEventSentence(event);

                return (
                  <tr key={event.id} className="hover:bg-[var(--card-subtle)] transition-colors">
                    <td className="py-3 pr-3 text-[var(--muted)] tabular-nums">#{event.id}</td>
                    <td className="py-3 px-3 text-[var(--muted)] tabular-nums whitespace-nowrap">
                      {formatColomboTime(event.createdAt, true)}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${badgeClass}`}
                      >
                        {renderEventIcon(event.event, event.state)}
                        <span>{catLabel}</span>
                      </span>
                    </td>
                    <td className="py-3 pl-3 font-sans text-xs sm:text-sm font-medium text-[var(--foreground)]">
                      {sentence}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Keyset Pagination: Load More */}
        {hasMore && !isLoading && (
          <div className="mt-6 pt-4 border-t border-[var(--border-subtle)] flex justify-center">
            <button
              onClick={() => fetchEvents(nextCursor || undefined)}
              disabled={isLoadingMore}
              className="px-5 py-2 rounded-xl bg-[var(--card-subtle)] hover:bg-[var(--card-high)] border border-[var(--border-subtle)] text-sky-400 font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
            >
              {isLoadingMore ? "Loading..." : "Load Older Events"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
