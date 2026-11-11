import { z } from "zod";
import { fetchJson, observationCache } from "./cache";
import type { Insights, SeriesPoint, Notice } from "@/types/insights";
const base = "https://data.elexon.co.uk/bmrs/api/v1";
const ts = z.string().refine(v => Number.isFinite(Date.parse(v)));
const num = z.number().finite();
export function series(input: unknown, field: string, now = Date.now(), forecast = false): SeriesPoint[] {
  const rows = z.object({ data: z.array(z.record(z.string(), z.unknown())) }).parse(input).data;
  const unique = new Map<string, SeriesPoint>();
  for (const row of rows) {
    const at = ts.safeParse(row.startTime), value = num.safeParse(row[field]);
    if (!at.success || !value.success || value.data < 0) continue;
    if (forecast && Date.parse(at.data) < now - 30 * 60000) continue;
    const publishedAt = ts.safeParse(row.publishTime);
    const point = { at: at.data, value: value.data, publishedAt: publishedAt.success ? publishedAt.data : undefined };
    const existing = unique.get(at.data);
    if (!existing || (point.publishedAt ?? "") > (existing.publishedAt ?? "")) unique.set(at.data, point);
  }
  return [...unique.values()].sort((a,b)=>Date.parse(a.at)-Date.parse(b.at));
}
export async function getInsights(now = Date.now()): Promise<Insights> {
  const iso = (v: number) => new Date(v).toISOString();
  const from = iso(now - 48*3600000), to = iso(now + 48*3600000);
  const today = iso(now).slice(0,10);
  const near = `?from=${iso(now-20*60000)}&to=${iso(now)}`;
  const urls = [base+"/system/frequency"+near,
    base+`/datasets/INDO?publishDateTimeFrom=${from}&publishDateTimeTo=${iso(now)}`,
    base+`/forecast/demand/day-ahead/latest?from=${iso(now)}&to=${to}`,
    base+`/forecast/generation/wind/latest?from=${iso(now)}&to=${to}`,
    `https://api.carbonintensity.org.uk/intensity/${iso(now)}/fw48h`,
    base+`/remit/list/by-event/stream?from=${today}T00:00Z&to=${to}`];
  const results = await Promise.allSettled(urls.map((url,i)=>observationCache.read("insights-"+i,()=>fetchJson(url),i===0?60000:300000)));
  const out: Insights = { retrievedAt: iso(now), frequency:null, demand:[], demandForecast:[], windForecast:[], carbonForecast:[], notices:[],errors:[] };
  for (let i=0;i<results.length;i++) {
    const result=results[i];
    try {
      if(result.status!=="fulfilled") throw Error();
      const raw=result.value.value;
      if(i===0){const rows=z.object({data:z.array(z.object({measurementTime:ts,frequency:num.min(40).max(60)}))}).parse(raw).data.sort((a,b)=>Date.parse(b.measurementTime)-Date.parse(a.measurementTime)); const row=rows.find(r=>Date.parse(r.measurementTime)<=now);if(!row)throw Error();out.frequency={at:row.measurementTime,hz:row.frequency,delayed:result.value.stale||now-Date.parse(row.measurementTime)>10*60000};}
      if(i===1)out.demand=series(raw,"demand",now).filter(p=>Date.parse(p.at)<=now);
      if(i===2)out.demandForecast=series(raw,"nationalDemand",now,true);
      if(i===3)out.windForecast=series(raw,"generation",now,true);
      if(i===4){const rows=z.object({data:z.array(z.object({from:ts,intensity:z.object({forecast:num.nonnegative().nullable()})}))}).parse(raw).data;out.carbonForecast=rows.filter(r=>r.intensity.forecast!==null).map(r=>({at:r.from,value:r.intensity.forecast!}));}
      if(i===5){const ids=z.array(z.object({id:z.number().int(),publishTime:ts})).parse(raw).sort((a,b)=>Date.parse(b.publishTime)-Date.parse(a.publishTime)).slice(0,5);const details=await Promise.allSettled(ids.map(r=>observationCache.read("remit-"+r.id,()=>fetchJson(base+"/remit/"+r.id),300000)));out.notices=details.flatMap(r=>{if(r.status!=="fulfilled")return [];try {const v=z.object({data:z.array(z.object({id:z.number().int(),messageHeading:z.string(),affectedUnit:z.string(),eventStatus:z.string(),eventStartTime:ts,eventEndTime:ts,unavailableCapacity:num.nullable().optional(),publishTime:ts}))}).parse(r.value.value).data[0];return v?[{id:v.id,title:v.messageHeading,unit:v.affectedUnit,status:v.eventStatus,from:v.eventStartTime,to:v.eventEndTime,unavailableMw:v.unavailableCapacity??null,publishedAt:v.publishTime} satisfies Notice]:[];}catch{return [];}});if(ids.length&&!out.notices.length)throw Error();}
      if(result.value.stale)out.errors.push(["Frequency","Demand history","Demand forecast","Wind forecast","Carbon forecast","Published notices"][i]+" delayed");
    } catch {out.errors.push(["Frequency","Demand history","Demand forecast","Wind forecast","Carbon forecast","Published notices"][i]+" unavailable");}
  }
  return out;
}
