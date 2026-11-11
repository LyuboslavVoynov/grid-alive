/** Process-local, bounded observation cache. Cold starts return unavailable on outage. */
export class ObservationCache {
  private values = new Map<
    string,
    { value: unknown; retrievedAt: string; expires: number }
  >();
  private pending = new Map<
    string,
    Promise<{ value: unknown; retrievedAt: string; stale: boolean }>
  >();
  async read<T>(
    key: string,
    loader: () => Promise<T>,
    ttlMs: number,
    now = Date.now(),
  ): Promise<{ value: T; retrievedAt: string; stale: boolean }> {
    const cached = this.values.get(key);
    if (cached && cached.expires > now)
      return {
        value: cached.value as T,
        retrievedAt: cached.retrievedAt,
        stale: false,
      };
    const inFlight = this.pending.get(key);
    if (inFlight)
      return inFlight as Promise<{
        value: T;
        retrievedAt: string;
        stale: boolean;
      }>;
    const task = (async () => {
      try {
        const value = await loader(),
          retrievedAt = new Date().toISOString();
        if (this.values.size >= 100)
          this.values.delete(this.values.keys().next().value!);
        this.values.set(key, {
          value,
          retrievedAt,
          expires: Date.now() + ttlMs,
        });
        return { value, retrievedAt, stale: false };
      } catch (error) {
        if (cached && now - Date.parse(cached.retrievedAt) < 6 * 60 * 60 * 1000)
          return {
            value: cached.value as T,
            retrievedAt: cached.retrievedAt,
            stale: true,
          };
        throw error;
      } finally {
        this.pending.delete(key);
      }
    })();
    this.pending.set(key, task);
    return task;
  }
}
export const observationCache = new ObservationCache();
export async function fetchJson(url: string): Promise<unknown> {
  let last: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(url, {
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
        headers: { Accept: "application/json" },
      });
      if (!response.ok)
        throw Error("Provider returned HTTP " + response.status);
      const body = await response.text();
      if (body.length > 6000000)
        throw Error("Provider response exceeded size limit");
      return JSON.parse(body);
    } catch (e) {
      last = e;
    }
  }
  throw last;
}
