export type Quality = 'measured'|'estimated'|'forecast';
export type Fuel = {key:string;label:string;mw:number;share:number;color:string};
export type Observation = {provider:string;from:string;to:string;retrievedAt:string;publishedAt?:string;coverage:string;quality:Quality;stale:boolean;notes:string[]};
export type Generation = Observation & {fuels:Fuel[];totalMw:number;storageMw:number;interconnectors:Record<string,number>;netImportsMw:number};
export type Demand = Observation & {mw:number;definition:string};
export type Carbon = Observation & {intensity:number;index:string};
export type Snapshot = {generation:Generation|null;demand:Demand|null;carbon:Carbon|null;errors:string[];mode:'latest'|'historical';requestedAt:string};
