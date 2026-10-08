"use client";

import { useEffect, useState } from "react";
import { formatColomboTime } from "@/lib/format";
import { SquareParking, Sun, Moon } from "lucide-react";

interface HeaderProps {
  isOnline: boolean;
  serverTime: string | null;
  connectionMode?: "sse" | "polling";
  activeTab: "live" | "analytics" | "events";
  onTabChange: (tab: "live" | "analytics" | "events") => void;
}

export function Header({
  isOnline,
  serverTime,
  connectionMode = "sse",
  activeTab,
  onTabChange,
}: HeaderProps) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // 1. Initial theme from localStorage or system
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
      setIsDark(false);
    } else {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
      localStorage.setItem("theme", "light");
      setIsDark(false);
    } else {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDark(true);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border-subtle)] bg-[var(--background)]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Header Row */}
        <div className="h-16 flex items-center justify-between gap-4">
          {/* Brand & System Title */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <SquareParking className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-[var(--foreground)] uppercase font-mono">
                  Smart Car Park
                </h1>
              </div>
            </div>
          </div>

          {/* Center Tabs for Navigation */}
          <nav className="hidden md:flex items-center p-1 rounded-xl bg-[var(--card-subtle)] border border-[var(--border-subtle)] text-xs font-mono">
            <button
              onClick={() => onTabChange("live")}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === "live"
                  ? "bg-sky-500 text-slate-950 shadow-sm"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              LIVE OPERATIONS
            </button>
            <button
              onClick={() => onTabChange("analytics")}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === "analytics"
                  ? "bg-sky-500 text-slate-950 shadow-sm"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              ANALYTICS &amp; TRENDS
            </button>
            <button
              onClick={() => onTabChange("events")}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === "events"
                  ? "bg-sky-500 text-slate-950 shadow-sm"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              EVENT AUDIT LOG
            </button>
          </nav>

          {/* Action Buttons & Status Indicators */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Controller Status Indicator */}
            <div
              id="controller-status-pill"
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full border text-[11px] sm:text-xs font-mono font-semibold uppercase tracking-wider transition-all duration-300 ${
                isOnline
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/40 shadow-[0_0_12px_rgba(78,222,163,0.15)]"
                  : "bg-rose-500/15 text-rose-400 border-rose-500/50 shadow-[0_0_12px_rgba(255,84,73,0.15)]"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isOnline ? "bg-emerald-400 animate-beacon" : "bg-rose-500"
                }`}
              />
              <span className="hidden sm:inline">{isOnline ? "ONLINE" : "OFFLINE"}</span>
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme palette"
              className="p-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--card-subtle)] hover:bg-[var(--card-high)] text-[var(--foreground)] transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-sky-600" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="flex md:hidden items-center justify-between pb-3 border-t border-[var(--border-subtle)] pt-2 text-xs font-mono gap-1">
          <button
            onClick={() => onTabChange("live")}
            className={`flex-1 py-1.5 rounded-lg text-center font-bold text-[11px] ${
              activeTab === "live"
                ? "bg-sky-500 text-slate-950 font-black"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            OPERATIONS
          </button>
          <button
            onClick={() => onTabChange("analytics")}
            className={`flex-1 py-1.5 rounded-lg text-center font-bold text-[11px] ${
              activeTab === "analytics"
                ? "bg-sky-500 text-slate-950 font-black"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            ANALYTICS
          </button>
          <button
            onClick={() => onTabChange("events")}
            className={`flex-1 py-1.5 rounded-lg text-center font-bold text-[11px] ${
              activeTab === "events"
                ? "bg-sky-500 text-slate-950 font-black"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            LOGS
          </button>
        </div>
      </div>
    </header>
  );
}
