export type Point = [number, number];
export type Coast = { name: string; rings: Point[][] };
export const cities: [number, number, number, string][] = [
 [-.127,51.507,1.5,'London'],[-1.9,52.486,.8,'Birmingham'],[-2.24,53.48,.8,'Manchester'],[-3,53.4,.55,'Liverpool'],[-1.55,53.8,.65,'Leeds'],[-1.61,54.98,.45,'Newcastle'],[-4.25,55.86,.65,'Glasgow'],[-3.19,55.95,.45,'Edinburgh'],[-2.59,51.45,.5,'Bristol'],[-3.18,51.48,.4,'Cardiff'],[-1.4,50.9,.4,'Southampton'],[-1.15,52.95,.4,'Nottingham'],[-1.47,53.38,.4,'Sheffield'],[-4.14,50.37,.25,'Plymouth'],[-2.1,57.15,.22,'Aberdeen'],[-4.22,57.48,.15,'Inverness'],[1.3,52.63,.2,'Norwich']
];
export const demoFarms = [
 {id:'study-north-sea',name:'North Sea motion study',point:[1.6,54.1] as Point,count:11},
 {id:'study-east-coast',name:'East coast motion study',point:[2.05,53.3] as Point,count:10},
 {id:'study-east-anglia',name:'East Anglia motion study',point:[1.5,52.1] as Point,count:8},
 {id:'study-scotland',name:'Scottish coast motion study',point:[-.4,56.5] as Point,count:9},
 {id:'study-irish-sea',name:'Irish Sea motion study',point:[-3.9,53.7] as Point,count:8},
 {id:'study-cumbria',name:'Cumbrian coast motion study',point:[-3.7,54.3] as Point,count:6},
 {id:'study-south',name:'South coast motion study',point:[-.1,50.5] as Point,count:6}
];
export type Farm = typeof demoFarms[number];
export const flowPaths: Point[][] = [
 [[1.6,54.1],[-.5,54.4],[-1.55,53.8]],[[2.05,53.3],[1,52.5],[-.127,51.507]],[[1.5,52.1],[.8,51.2],[-.127,51.507]],[[-.4,56.5],[-1.2,55.6],[-3.19,55.95]],[[-3.9,53.7],[-3.5,53.1],[-2.24,53.48]],[[-3.7,54.3],[-3,54.6],[-2.24,53.48]],[[-.1,50.5],[-.6,51],[-.127,51.507]]
];
export const connectionPaths: {id:string;name:string;points:Point[]}[] = [
 {id:'IFA',name:'France',points:[[1.65,50.95],[1,50.8],[.1,51.05]]},
 {id:'BRITNED',name:'Netherlands',points:[[3.5,51.8],[2.7,52.2],[1.15,51.95]]},
 {id:'NSL',name:'Norway',points:[[5.3,58.2],[2.1,57.7],[-1.5,55.2]]},
 {id:'EWIC',name:'Ireland',points:[[-6.1,53.4],[-5.3,53.1],[-4.1,53.2]]}
];
