"use client";

import { AnomalyReport } from "@/lib/types";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";

interface AnomalyAlertsProps {
  anomalies?: AnomalyReport;
}

export function AnomalyAlerts({ anomalies }: AnomalyAlertsProps) {
  if (!anomalies) return null;

  const { staleSensors = [], stuckOccupiedBays = [], dataConsistencyIssues = [] } = anomalies;
  const hasAnomalies =
    staleSensors.length > 0 || stuckOccupiedBays.length > 0 || dataConsistencyIssues.length > 0;

  if (!hasAnomalies) return null;

  return (
    <div className="flex flex-col gap-3 font-mono text-xs">
      {/* Stale Flickering Sensors */}
      {staleSensors.map((bay) => (
        <div
          key={`stale-${bay}`}
          className="flex items-center gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-200"
        >
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <div className="flex-1">
            <span className="font-bold text-amber-400">STALE SENSOR DETECTED:</span>{" "}
            Bay P{bay} ultrasonic sensor is fluctuating rapidly (&gt;4 transitions within 60s). Inspect hardware wiring or physical reflector.
          </div>
        </div>
      ))}

      {/* Stuck Occupied >24h */}
      {stuckOccupiedBays.map(({ bay, hours }) => (
        <div
          key={`stuck-${bay}`}
          className="flex items-center gap-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-200"
        >
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <div className="flex-1">
            <span className="font-bold text-rose-400">STUCK OCCUPIED WARNING:</span>{" "}
            Bay P{bay} has been occupied continuously for {hours} hours (&gt;24h). Verify vehicle presence.
          </div>
        </div>
      ))}

      {/* Data Consistency Anomaly */}
      {dataConsistencyIssues.map((issue, idx) => (
        <div
          key={`issue-${idx}`}
          className="flex items-center gap-3 p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/40 text-indigo-200"
        >
          <Info className="w-4 h-4 text-indigo-400 shrink-0" />
          <div className="flex-1">
            <span className="font-bold text-indigo-400">DATA CONSISTENCY WARNING:</span> {issue}.
          </div>
        </div>
      ))}
    </div>
  );
}
