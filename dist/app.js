/* Visual direction prototype. No measured generation or physical network flows. */
const canvas=document.querySelector('#map'),ctx=canvas.getContext('2d');
const background=document.createElement('canvas'),bg=background.getContext('2d');
let width=0,height=0,ratio=1,coasts=[],zoom=1,elapsed=0,last=0,playing=!matchMedia('(prefers-reduced-motion: reduce)').matches,speed=1;
const layers={wind:true,connections:true,cities:true};
let seed=7143;function random(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
const cities=[[-.127,51.507,1.5],[-1.9,52.486,.8],[-2.24,53.48,.8],[-3,53.4,.55],[-1.55,53.8,.65],[-1.61,54.98,.45],[-4.25,55.86,.65],[-3.19,55.95,.45],[-2.59,51.45,.5],[-3.18,51.48,.4],[-1.4,50.9,.4],[-1.15,52.95,.4],[-1.47,53.38,.4],[-4.14,50.37,.25],[-2.1,57.15,.22],[-4.22,57.48,.15],[1.3,52.63,.2],[1.1,51.28,.15],[-4.08,53.22,.1]];
const farms=[{p:[1.6,54.1],n:11},{p:[2.05,53.3],n:10},{p:[1.5,52.1],n:8},{p:[-.4,56.5],n:9},{p:[-3.9,53.7],n:8},{p:[-3.7,54.3],n:6},{p:[-.1,50.5],n:6},{p:[-5.5,56.1],n:5}];
const flows=[[[1.6,54.1],[-.5,54.4],[-1.55,53.8]],[[2.05,53.3],[1,52.5],[-.127,51.507]],[[1.5,52.1],[.8,51.2],[-.127,51.507]],[[-.4,56.5],[-1.2,55.6],[-3.19,55.95]],[[-3.9,53.7],[-3.5,53.1],[-2.24,53.48]],[[-3.7,54.3],[-3,54.6],[-2.24,53.48]],[[-.1,50.5],[-.6,51],[-.127,51.507]],[[-5.5,56.1],[-5,55.4],[-4.25,55.86]],[[-4.25,55.86],[-1.2,55.3],[-2.24,53.48]],[[-2.24,53.48],[-1.4,52.8],[-.127,51.507]]];
const links=[[[1.65,50.95],[1,50.8],[.1,51.05]],[[3.5,51.8],[2.7,52.2],[1.15,51.95]],[[5.3,58.2],[2.1,57.7],[-1.5,55.2]],[[-6.1,53.4],[-5.3,53.1],[-4.1,53.2]]];
function project(p){const mobile=width<750;const s=Math.min(height*(mobile?.059:.079),width*(mobile?.15:.066))*zoom;return [width*(mobile?.50:.53)+(p[0]+2)*s*.59,height*(mobile?.55:.47)-(p[1]-54.4)*s];}
function pathFor(rings){const path=new Path2D();for(const ring of rings){ring.forEach((p,i)=>{const [x,y]=project(p);i?path.lineTo(x,y):path.moveTo(x,y)});path.closePath()}return path;}
function glow(c,x,y,r,color,power=1){const grad=c.createRadialGradient(x,y,0,x,y,r);grad.addColorStop(0,color);grad.addColorStop(1,'transparent');c.globalAlpha=power;c.fillStyle=grad;c.fillRect(x-r,y-r,r*2,r*2);c.globalAlpha=1;}
function dot(c,x,y,r,color){c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=color;c.fill();}
function makeBackground(){
 background.width=width*ratio;background.height=height*ratio;bg.setTransform(ratio,0,0,ratio,0,0);bg.fillStyle='#030d17';bg.fillRect(0,0,width,height);seed=7143;
 glow(bg,width*.56,height*.43,height*.8,'#0b2333',.7);
 for(const country of coasts){const path=pathFor(country.rings);const primary=country.name==='United Kingdom';bg.fillStyle=primary?'#0c252c':'#081823';bg.fill(path);bg.strokeStyle=primary?'#6cb7b7':'#224554';bg.lineWidth=primary?.7:.45;bg.shadowColor='#35a9b8';bg.shadowBlur=primary?5:0;bg.stroke(path);bg.shadowBlur=0;
 bg.save();bg.clip(path);
 // Screen-space texture, intentionally decorative rather than terrain measurements.
 for(let i=0;i<(primary?19000:6500);i++){const x=random()*width,y=random()*height;bg.fillStyle=random()>.65?'#597276':'#010b12';bg.globalAlpha=random()*.17;bg.fillRect(x,y,random()*2.2+.3,.5+random());}bg.globalAlpha=1;
 if(layers.cities&&primary){
 // Decorative city-light corridors, not measured electricity routes.
 const corridors=[[0,1],[0,8],[0,10],[0,17],[1,2],[1,11],[1,12],[2,3],[2,4],[4,5],[5,7],[7,6],[8,9],[8,13],[7,14],[6,15],[0,16]];
 for(const [from,to] of corridors){const a=project(cities[from]),b=project(cities[to]);for(let j=0;j<100;j++){const t=j/100;const x=a[0]+(b[0]-a[0])*t+(random()-.5)*3*zoom,y=a[1]+(b[1]-a[1])*t+(random()-.5)*3*zoom;dot(bg,x,y,.18+random()*.3,'#c39b60');}}
 for(const [lon,lat,power] of cities){const [x,y]=project([lon,lat]);glow(bg,x,y,40*Math.sqrt(power)*zoom,'#ed9f50',.2);glow(bg,x,y,16*power*zoom,'#ffc777',.38);for(let j=0;j<220*power;j++){const a=random()*Math.PI*2,r=Math.pow(random(),1.8)*25*Math.sqrt(power)*zoom;dot(bg,x+Math.cos(a)*r,y+Math.sin(a)*r*.7,random()*.65+.15,random()>.35?'#edbd78':'#856c4b');}dot(bg,x,y,1.2,'#ffe2ab');}
 for(let i=0;i<2600;i++){const [x,y]=project([-5.6+random()*7,50.1+random()*8.3]);if(bg.isPointInPath(path,x*ratio,y*ratio)){dot(bg,x,y,.2+random()*.38,'#9a895d');}}}
 bg.restore();}
 if(layers.cities){bg.font='8px Arial';bg.letterSpacing='1.5px';bg.fillStyle='#8aa0a3';for(const [label,p] of [['LONDON',[-.127,51.507]],['MANCHESTER',[-2.24,53.48]],['EDINBURGH',[-3.19,55.95]]]){const [x,y]=project(p);bg.fillText(label,x+10,y-8);}}
}
function resize(){const bounds=canvas.getBoundingClientRect();width=bounds.width;height=bounds.height;ratio=Math.min(devicePixelRatio||1,2);canvas.width=width*ratio;canvas.height=height*ratio;ctx.setTransform(ratio,0,0,ratio,0,0);makeBackground();render();}
function curve(points,t){const [a,b,c]=points.map(project),q=1-t;return [q*q*a[0]+2*q*t*b[0]+t*t*c[0],q*q*a[1]+2*q*t*b[1]+t*t*c[1]];}
function drawFlow(points,index,interconnector=false){const [a,b,c]=points.map(project);ctx.beginPath();ctx.moveTo(...a);ctx.quadraticCurveTo(...b,...c);ctx.strokeStyle=interconnector?'#61c5da45':'#50d8d521';ctx.lineWidth=interconnector?.8:.6;ctx.stroke();const count=interconnector?4:5;
 for(let i=0;i<count;i++){const t=(elapsed*(interconnector?.035:.065)+i/count+index*.17)%1;for(let k=0;k<15;k++){const u=t-k*.004;if(u<0)continue;const [x,y]=curve(points,u);ctx.globalAlpha=(1-k/15)*.8;dot(ctx,x,y,k===0?1.5:.8,interconnector?'#a0eef3':'#77eade');}ctx.globalAlpha=1;const [x,y]=curve(points,t);glow(ctx,x,y,7,'#5adad6',.14);}}
function turbine(x,y,size,index){ctx.save();ctx.translate(x,y);ctx.strokeStyle='#8ed8d9';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,size*1.7);ctx.stroke();ctx.save();ctx.rotate(elapsed*(.65+(index%3)*.12)+index*1.7);for(let i=0;i<3;i++){ctx.rotate(Math.PI*2/3);ctx.beginPath();ctx.moveTo(-.6,0);ctx.lineTo(-.4,-size*.4);ctx.lineTo(.5,-size);ctx.lineTo(1.1,-size*.25);ctx.closePath();ctx.fillStyle='#a2dedd';ctx.fill();}ctx.restore();dot(ctx,0,0,1.1,'#defcf5');ctx.restore();}
function render(){ctx.clearRect(0,0,width,height);ctx.drawImage(background,0,0,width,height);if(layers.wind)flows.forEach((p,i)=>drawFlow(p,i));if(layers.connections)links.forEach((p,i)=>drawFlow(p,i,true));
 if(layers.wind)farms.forEach((farm,fi)=>{const [x,y]=project(farm.p);glow(ctx,x,y,35*zoom,'#2ea8ba',.11);for(let j=0;j<farm.n;j++){const col=j%4,row=Math.floor(j/4);const tx=x+(col-1.5)*12*zoom,ty=y+(row-1)*13*zoom+col*3*zoom;dot(ctx,tx,ty+9*zoom,.8,'#64d7d3');turbine(tx,ty,4.5*zoom,j+fi);}});
}
function frame(t){const dt=Math.min((t-last)/1000,.06);last=t;if(playing){elapsed+=dt*speed;render();}requestAnimationFrame(frame);}
function setPlaying(value){playing=value;document.body.classList.toggle('paused',!value);const b=document.querySelector('#play');b.textContent=value?'Ⅱ':'▶';b.setAttribute('aria-label',value?'Pause animation':'Play animation');document.querySelector('.motion-state').textContent=value?'Running':'Paused';}
document.querySelector('#mix-toggle').onclick=e=>{const open=document.body.classList.toggle('mix-open');e.currentTarget.setAttribute('aria-expanded',String(open));e.currentTarget.querySelector('span').textContent=open?'−':'＋';};
document.querySelector('#play').onclick=()=>setPlaying(!playing);
document.querySelector('#speed').onclick=e=>{speed=speed===1?2:speed===2?.5:1;e.currentTarget.textContent=speed+'×';};
for(const key of ['wind','connections','cities'])document.querySelector('#'+key).onclick=e=>{layers[key]=!layers[key];e.currentTarget.setAttribute('aria-pressed',String(layers[key]));if(key==='cities')makeBackground();render();};
document.querySelector('#zoom-in').onclick=()=>{zoom=Math.min(1.8,zoom+.2);makeBackground();render();};document.querySelector('#zoom-out').onclick=()=>{zoom=Math.max(.6,zoom-.2);makeBackground();render();};document.querySelector('#reset').onclick=()=>{zoom=1;makeBackground();render();};
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',e=>setPlaying(!e.matches));
fetch('assets/coasts.json').then(r=>{if(!r.ok)throw Error('Map unavailable');return r.json()}).then(data=>{coasts=data;resize();setPlaying(playing);requestAnimationFrame(frame);}).catch(()=>{document.querySelector('.motion-state').textContent='Map unavailable';});
addEventListener('resize',resize);
