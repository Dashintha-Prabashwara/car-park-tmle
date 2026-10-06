"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { CarParkStatus } from "@/lib/types";

interface UseCarParkStatusResult {
  status: CarParkStatus | null;
  isLoading: boolean;
  error: string | null;
  isOnline: boolean;
  secondsSinceLastSeen: number | null;
  connectionMode: "sse" | "polling";
  reconnectAttempts: number;
  refetch: () => Promise<void>;
}

export function useCarParkStatus(): UseCarParkStatusResult {
  const [status, setStatus] = useState<CarParkStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionMode, setConnectionMode] = useState<"sse" | "polling">("sse");
  const [reconnectAttempts, setReconnectAttempts] = useState<number>(0);
  const [clientIsOnline, setClientIsOnline] = useState<boolean>(false);
  const [secondsSinceLastSeen, setSecondsSinceLastSeen] = useState<number | null>(null);

  // Clock offset between client local clock and serverTime: serverTime - clientLocalTime
  const clockOffsetRef = useRef<number>(0);
  const statusRef = useRef<CarParkStatus | null>(null);
  const failureCountRef = useRef<number>(0);
  const eventSourceRef = useRef<EventSource | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sseRetryIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Keep ref synchronized
  statusRef.current = status;

  // Helper to sync serverTime clock offset
  const updateServerClockOffset = useCallback((serverTimeStr: string) => {
    try {
      const serverMs = new Date(serverTimeStr).getTime();
      if (!isNaN(serverMs)) {
        clockOffsetRef.current = serverMs - Date.now();
      }
    } catch {
      // Ignore
    }
  }, []);

  // Fetch status snapshot via HTTP
  const fetchSnapshot = useCallback(async () => {
    try {
      const res = await fetch("/api/status", {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Failed to fetch status`);
      }
      const data: CarParkStatus = await res.json();
      setStatus(data);
      updateServerClockOffset(data.serverTime);
      setError(null);
      return data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Network error";
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [updateServerClockOffset]);

  // Start polling fallback every 2 seconds
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) return;
    setConnectionMode("polling");

    pollingIntervalRef.current = setInterval(async () => {
      try {
        await fetchSnapshot();
      } catch {
        // Continue polling
      }
    }, 2000);
  }, [fetchSnapshot]);

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // Initialize and manage SSE connection
  const setupEventSource = useCallback(() => {
    if (typeof window === "undefined") return;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    try {
      const es = new EventSource("/api/stream");
      eventSourceRef.current = es;

      es.onopen = () => {
        failureCountRef.current = 0;
        setReconnectAttempts(0);
        setConnectionMode("sse");
        stopPolling();
      };

      es.onmessage = (event) => {
        try {
          const freshData: CarParkStatus = JSON.parse(event.data);
          setStatus(freshData);
          updateServerClockOffset(freshData.serverTime);
          setError(null);
          setIsLoading(false);
          failureCountRef.current = 0;
          setReconnectAttempts(0);
        } catch (e) {
          console.error("Failed to parse SSE payload:", e);
        }
      };

      es.onerror = () => {
        failureCountRef.current += 1;
        setReconnectAttempts(failureCountRef.current);

        // If SSE fails or reconnects more than 3 times in a row, fall back to polling
        if (failureCountRef.current >= 3) {
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
          }
          startPolling();
        }
      };
    } catch (err) {
      failureCountRef.current += 1;
      setReconnectAttempts(failureCountRef.current);
      if (failureCountRef.current >= 3) {
        startPolling();
      }
    }
  }, [startPolling, stopPolling, updateServerClockOffset]);

  // Initial mount: fetch immediate snapshot & start SSE
  useEffect(() => {
    let isMounted = true;

    // Fetch snapshot immediately to prevent empty flash
    fetchSnapshot().catch(() => {
      // Snapshot failed, SSE will try next
    });

    // Connect to SSE stream
    setupEventSource();

    // While in polling mode, periodically try to re-establish SSE (every 14s)
    sseRetryIntervalRef.current = setInterval(() => {
      if (!eventSourceRef.current && failureCountRef.current >= 3) {
        // Attempt restoring SSE
        setupEventSource();
      }
    }, 14000);

    return () => {
      isMounted = false;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      stopPolling();
      if (sseRetryIntervalRef.current) {
        clearInterval(sseRetryIntervalRef.current);
        sseRetryIntervalRef.current = null;
      }
    };
  }, [fetchSnapshot, setupEventSource, stopPolling]);

  // Real-time client-side offline recalculation every 1 second
  useEffect(() => {
    const timer = setInterval(() => {
      const currentStatus = statusRef.current;
      if (!currentStatus || !currentStatus.lastSeen) {
        setClientIsOnline(false);
        setSecondsSinceLastSeen(null);
        return;
      }

      const lastSeenMs = new Date(currentStatus.lastSeen).getTime();
      const estimatedServerNow = Date.now() + clockOffsetRef.current;
      const diffMs = estimatedServerNow - lastSeenMs;
      const diffSeconds = Math.max(0, Math.floor(diffMs / 1000));

      setSecondsSinceLastSeen(diffSeconds);
      // Online if lastSeen is within the last 25 seconds
      setClientIsOnline(diffMs <= 25000);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return {
    status,
    isLoading,
    error,
    isOnline: clientIsOnline,
    secondsSinceLastSeen,
    connectionMode,
    reconnectAttempts,
    refetch: async () => {
      await fetchSnapshot();
    },
  };
}
