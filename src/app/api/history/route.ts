import {getHistory} from '@/lib/data/history';
export const dynamic='force-dynamic';
export async function GET(){const history=await getHistory();return Response.json(history,{headers:{'Cache-Control':history.snapshots.some(s=>s.errors.length)?'no-store':'public, s-maxage=300, stale-while-revalidate=300'}});}
