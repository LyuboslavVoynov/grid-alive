import type { Map as LibreMap } from 'maplibre-gl';
import { cities, demoFarms, flowPaths, connectionPaths, type Coast, type Point } from '@/lib/geo/scene';
export type SceneSettings = { playing:boolean; speed:number; wind:boolean; connections:boolean; cities:boolean; windActivity:number; flows:Record<string,number> };
export class SceneRenderer {
 private ctx:CanvasRenderingContext2D; private backdrop=document.createElement('canvas');
 private settings:SceneSettings; private frame=0; private elapsed=0; private last=0; private seed=7143; private dirty=true; private disposed=false;
 constructor(private canvas:HTMLCanvasElement,private map:LibreMap,private coasts:Coast[],settings:SceneSettings){
  this.ctx=canvas.getContext('2d')!;this.settings=settings;this.resize();this.redraw();this.schedule();
 }
 private random(){this.seed=(this.seed*1664525+1013904223)>>>0;return this.seed/4294967296;}
 private project(p:Point){const q=this.map.project(p);return [q.x,q.y] as Point;}
 private dot(c:CanvasRenderingContext2D,x:number,y:number,r:number,color:string){c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=color;c.fill();}
 private glow(c:CanvasRenderingContext2D,x:number,y:number,r:number,color:string,power:number){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');c.save();c.globalAlpha=power;c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);c.restore();}
 private path(rings:Point[][]){const p=new Path2D();for(const ring of rings){ring.forEach((ll,i)=>{const [x,y]=this.project(ll);if(i)p.lineTo(x,y);else p.moveTo(x,y);});p.closePath();}return p;}
 resize=()=>{const {width,height}=this.canvas.getBoundingClientRect();const dpr=Math.min(devicePixelRatio||1,2);this.canvas.width=Math.round(width*dpr);this.canvas.height=Math.round(height*dpr);this.backdrop.width=this.canvas.width;this.backdrop.height=this.canvas.height;this.ctx.setTransform(dpr,0,0,dpr,0,0);this.dirty=true;this.redraw();};
 redraw=()=>{if(this.disposed)return;this.dirty=true;this.draw();};
 update(settings:SceneSettings){this.settings=settings;this.dirty=true;this.draw();this.schedule();}
 private bake(){const c=this.backdrop.getContext('2d')!;const dpr=Math.min(devicePixelRatio||1,2);c.setTransform(dpr,0,0,dpr,0,0);const {width:w,height:h}=this.canvas.getBoundingClientRect();c.clearRect(0,0,w,h);this.seed=7143;
  const uk=this.coasts.find(x=>x.name==='United Kingdom');if(!uk)return;const path=this.path(uk.rings);c.save();c.clip(path);
  for(let i=0;i<12000;i++){const x=this.random()*w,y=this.random()*h;c.globalAlpha=this.random()*.13;c.fillStyle=this.random()>.65?'#829895':'#010b12';c.fillRect(x,y,1.2,.8);}c.globalAlpha=1;
  if(this.settings.cities){const corridors=[[0,1],[0,8],[0,10],[1,2],[1,11],[1,12],[2,3],[2,4],[4,5],[5,7],[7,6],[8,9],[8,13],[7,14],[6,15],[0,16]];for(const [from,to]of corridors){const a=this.project([cities[from][0],cities[from][1]]),b=this.project([cities[to][0],cities[to][1]]);for(let j=0;j<100;j++){const t=j/100;this.dot(c,a[0]+(b[0]-a[0])*t+(this.random()-.5)*2,b[1]*t+a[1]*(1-t)+(this.random()-.5)*2,.2+this.random()*.3,'#c39b60');}}
   for(const [lon,lat,power]of cities){const [x,y]=this.project([lon,lat]);this.glow(c,x,y,35*Math.sqrt(power),'#ed9f50',.22);this.glow(c,x,y,13*power,'#ffc777',.4);for(let j=0;j<220*power;j++){const a=this.random()*Math.PI*2,r=Math.pow(this.random(),1.8)*24*Math.sqrt(power);this.dot(c,x+Math.cos(a)*r,y+Math.sin(a)*r*.7,.2+this.random()*.65,this.random()>.35?'#edbd78':'#856c4b');}this.dot(c,x,y,1.2,'#ffe2ab');}}
  c.restore();if(this.settings.cities){c.font='8px Arial';c.fillStyle='#a1b7b9';for(const index of [0,2,7]){const city=cities[index],p=this.project([city[0],city[1]]);c.fillText(city[3].toUpperCase(),p[0]+10,p[1]-8);}}this.dirty=false;
 }
 private curve(points:Point[],t:number){const [a,b,c]=points.map(p=>this.project(p)),q=1-t;return [q*q*a[0]+2*q*t*b[0]+t*t*c[0],q*q*a[1]+2*q*t*b[1]+t*t*c[1]] as Point;}
 private flow(points:Point[],index:number,value?:number){const c=this.ctx,[a,b,d]=points.map(p=>this.project(p));c.beginPath();c.moveTo(...a);c.quadraticCurveTo(...b,...d);c.strokeStyle=value===undefined?'#50d8d528':'#8bdfeb65';c.lineWidth=.7;c.stroke();const direction=value!==undefined&&value<0?-1:1;const strength=value===undefined?this.settings.windActivity:Math.min(Math.abs(value)/1500,1);if(strength<=0)return;
  const count=Math.max(1,Math.round(2+strength*4));for(let i=0;i<count;i++){const raw=(this.elapsed*(.035+strength*.035)+i/count+index*.17)%1;const t=direction>0?raw:1-raw;for(let k=0;k<12;k++){const u=t-direction*k*.004;if(u<0||u>1)continue;const [x,y]=this.curve(points,u);c.globalAlpha=(1-k/12)*.85;this.dot(c,x,y,k===0?1.5:.8,'#8df5e5');}c.globalAlpha=1;}}
 private turbine(x:number,y:number,index:number){const c=this.ctx,size=4.5;c.save();c.translate(x,y);c.strokeStyle='#9bd9d7';c.lineWidth=.8;c.beginPath();c.moveTo(0,0);c.lineTo(0,8);c.stroke();c.rotate(this.elapsed*.8+index*1.7);for(let i=0;i<3;i++){c.rotate(Math.PI*2/3);c.beginPath();c.moveTo(-.6,0);c.lineTo(-.4,-size*.4);c.lineTo(.5,-size);c.lineTo(1.1,-size*.25);c.closePath();c.fillStyle='#b9e9e3';c.fill();}this.dot(c,0,0,1,'#effff9');c.restore();}
 private draw(){if(this.disposed)return;if(this.dirty)this.bake();const {width:w,height:h}=this.canvas.getBoundingClientRect();this.ctx.clearRect(0,0,w,h);this.ctx.drawImage(this.backdrop,0,0,w,h);
  if(this.settings.wind){flowPaths.forEach((p,i)=>this.flow(p,i));demoFarms.forEach((farm,fi)=>{const [x,y]=this.project(farm.point);this.glow(this.ctx,x,y,35,'#2ea8ba',.12);for(let j=0;j<farm.count;j++){const col=j%4,row=Math.floor(j/4);this.turbine(x+(col-1.5)*12,y+(row-1)*13+col*3,j+fi);}});}
  if(this.settings.connections)connectionPaths.forEach((p,i)=>{const value=this.settings.flows[p.id];if(value!==undefined)this.flow(p.points,i,value);});
 }
 private tick=(t:number)=>{this.frame=0;const dt=Math.min((t-this.last)/1000,.06);this.last=t;if(this.settings.playing&&!document.hidden){this.elapsed+=dt*this.settings.speed;this.draw();this.schedule();}};
 private schedule(){if(!this.frame&&this.settings.playing&&!document.hidden&&!this.disposed){this.last=performance.now();this.frame=requestAnimationFrame(this.tick);}}
 visibility=()=>{if(!document.hidden){this.draw();this.schedule();}};
 destroy(){this.disposed=true;cancelAnimationFrame(this.frame);}
}
