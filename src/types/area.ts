export type AreaInterval = {from:string;to:string;intensity:number|null;mix:{fuel:string;perc:number}[]};
export type AreaData = {postcode:string;name:string;regionId:number;dno:string;retrievedAt:string;stale:boolean;intervals:AreaInterval[];point:[number,number]|null;authorities:string[];warnings:string[]};
