import { getStatusSnapshot } from "./db";
import { CarParkStatus } from "./types";

interface SSEClient {
  id: string;
  controller: ReadableStreamDefaultController;
  encoder: TextEncoder;
  isClosed: boolean;
}

class SSEBroadcaster {
  private clients = new Set<SSEClient>();
  private pollInterval: NodeJS.Timeout | null = null;
  private lastSnapshotJson: string = "";
  private lastSnapshotFingerprint: string = "";
  private lastKeepAlive = Date.now();
  private isPolling = false;

  public subscribe(controller: ReadableStreamDefaultController): SSEClient {
    const client: SSEClient = {
      id: Math.random().toString(36).substring(2, 9),
      controller,
      encoder: new TextEncoder(),
      isClosed: false,
    };

    this.clients.add(client);

    // If we have a cached snapshot, deliver immediately
    if (this.lastSnapshotJson) {
      try {
        const message = `data: ${this.lastSnapshotJson}\n\n`;
        client.controller.enqueue(client.encoder.encode(message));
      } catch {
        this.unsubscribe(client);
      }
    }

    // Start background loop if not already running
    this.ensurePolling();

    return client;
  }

  public unsubscribe(client: SSEClient) {
    client.isClosed = true;
    this.clients.delete(client);
    if (this.clients.size === 0) {
      this.stopPolling();
    }
  }

  private ensurePolling() {
    if (this.pollInterval || this.clients.size === 0) return;

    // Immediately trigger first poll
    this.pollOnce();

    this.pollInterval = setInterval(() => {
      this.pollOnce();
    }, 1000);
  }

  private stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  private async pollOnce() {
    if (this.isPolling || this.clients.size === 0) return;
    this.isPolling = true;

    try {
      const snapshot: CarParkStatus = await getStatusSnapshot();
      const snapshotJson = JSON.stringify(snapshot);

      // Lightweight fingerprint
      const fingerprint = JSON.stringify({
        bays: snapshot.bays.map((b) => ({ id: b.id, occupied: b.occupied, changedAt: b.changedAt })),
        free: snapshot.free,
        vehiclesToday: snapshot.vehiclesToday,
        recentTop: snapshot.recent.length > 0 ? snapshot.recent[0].id : null,
        online: snapshot.online,
        stale: snapshot.anomalies?.staleSensors?.length,
        stuck: snapshot.anomalies?.stuckOccupiedBays?.length,
      });

      const hasChanged = fingerprint !== this.lastSnapshotFingerprint;
      const now = Date.now();
      const needsKeepAlive = now - this.lastKeepAlive >= 15000;

      if (hasChanged || !this.lastSnapshotJson) {
        this.lastSnapshotFingerprint = fingerprint;
        this.lastSnapshotJson = snapshotJson;
        this.broadcast(`data: ${snapshotJson}\n\n`);
      }

      if (needsKeepAlive) {
        this.lastKeepAlive = now;
        this.broadcast(": keep-alive\n\n");
      }
    } catch (err) {
      // Don't crash broadcaster on temporary DB hiccups
      console.error("Shared SSE Broadcaster poll error:", err);
    } finally {
      this.isPolling = false;
    }
  }

  private broadcast(rawMessage: string) {
    const deadClients: SSEClient[] = [];

    for (const client of this.clients) {
      if (client.isClosed) {
        deadClients.push(client);
        continue;
      }

      try {
        client.controller.enqueue(client.encoder.encode(rawMessage));
      } catch {
        deadClients.push(client);
      }
    }

    for (const dead of deadClients) {
      this.unsubscribe(dead);
    }
  }

  public getSubscriberCount(): number {
    return this.clients.size;
  }
}

// Singleton on global or module scope
declare global {
  var _sseBroadcaster: SSEBroadcaster | undefined;
}

export function getBroadcaster(): SSEBroadcaster {
  if (!global._sseBroadcaster) {
    global._sseBroadcaster = new SSEBroadcaster();
  }
  return global._sseBroadcaster;
}
