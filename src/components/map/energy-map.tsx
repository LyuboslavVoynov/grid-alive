'use client';
import { useEffect, useRef, useState } from 'react';
import type { Map as LibreMap } from 'maplibre-gl';
import type { FeatureCollection } from 'geojson';
import { type Coast } from '@/lib/geo/scene';
import {energyAssets,type EnergyAsset} from '@/lib/geo/assets';
import { SceneRenderer, type SceneSettings } from './scene-renderer';
export type MapControls = { zoomIn:()=>void;zoomOut:()=>void;reset:()=>void };
export function EnergyMap({settings,onControls,onSelect}:{settings:SceneSettings;onControls:(controls:MapControls)=>void;onSelect:(farm:EnergyAsset)=>void}){
 const container=useRef<HTMLDivElement>(null),canvas=useRef<HTMLCanvasElement>(null),renderer=useRef<SceneRenderer|null>(null),mapRef=useRef<LibreMap|null>(null),settingsRef=useRef(settings),selectRef=useRef(onSelect);const [error,setError]=useState('');settingsRef.current=settings;selectRef.current=onSelect;
 useEffect(()=>{let disposed=false;let cleanup=()=>{};
  Promise.all([import('maplibre-gl'),fetch('/geo/coasts.json').then(r=>{if(!r.ok)throw Error('Map geometry unavailable');return r.json() as Promise<Coast[]>;})]).then(([lib,coasts])=>{
   if(disposed||!container.current||!canvas.current)return;
   const assetData:FeatureCollection={type:'FeatureCollection',features:energyAssets.map(a=>({type:'Feature',properties:{id:a.id,name:a.name,fuel:a.fuel},geometry:{type:'Point',coordinates:a.point}}))};
   const data:FeatureCollection={type:'FeatureCollection',features:coasts.map(c=>({type:'Feature',properties:{name:c.name},geometry:{type:'MultiPolygon',coordinates:c.rings.map(r=>[r])}}))};
   lib.setWorkerUrl('/vendor/maplibre-gl-worker.mjs');
   const map=new lib.Map({container:container.current,style:{version:8,sources:{land:{type:'geojson',data},assets:{type:'geojson',data:assetData}},layers:[{id:'ocean',type:'background',paint:{'background-color':'#030d17'}},{id:'land',type:'fill',source:'land',paint:{'fill-color':['case',['==',['get','name'],'United Kingdom'],'#0c252c','#081823']}},{id:'coast-glow',type:'line',source:'land',paint:{'line-color':'#43c2cf','line-opacity':['case',['==',['get','name'],'United Kingdom'],.14,.025],'line-width':5,'line-blur':4}},{id:'coast',type:'line',source:'land',paint:{'line-color':['case',['==',['get','name'],'United Kingdom'],'#70b9b9','#294551'],'line-width':.75,'line-opacity':.85}},{id:'assets-halo',type:'circle',source:'assets',paint:{'circle-color':['match',['get','fuel'],'wind','#6bcbc1','solar','#dfba77','hydro','#62b8d8','biomass','#84ba8e','#ded2bc'],'circle-radius':8,'circle-opacity':.12,'circle-blur':.8}},{id:'assets',type:'circle',source:'assets',paint:{'circle-color':['match',['get','fuel'],'wind','#6bcbc1','solar','#dfba77','hydro','#62b8d8','biomass','#84ba8e','#ded2bc'],'circle-radius':['interpolate',['linear'],['zoom'],4,1.4,8,4],'circle-opacity':.9,'circle-stroke-color':'#d4f5e8','circle-stroke-width':.3}}]},center:[-2,54.5],zoom:5,minZoom:3,maxZoom:10,maxPitch:0,pitch:0,bearing:0,dragRotate:false,pitchWithRotate:false,touchPitch:false,attributionControl:false,renderWorldCopies:false});mapRef.current=map;map.touchZoomRotate.disableRotation();map.keyboard.disableRotation();
   const fit=()=>{const mobile=map.getContainer().clientWidth<751;map.fitBounds([[-6.5,50], [2.3,59.1]],{padding:mobile?{top:200,bottom:160,left:35,right:35}:{top:90,bottom:160,left:290,right:260},duration:settingsRef.current.playing?650:0});};
   map.getCanvas().setAttribute('aria-label','Interactive top-down map of Great Britain. Use arrow keys to pan, plus and minus to zoom.');
   const scene=new SceneRenderer(canvas.current,map,coasts,settingsRef.current);renderer.current=scene;
   map.on('move',scene.redraw);map.on('load',fit);const observer=new ResizeObserver(()=>{map.resize();scene.resize();});observer.observe(container.current);document.addEventListener('visibilitychange',scene.visibility);
   map.on('click',e=>{const nearest=energyAssets.map(farm=>({farm,distance:map.project(farm.point).dist(e.point)})).sort((a,b)=>a.distance-b.distance)[0];if(nearest?.distance<18)selectRef.current(nearest.farm);});
   map.on('mousemove',e=>{const near=energyAssets.some(f=>map.project(f.point).dist(e.point)<18);map.getCanvas().style.cursor=near?'pointer':'';});
   onControls({zoomIn:()=>map.zoomIn({duration:settingsRef.current.playing?250:0}),zoomOut:()=>map.zoomOut({duration:settingsRef.current.playing?250:0}),reset:fit});
   map.on('error',e=>{console.error('Map rendering error',e.error?.message);});
   cleanup=()=>{observer.disconnect();document.removeEventListener('visibilitychange',scene.visibility);scene.destroy();map.remove();renderer.current=null;mapRef.current=null;};
  }).catch(e=>{if(!disposed)setError(e instanceof Error?e.message:'Map could not load');});return()=>{disposed=true;cleanup();};
 },[onControls]);
 useEffect(()=>{renderer.current?.update(settings);},[settings]);
 return <><div ref={container} className="map-surface"/><canvas ref={canvas} className="energy-canvas" aria-hidden="true"/>{error&&<div className="map-error" role="alert">The map could not start. {error}. Try a browser with WebGL enabled.</div>}</>;
}
