import {z} from 'zod';
import type {Generation,Demand,Carbon,Fuel,Observation} from '@/types/electricity';
const timestamp=z.string().refine(v=>Number.isFinite(Date.parse(v)),'Invalid observation time');
const fuelRow=z.object({startTime:timestamp,publishTime:timestamp.optional(),fuelType:z.string().min(1),generation:z.number().finite()});
export const fuelResponse=z.object({data:z.array(fuelRow).min(1)});
export type FuelRow=z.infer<typeof fuelRow>;
const definitions:Record<string,{key:string;label:string;color:string}>={WIND:{key:'wind',label:'Wind',color:'#6bcbc1'},CCGT:{key:'gas',label:'Gas',color:'#8baccd'},OCGT:{key:'gas',label:'Gas',color:'#8baccd'},NUCLEAR:{key:'nuclear',label:'Nuclear',color:'#c6b9dd'},NPSHYD:{key:'hydro',label:'Hydro',color:'#62b8d8'},BIOMASS:{key:'biomass',label:'Biomass',color:'#84ba8e'},OTHER:{key:'other',label:'Other',color:'#ded2bc'},COAL:{key:'coal',label:'Coal',color:'#aaa8a5'},OIL:{key:'oil',label:'Oil',color:'#c3987f'},SOLAR:{key:'solar',label:'Solar',color:'#dfba77'}};
const required=['WIND','CCGT','OCGT','NUCLEAR','NPSHYD','BIOMASS','OTHER','COAL','OIL','PS'];
const minute=60000;
function meta(provider:string,from:string,to:string,retrievedAt:string,quality:Observation['quality'],maxAge:number,now:number):Observation{return {provider,from,to,retrievedAt,coverage:'Great Britain',quality,stale:now-Date.parse(to)>maxAge,notes:[]};}
export function normalizeGeneration(input:unknown,retrievedAt:string,at?:number,now=Date.now()):Generation{
 const rows=fuelResponse.parse(input).data;const candidates=[...new Set(rows.map(x=>x.startTime))].filter(t=>!at||Date.parse(t)<=at).sort((a,b)=>Date.parse(b)-Date.parse(a));
 const from=candidates[0];if(!from)throw Error('No generation observation for this time');if(at&&at-Date.parse(from)>10*minute)throw Error('Gap in generation history');
 const unique=new Map<string,FuelRow>();for(const row of rows.filter(x=>x.startTime===from)){const previous=unique.get(row.fuelType);if(!previous||Date.parse(row.publishTime??from)>=Date.parse(previous.publishTime??from))unique.set(row.fuelType,row);}
 if(required.some(key=>!unique.has(key)))throw Error('Incomplete generation observation');
 const fuelMap=new Map<string,Fuel>();const interconnectors:Record<string,number>={};let storageMw=0;
 for(const [key,row]of unique){if(key.startsWith('INT')){interconnectors[key]=row.generation;continue;}if(key==='PS'){storageMw=row.generation;continue;}if(row.generation<0)throw Error('Negative generation for '+key);const def=definitions[key]??{key:key.toLowerCase(),label:key,color:'#b4bec4'};const current=fuelMap.get(def.key);fuelMap.set(def.key,{...def,mw:(current?.mw??0)+row.generation,share:0});}
 const fuels=[...fuelMap.values()];const totalMw=fuels.reduce((sum,f)=>sum+f.mw,0);if(totalMw<=0)throw Error('No positive generation total');for(const f of fuels)f.share=f.mw/totalMw*100;
 const order=['wind','solar','nuclear','gas','hydro','biomass','other','coal','oil'];fuels.sort((a,b)=>(order.indexOf(a.key)<0?99:order.indexOf(a.key))-(order.indexOf(b.key)<0?99:order.indexOf(b.key)));
 const to=new Date(Date.parse(from)+5*minute).toISOString();const observation=meta('Elexon FUELINST',from,to,retrievedAt,'measured',20*minute,now);
 observation.notes=['Metered generation; embedded generation is not comprehensively covered.','Imports and pumped storage are excluded from generation percentages.','Solar is not separately reported in this feed; unavailable does not mean zero.'];
 return {...observation,publishedAt:[...unique.values()].map(x=>x.publishTime??from).sort().at(-1),fuels,totalMw,storageMw,interconnectors,netImportsMw:Object.values(interconnectors).reduce((s,v)=>s+v,0)};
}
const demandResponse=z.object({data:z.array(z.object({startTime:timestamp,publishTime:timestamp.optional(),demand:z.number().finite().nonnegative()})).min(1)});
export function normalizeDemand(input:unknown,retrievedAt:string,at?:number,now=Date.now()):Demand{
 const rows=demandResponse.parse(input).data.filter(x=>!at||Date.parse(x.startTime)<=at).sort((a,b)=>Date.parse(b.startTime)-Date.parse(a.startTime)||Date.parse(b.publishTime??b.startTime)-Date.parse(a.publishTime??a.startTime));const row=rows[0];if(!row||(at&&at-Date.parse(row.startTime)>=30*minute))throw Error('Demand unavailable for this period');return {...meta('Elexon INDO',row.startTime,new Date(Date.parse(row.startTime)+30*minute).toISOString(),retrievedAt,'measured',60*minute,now),publishedAt:row.publishTime,mw:row.demand,definition:'Initial National Demand outturn; a separate reporting interval and methodology from metered generation.'};
}
const intensityResponse=z.object({data:z.array(z.object({from:timestamp,to:timestamp,intensity:z.object({actual:z.number().finite().nonnegative().nullable().optional(),forecast:z.number().finite().nonnegative().nullable().optional(),index:z.string()})})).min(1)});
export function normalizeCarbon(input:unknown,retrievedAt:string,at?:number,now=Date.now()):Carbon{
 const rows=intensityResponse.parse(input).data.filter(x=>!at||(Date.parse(x.from)<=at&&Date.parse(x.to)>at)).sort((a,b)=>Date.parse(b.from)-Date.parse(a.from));const row=rows[0];if(!row)throw Error('Carbon intensity unavailable for this period');const actual=row.intensity.actual;const intensity=actual??row.intensity.forecast;if(intensity===null||intensity===undefined)throw Error('Carbon intensity unavailable');return {...meta('NESO Carbon Intensity',row.from,row.to,retrievedAt,actual!==null&&actual!==undefined?'estimated':'forecast',90*minute,now),intensity,index:row.intensity.index,notes:['NESO carbon intensity is a modelled system-wide estimate; its coverage differs from the metered generation table.']};
}
const regionalResponse=z.object({data:z.array(z.object({from:timestamp,to:timestamp,regions:z.array(z.object({regionid:z.number().int(),shortname:z.string(),intensity:z.object({forecast:z.number().finite().nonnegative(),index:z.string()})}))})).min(1)});
export function normalizeRegional(input:unknown,retrievedAt:string,at?:number,now=Date.now()):import('@/types/electricity').Regional{
 const data=regionalResponse.parse(input).data.filter(x=>!at||(Date.parse(x.from)<=at&&Date.parse(x.to)>at)).sort((a,b)=>Date.parse(b.from)-Date.parse(a.from))[0];if(!data)throw Error('Regional carbon unavailable for this period');const regions=data.regions.filter(r=>r.regionid>=1&&r.regionid<=14);if(regions.length!==14||new Set(regions.map(r=>r.regionid)).size!==14)throw Error('Incomplete regional carbon observation');return {...meta('NESO Regional Carbon Intensity',data.from,data.to,retrievedAt,'forecast',90*minute,now),regions:regions.map(r=>({id:r.regionid,name:r.shortname,intensity:r.intensity.forecast,index:r.intensity.index})),notes:['Regional values are forecasts/modelled estimates; boundaries are approximate DNO service areas.']};
}
