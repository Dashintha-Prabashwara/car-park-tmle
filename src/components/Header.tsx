"use client";

import { useEffect, useState } from "react";
import { formatColomboTime } from "@/lib/format";
import { SquareParking, Sun, Moon } from "lucide-react";

interface HeaderProps {
  isOnline: boolean;
  serverTime: string | null;
  connectionMode?: "sse" | "polling";
}

export function Header({ isOnline, serverTime }: HeaderProps) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Check initial dark mode from class or system preference
    if (document.documentElement.classList.contains("light")) {
      setIsDark(false);
    } else {
      setIsDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
      setIsDark(false);
    } else {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
      setIsDark(true);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border-subtle)] bg-[var(--background)]/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & System Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-400/30 flex items-center justify-center text-sky-400">
            <SquareParking className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[var(--foreground)] uppercase">
              Smart Car Park
            </h1>
          </div>
        </div>

        {/* Status Indicators & Theme Toggle */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Controller Online / Offline Badge */}
          <div
            id="controller-status-pill"
            className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-mono font-semibold uppercase tracking-wider transition-all duration-300 ${
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
            <span>{isOnline ? "Controller online" : "Controller offline"}</span>
          </div>

          {/* Last Updated Server Time */}
          <div className="hidden sm:flex flex-col text-right font-mono">
            <span className="text-[11px] text-[var(--muted)]">Last sync (Asia/Colombo)</span>
            <span className="text-xs font-bold tabular-nums text-[var(--foreground)]">
              {formatColomboTime(serverTime, true)}
            </span>
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
    </header>
  );
}
