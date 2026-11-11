import type { SeriesPoint } from "@/types/insights";
export const localTime = (s:string, date = true) => new Intl.DateTimeFormat("en-GB",{timeZone:"Europe/London",...(date?{day:"2-digit",month:"short"}:{}),hour:"2-digit",minute:"2-digit",timeZoneName:"short"}).format(new Date(s));
export function SeriesChart({series,unit,from,to,now, maxGapMinutes=65}:{series:{label:string;color:string;points:SeriesPoint[];dashed?:boolean}[];unit:string;from?:number;to?:number;now?:number;maxGapMinutes?:number}) {
  const all=series.flatMap(s=>s.points).filter(p=>Number.isFinite(Date.parse(p.at))&&Number.isFinite(p.value));
  if(!all.length)return <p className="empty-state">No published readings for this period.</p>;
  const start=from??Math.min(...all.map(p=>Date.parse(p.at))), end=to??Math.max(...all.map(p=>Date.parse(p.at)));
  const values=all.filter(p=>Date.parse(p.at)>=start&&Date.parse(p.at)<=end).map(p=>p.value);
  if(!values.length)return <p className="empty-state">No readings in the selected window.</p>;
  const min=Math.min(0,...values),max=Math.max(...values,1)*1.08;
  const x=(at:number)=>58+(at-start)/Math.max(end-start,1)*880;
  const y=(v:number)=>170-(v-min)/(max-min)*145;
  return <div className="series-chart"><svg viewBox="0 0 960 210" role="img" aria-label={series.map(s=>s.label).join(" compared with ")+" in "+unit}>
    {[0,.25,.5,.75,1].map(f=><g key={f}><line x1="58" x2="938" y1={y(min+(max-min)*f)} y2={y(min+(max-min)*f)} stroke="#304955" strokeDasharray="2 4"/><text x="48" y={y(min+(max-min)*f)+4} textAnchor="end">{(min+(max-min)*f).toFixed(max>100?0:1)}</text></g>)}
    {series.map(s=>{let previous=-Infinity;const d=s.points.filter(p=>Date.parse(p.at)>=start&&Date.parse(p.at)<=end).map(p=>{const at=Date.parse(p.at),move=at-previous>maxGapMinutes*60000;previous=at;return `${move?"M":"L"}${x(at)},${y(p.value)}`;}).join(" ");return <path key={s.label} d={d} fill="none" stroke={s.color} strokeWidth="2" strokeDasharray={s.dashed?"6 5":undefined}/>;})}
    {now&&now>=start&&now<=end?<g><line x1={x(now)} x2={x(now)} y1="15" y2="175" stroke="#c7e7df" strokeDasharray="3 4"/><text x={x(now)} y="10" textAnchor="middle">NOW</text></g>:null}
    {[0,.25,.5,.75,1].map(f=><text key={f} x={x(start+(end-start)*f)} y="198" textAnchor="middle">{localTime(new Date(start+(end-start)*f).toISOString(),false)}</text>)}
  </svg><div className="chart-key">{series.map(s=><span key={s.label}><i style={{background:s.color}}/>{s.label}{s.dashed?" · forecast":""}</span>)}<span>{unit}</span></div><details className="data-table"><summary>Read chart values</summary><div>{series.map(s=><table key={s.label}><caption>{s.label} · {unit}</caption><tbody>{s.points.filter(p=>Date.parse(p.at)>=start&&Date.parse(p.at)<=end).map(p=><tr key={p.at}><th>{localTime(p.at)}</th><td>{p.value.toFixed(2)}</td></tr>)}</tbody></table>)}</div></details></div>;
}
