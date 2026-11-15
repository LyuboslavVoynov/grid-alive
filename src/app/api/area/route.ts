import { validRegionId } from "@/lib/geo/regions";
import { getArea, getRegionArea, outwardCode } from "@/lib/data/area";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const region = query.get("region");
  const input = query.get("postcode") ?? "";
  try {
    if (region !== null) validRegionId(region);
    else outwardCode(input);
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Invalid postcode" },
      { status: 400 },
    );
  }
  try {
    return Response.json(
      region !== null ? await getRegionArea(region) : await getArea(input),
      {
        headers: { "Cache-Control": "public, s-maxage=300" },
      },
    );
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
