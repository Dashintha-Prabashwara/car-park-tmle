import crypto from "crypto";

/**
 * Validates the provided API key against process.env.API_KEY in constant time.
 * Prevents timing attacks on the secret API key.
 */
export function isValidApiKey(providedKey: string | null | undefined): boolean {
  const serverKey = process.env.API_KEY;
  if (!providedKey || !serverKey) {
    return false;
  }

  const providedBuf = Buffer.from(providedKey);
  const serverBuf = Buffer.from(serverKey);

  // Buffer length mismatch check with dummy comparison to mitigate timing leaks
  if (providedBuf.length !== serverBuf.length) {
    crypto.timingSafeEqual(providedBuf, providedBuf);
    return false;
  }

  return crypto.timingSafeEqual(providedBuf, serverBuf);
}
