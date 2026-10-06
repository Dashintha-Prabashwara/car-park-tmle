import { getStatusSnapshot } from "@/lib/db";
import { CarParkStatus } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const encoder = new TextEncoder();
  let isClosed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const startTime = Date.now();
      const maxLifetimeMs = 54000; // Finish gracefully before Vercel 60s limit
      let lastFingerprint = "";
      let lastKeepAlive = Date.now();

      const onAbort = () => {
        isClosed = true;
      };
      request.signal.addEventListener("abort", onAbort);

      try {
        while (!isClosed && !request.signal.aborted) {
          const now = Date.now();
          if (now - startTime >= maxLifetimeMs) {
            // Clean exit triggers standard EventSource auto-reconnect
            break;
          }

          let snapshot: CarParkStatus;
          try {
            snapshot = await getStatusSnapshot();
          } catch (err) {
            console.error("Error reading snapshot in SSE stream:", err);
            // Brief pause before retry
            await new Promise((r) => setTimeout(r, 1000));
            continue;
          }

          // Build a fingerprint to detect meaningful state changes
          const fingerprint = JSON.stringify({
            bays: snapshot.bays.map((b) => ({ id: b.id, occupied: b.occupied, changedAt: b.changedAt })),
            free: snapshot.free,
            vehiclesToday: snapshot.vehiclesToday,
            recentTop: snapshot.recent.length > 0 ? snapshot.recent[0].id : null,
            recentCount: snapshot.recent.length,
            online: snapshot.online,
          });

          // Send message if state changed or if this is the first message
          if (fingerprint !== lastFingerprint) {
            lastFingerprint = fingerprint;
            const message = `data: ${JSON.stringify(snapshot)}\n\n`;
            controller.enqueue(encoder.encode(message));
          }

          // Send keep-alive comment every 15 seconds
          if (now - lastKeepAlive >= 15000) {
            lastKeepAlive = now;
            controller.enqueue(encoder.encode(": keep-alive\n\n"));
          }

          // Read snapshot roughly every 1 second
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (streamError) {
        // Stream aborted or client disconnected
      } finally {
        request.signal.removeEventListener("abort", onAbort);
        if (!isClosed) {
          try {
            controller.close();
          } catch {
            // Ignore already closed
          }
          isClosed = true;
        }
      }
    },
    cancel() {
      isClosed = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
