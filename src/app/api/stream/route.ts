import { getBroadcaster } from "@/lib/sseBroadcaster";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const broadcaster = getBroadcaster();

  const stream = new ReadableStream({
    start(controller) {
      const client = broadcaster.subscribe(controller);
      const maxLifetimeMs = 54000; // Finish gracefully before Vercel 60s limit

      const timer = setTimeout(() => {
        broadcaster.unsubscribe(client);
        try {
          controller.close();
        } catch {
          // Ignore
        }
      }, maxLifetimeMs);

      request.signal.addEventListener("abort", () => {
        clearTimeout(timer);
        broadcaster.unsubscribe(client);
        try {
          controller.close();
        } catch {
          // Ignore
        }
      });
    },
    cancel() {
      // Broadcaster cleans up broken controllers
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
