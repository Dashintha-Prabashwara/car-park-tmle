import { Resolver } from "dns/promises";
import { MongoClient } from "mongodb";

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const rawUri = process.env.MONGODB_URI || "";
const options = {};

/**
 * Resolves a `mongodb+srv://` URI into a direct replica-set `mongodb://` URI using
 * public DNS (Google DNS: 8.8.8.8, 8.8.4.4).
 * This completely fixes "querySrv ECONNREFUSED" caused by local ISPs or routers
 * that block or fail DNS SRV records.
 */
async function resolveDirectMongoUri(uri: string): Promise<string> {
  if (!uri.startsWith("mongodb+srv://")) {
    return uri;
  }

  try {
    const parsed = new URL(uri);
    const hostname = parsed.hostname;

    const resolver = new Resolver();
    resolver.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);

    const [srvRecords, txtRecords] = await Promise.all([
      resolver.resolveSrv(`_mongodb._tcp.${hostname}`),
      resolver.resolveTxt(hostname).catch(() => []),
    ]);

    if (!srvRecords || srvRecords.length === 0) {
      return uri;
    }

    const hostList = srvRecords
      .map((r) => `${r.name}:${r.port}`)
      .join(",");

    const authPart =
      parsed.username || parsed.password
        ? `${parsed.username}:${parsed.password}@`
        : "";

    const dbPath = parsed.pathname && parsed.pathname !== "/"
      ? parsed.pathname
      : "/smartpark";

    const txtOptions = txtRecords.flat().join("&");
    const combinedParams = new URLSearchParams(txtOptions);

    parsed.searchParams.forEach((val, key) => {
      combinedParams.set(key, val);
    });

    if (!combinedParams.has("ssl")) combinedParams.set("ssl", "true");
    if (!combinedParams.has("authSource")) combinedParams.set("authSource", "admin");

    return `mongodb://${authPart}${hostList}${dbPath}?${combinedParams.toString()}`;
  } catch (err) {
    console.warn("Direct DNS resolution fallback error:", err);
    return uri;
  }
}

async function createClient(): Promise<MongoClient> {
  if (!rawUri) {
    throw new Error("Please add your Mongo URI to .env.local (MONGODB_URI)");
  }

  try {
    // Attempt standard connection first
    const client = new MongoClient(rawUri, options);
    return await client.connect();
  } catch (err: unknown) {
    const errObj = err as { code?: string; syscall?: string };
    // If standard connection failed with querySrv error, fallback to direct resolver
    if (
      errObj?.code === "ECONNREFUSED" ||
      errObj?.syscall === "querySrv" ||
      rawUri.startsWith("mongodb+srv://")
    ) {
      const directUri = await resolveDirectMongoUri(rawUri);
      if (directUri !== rawUri) {
        const fallbackClient = new MongoClient(directUri, options);
        return await fallbackClient.connect();
      }
    }
    throw err;
  }
}

let clientPromise: Promise<MongoClient>;

if (!process.env.MONGODB_URI) {
  clientPromise = Promise.reject(
    new Error("Please add your Mongo URI to .env.local (MONGODB_URI)")
  );
} else {
  if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
      global._mongoClientPromise = createClient();
    }
    clientPromise = global._mongoClientPromise;
  } else {
    clientPromise = createClient();
  }
}

export default clientPromise;
