import { validRegionId } from "@/lib/geo/regions";
import { getRegionArea } from "@/lib/data/area";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const region = query.get("region");
  try {
    validRegionId(region ?? "");
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Choose a supported region" },
      { status: 400 },
    );
  }
  try {
    return Response.json(await getRegionArea(region!), {
      headers: { "Cache-Control": "public, s-maxage=300" },
    });
  } catch {
    return Response.json(
      {
        error:
          "Regional lookup is unavailable or this location is not covered. Try again shortly.",
      },
      { status: 503 },
    );
  }
}
