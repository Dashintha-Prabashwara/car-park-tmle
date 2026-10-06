"use client";

import { useEffect, useRef } from "react";
import { RecentEvent } from "@/lib/types";
import { formatColomboTime, formatEventSentence } from "@/lib/format";
import { History, Inbox } from "lucide-react";

interface RecentActivityProps {
  events: RecentEvent[];
}

export function RecentActivity({ events }: RecentActivityProps) {
  const previousTopIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (events.length > 0) {
      previousTopIdRef.current = events[0].id;
    }
  }, [events]);

  return (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--card-bg)] p-5 sm:p-6 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-sky-400" />
          <h2 className="text-sm sm:text-base font-bold uppercase tracking-tight text-[var(--foreground)]">
            Recent Activity Telemetry
          </h2>
        </div>
        <span className="text-[11px] font-mono text-[var(--muted)] uppercase tracking-wider">
          LAST 10 EVENTS
        </span>
      </div>

      {/* Events List or Empty State */}
      {events.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-[var(--card-subtle)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--muted)] mb-3">
            <Inbox className="w-6 h-6" />
          </div>
          <p className="text-sm font-mono text-[var(--muted)] font-medium">
            No activity yet
          </p>
          <p className="text-xs text-[var(--muted)] mt-1 max-w-sm">
            Events pushed by the ESP32 (entry, exit, bay status updates) will appear here in real time.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto w-full mt-2">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="text-[var(--muted)] border-b border-[var(--border-subtle)] uppercase text-[10px] tracking-wider">
                <th className="py-3 pr-3 font-semibold">Time (Asia/Colombo)</th>
                <th className="py-3 px-3 font-semibold">Category</th>
                <th className="py-3 pl-3 font-semibold">Telemetry Event</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--foreground)]">
              {events.map((event, index) => {
                const { sentence, category, badgeClass } = formatEventSentence(event);
                const isNewest = index === 0;

                return (
                  <tr
                    key={event.id || `${event.createdAt}-${index}`}
                    className={`transition-colors duration-200 hover:bg-[var(--card-subtle)] ${
                      isNewest ? "animate-new-row" : ""
                    }`}
                  >
                    {/* Timestamp */}
                    <td className="py-3 pr-3 text-[var(--muted)] tabular-nums whitespace-nowrap">
                      {formatColomboTime(event.createdAt, true)}
                    </td>

                    {/* Category Badge */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${badgeClass}`}
                      >
                        {category}
                      </span>
                    </td>

                    {/* Event Sentence */}
                    <td className="py-3 pl-3 font-sans text-xs sm:text-sm font-medium text-[var(--foreground)]">
                      {sentence}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
