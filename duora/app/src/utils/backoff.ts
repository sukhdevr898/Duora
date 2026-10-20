/** Bounded exponential backoff with full jitter for offline retries. */
export function nextBackoffMs(attempt: number, baseMs = 1000, capMs = 30_000): number {
  const exp = Math.min(capMs, baseMs * 2 ** Math.min(attempt, 12));
  return Math.floor(Math.random() * exp);
}

export async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
