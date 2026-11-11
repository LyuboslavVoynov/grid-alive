import { getArea, outwardCode } from "@/lib/data/area";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const input = new URL(request.url).searchParams.get("postcode") ?? "";
  try {
    outwardCode(input);
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Invalid postcode" },
      { status: 400 },
    );
  }
  try {
    return Response.json(await getArea(input), {
      headers: { "Cache-Control": "public, s-maxage=300" },
    });
  } catch {
    return Response.json(
      {
        error:
          "Regional lookup is unavailable or this postcode is not covered. Try again shortly.",
      },
      { status: 503 },
    );
  }
}
