import { getLatest } from "@/lib/data/providers";
export const dynamic = "force-dynamic";
export async function GET() {
  const snapshot = await getLatest();
  return Response.json(snapshot, {
    headers: {
      "Cache-Control": snapshot.errors.length
        ? "no-store"
        : "public, s-maxage=60, stale-while-revalidate=120",
    },
  });
}
