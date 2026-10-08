"use client";

import { AlertCircle, CheckCircle, Info, X } from "lucide-react";

export interface ToastMessage {
  id: string;
  title: string;
  type: "info" | "success" | "warning" | "error";
  time: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => {
        let borderClass = "border-sky-500/40 bg-[var(--card-bg)] text-sky-400";
        let Icon = Info;

        if (toast.type === "success") {
          borderClass = "border-emerald-500/40 bg-[var(--card-bg)] text-emerald-400";
          Icon = CheckCircle;
        } else if (toast.type === "warning" || toast.type === "error") {
          borderClass = "border-rose-500/40 bg-[var(--card-bg)] text-rose-400";
          Icon = AlertCircle;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 animate-slide-in ${borderClass}`}
          >
            <Icon className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs font-mono">
              <p className="font-semibold text-[var(--foreground)] leading-tight">{toast.title}</p>
              <span className="text-[10px] text-[var(--muted)] mt-0.5 block">{toast.time}</span>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-[var(--muted)] hover:text-[var(--foreground)] p-1 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
