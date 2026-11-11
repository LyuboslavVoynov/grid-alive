import records from '../../../data/renewable-assets.json';
import type {Point} from './scene';
export type EnergyAsset={id:string;name:string;technology:string;fuel:string;capacityMw:number;turbines:number|null;point:Point;country:string;updated:string;source:string;status:string};
export const energyAssets=records as EnergyAsset[];
export const offshoreAssets=energyAssets.filter(a=>a.technology==='Wind Offshore');
