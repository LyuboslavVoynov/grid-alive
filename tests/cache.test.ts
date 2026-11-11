import { it, expect } from "vitest";
import { ObservationCache } from "../src/lib/data/cache";
it("deduplicates concurrent requests, caches success and labels fallback stale", async () => {
  const cache = new ObservationCache();
  let calls = 0;
  const load = async () => {
    calls++;
    return { mw: 100 };
  };
  const [a, b] = await Promise.all([
    cache.read("one", load, 1000),
    cache.read("one", load, 1000),
  ]);
  expect(calls).toBe(1);
  expect(a.value).toEqual(b.value);
  const fallback = await cache.read(
    "one",
    async () => {
      throw Error("outage");
    },
    1000,
    Date.now() + 2000,
  );
  expect(fallback.stale).toBe(true);
  expect(fallback.retrievedAt).toBe(a.retrievedAt);
});
it("does not cache invalid responses or invent a cold-start fallback", async () => {
  const cache = new ObservationCache();
  await expect(
    cache.read(
      "none",
      async () => {
        throw Error("invalid");
      },
      1000,
    ),
  ).rejects.toThrow("invalid");
});
