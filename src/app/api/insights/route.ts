import { getInsights } from "@/lib/data/insights";
export const dynamic = "force-dynamic";
export async function GET() {
  return Response.json(await getInsights(), {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
    },
  });
}
