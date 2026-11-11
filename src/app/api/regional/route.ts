import { fetchJson, observationCache } from "@/lib/data/cache";
import { normalizeRegional } from "@/lib/data/normalize";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const cached = await observationCache.read(
      "regional",
      async () => {
        const raw = await fetchJson(
          "https://api.carbonintensity.org.uk/regional",
        );
        normalizeRegional(raw, new Date().toISOString());
        return raw;
      },
      300000,
    );
    const data = normalizeRegional(cached.value, cached.retrievedAt);
    data.stale ||= cached.stale;
    return Response.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error(
      "Regional provider validation failed",
      error instanceof Error ? error.message : "unknown",
    );
    return Response.json(
      { error: "Regional carbon provider unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
