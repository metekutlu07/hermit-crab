/* Golden Shores: atmospheric overlays on stationary original watercolor paintings.
   Coordinates are source-image pixels. Nothing is warped or resampled. */
(function(){
'use strict';
const mode=typeof location==='object'?new URLSearchParams(location.search).get('effects'):null;
const reduced=mode!=='on'&&mode!=='strong'&&typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
const intensity=mode==='strong'?1.5:1;
const rect=(x,y,w,h)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
// Conservative, hand-selected open-water patches, not collision polygons.
// Avoid land, coral, plant silhouettes and stepping stones.
const water=[
 [rect(420,424,375,74),rect(474,508,135,48),rect(1189,423,164,48),rect(1120,425,232,18)],
 [rect(145,418,1290,25),rect(193,447,235,30),rect(790,452,489,41)],
 [rect(275,380,540,35),rect(372,419,230,60),[[793,568],[864,554],[956,557],[1052,573],[1085,585],[1035,595],[895,598],[826,587]]],
 [rect(284,399,369,28),rect(1137,399,183,49),rect(1080,463,185,40)],
 [rect(330,411,640,37),rect(142,445,140,47)],
 [rect(459,391,784,31),rect(502,431,133,39),rect(784,602,260,35),rect(455,631,220,26)],
 [], // Scene 07 not independently visually verified.
 [rect(285,428,310,51),rect(1080,510,410,35),rect(48,587,104,27)],
 [rect(1245,487,285,64),rect(760,733,273,18)],
 [rect(900,360,267,46),rect(115,486,95,25)],
 [rect(753,396,358,32),rect(800,434,225,27),[[475,614],[535,603],[600,604],[640,617],[590,632],[514,628]],[[803,599],[845,588],[900,584],[968,594],[980,607],[905,613],[839,611]]]
];
const heights=[938,938,847,847,847,847,847,847,847,847,705];
// Scene-specific wind: still passages alternate with currents of airborne life.
const density=[0,.58,.58,.58,.58,.58,.58,.58,.58,.58,.58];
const wind=[1,1,-1,1,1,-1,1,-1,1,1,-1];
const atlas=new Image();atlas.src='assets/golden-blob-pollen.png?v=1';
const cell=160;
const ready=()=>atlas.complete&&atlas.naturalWidth===640&&atlas.naturalHeight===480;
// Purple and pink only, retaining original pigments.
const pollenFamilies=[[4],[3,6]]; // Rounded lavender and pink only; exclude elongated bean silhouettes.
const birdScenes=new Set([0,1,3,5,8,10]);
const mistScenes=new Set([0,1,3,5,8]);
const shimmerScenes=new Set([0,1,2,3,4,5,7,8,9,10]);
const rand=(n)=>{const x=Math.sin(n*127.1+311.7)*43758.5453123;return x-Math.floor(x)};
function bounds(p){return [Math.min(...p.map(a=>a[0])),Math.min(...p.map(a=>a[1])),Math.max(...p.map(a=>a[0])),Math.max(...p.map(a=>a[1]))]}
function clip(ctx,p){ctx.beginPath();p.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.clip()}
const areas=water.map((ps,m)=>ps.map((p,j)=>{const [x,y,r,b]=bounds(p),seed=(m+1)*1000+j*100;const count=Math.min(35,Math.max(6,Math.round((r-x)*(b-y)/1200)));
return {p,x,y,r,b,glints:Array.from({length:count},(_,i)=>{const k=seed+i*9;return {x:x+rand(k)*(r-x),y:y+rand(k+1)*(b-y),length:14+rand(k+2)*30,phase:rand(k+3)*Math.PI*2,period:2.8+rand(k+4)*4,drift:8+rand(k+5)*12}})} }));
function shimmer(ctx,a,t,warm){
 ctx.save();clip(ctx,a.p);
 for(const g of a.glints){
  const phase=t*Math.PI*2/g.period+g.phase;
  const pulse=Math.pow(.5+.5*Math.sin(phase),1.8);
  if(pulse<.05)continue;
  const x=g.x+Math.sin(phase*.5)*g.drift,y=g.y+Math.sin(phase)*1.2,l=g.length*(warm?1.65:1.20)*(.45+.55*pulse);
  ctx.globalAlpha=Math.min(.86,(warm?.82:.64)*pulse*Math.min(intensity,1.15));
  const grad=ctx.createLinearGradient(x-l/2,y,x+l/2,y);const color=warm?'255,239,190':'236,240,239';
  grad.addColorStop(0,'rgba('+color+',0)');grad.addColorStop(.5,'rgba('+color+',1)');grad.addColorStop(1,'rgba('+color+',0)');
  ctx.strokeStyle=grad;ctx.lineWidth=1.25+pulse*(warm?2.3:1.55);ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(x-l/2,y+.3);ctx.quadraticCurveTo(x,y-1,x+l/2,y);ctx.stroke();
 }
 ctx.restore();
}
// Masks are derived from the actual 1536 × 938 opening painting.
// The sun is at (478,374); its reflection extends from y=416 down to y=583.
// Paint-compatible contrast changes, not a screen-blend glow on nearly white pixels.
let sunsetMasks=null;
function inRegion(x,y,poly){
 let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const [a,b]=poly[i],[c,d]=poly[j];if((b>y)!==(d>y)&&x<(c-a)*(y-b)/(d-b)+a)inside=!inside}return inside;
}
const reflectionRegion=[[407,416],[552,416],[609,463],[646,497],[650,535],[617,567],[574,583],[484,578],[470,515],[443,495],[414,469],[398,451]];
function buildSunsetMasks(im){
 if(sunsetMasks&&sunsetMasks.im===im)return sunsetMasks;
 if(typeof document==='undefined'||!im?.naturalWidth)return null;
 try{
  const source=document.createElement('canvas');source.width=1536;source.height=938;const sc=source.getContext('2d',{willReadFrequently:true});sc.drawImage(im,0,0,1536,938);
  const px=sc.getImageData(0,0,1536,938).data;
  function make(x,y,w,h,kind,bright){
   const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d'),out=ctx.createImageData(w,h),d=out.data;
   for(let j=0;j<h;j++)for(let i=0;i<w;i++){
    const X=x+i,Y=y+j,k=(j*w+i)*4,at=(Y*1536+X)*4,r=px[at],g=px[at+1],b=px[at+2];
    const warm=smooth((r-b-12)/55)*smooth((g-b+3)/40)*smooth((r-133)/85);
    let weight;
    if(kind==='sun'){
     const radius=Math.hypot((X-478)/152,(Y-374)/125);
     weight=smooth(1-radius)*smooth((X-397)/28)*warm;
    }else{
     const gold=warm*smooth((g-112)/65);
     weight=inRegion(X,Y,reflectionRegion)?gold*smooth((Y-415)/5)*smooth((583-Y)/10):0;
    }
    const delta=kind==='sun'?(bright?[32,42,35]:[-17,-24,-25]):(bright?[32,51,58]:[-39,-43,-23]);
    d[k]=r+delta[0];d[k+1]=g+delta[1];d[k+2]=b+delta[2];d[k+3]=Math.round(weight*255);
   }
   ctx.putImageData(out,0,0);return {c,x,y,w,h};
  }
  sunsetMasks={im,waterLight:make(390,416,270,168,'water',true),waterShade:make(390,416,270,168,'water',false)};
  return sunsetMasks;
 }catch(e){return null}
}
function openingWater(ctx,im,t){
 const masks=buildSunsetMasks(im);if(!masks)return;
 ctx.save();ctx.globalCompositeOperation='source-over';
 // The original sun and sky are stationary and unmodified. Animate water only.
 const sea=masks.waterLight;
 for(let y=0;y<sea.h;y+=3){
  const f=y/sea.h,phase=t*(1.35+f*.55)-y*.16;
  const wave=.72*Math.sin(phase)+.28*Math.sin(t*.79+y*.085);
  const src=wave>=0?masks.waterLight:masks.waterShade;
  ctx.globalAlpha=.15+.82*Math.abs(wave);
  const dy=Math.min(3,sea.h-y);ctx.drawImage(src.c,0,y,sea.w,dy,sea.x,sea.y+y,sea.w,dy);
 }
 ctx.restore();
}
// Visible but painterly moving highlights, positioned on the original ocean strokes.
function sunsetWaterGlints(ctx,t){
 ctx.save();clip(ctx,reflectionRegion);
 const rows=[{x:475,y:423,l:61},{x:482,y:434,l:70},{x:475,y:448,l:91},{x:470,y:463,l:104},{x:481,y:481,l:125},{x:491,y:498,l:125},{x:530,y:536,l:99},{x:529,y:565,l:78}];
 for(let i=0;i<rows.length;i++){
  const g=rows[i],phase=t*(1.28+i*.07)+i*1.53,p=.5+.5*Math.sin(phase);
  const x=g.x+12*Math.sin(t*.83+i*2.1),y=g.y+1.6*Math.sin(phase*.67),l=g.l*(.32+.68*p);
  const grad=ctx.createLinearGradient(x-l/2,y,x+l/2,y);grad.addColorStop(0,'rgba(255,239,190,0)');grad.addColorStop(.24,'rgba(255,244,204,.7)');grad.addColorStop(.5,'rgba(255,250,218,1)');grad.addColorStop(.78,'rgba(255,239,190,.5)');grad.addColorStop(1,'rgba(255,239,190,0)');
  ctx.globalAlpha=.13+.76*p*p;ctx.strokeStyle=grad;ctx.lineWidth=1.6+2.4*p;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x-l/2,y);ctx.quadraticCurveTo(x,y-1.1,x+l/2,y+.4);ctx.stroke();
 }
 ctx.restore();
}
function mist(ctx,a,t,m){
 if(a.r-a.x<160||a.b-a.y<24)return;
 ctx.save();clip(ctx,a.p);const cx=(a.x+a.r)/2+Math.sin(t/12+m)*((a.r-a.x)*.16),cy=a.y+(a.b-a.y)*.48;
 ctx.translate(cx,cy);ctx.scale(1,.12);
 const radius=Math.min(180,(a.r-a.x)*.54),g=ctx.createRadialGradient(0,0,0,0,0,radius);
 g.addColorStop(0,'rgba(238,218,229,.12)');g.addColorStop(.55,'rgba(238,218,229,.045)');g.addColorStop(1,'rgba(238,218,229,0)');ctx.fillStyle=g;ctx.fillRect(-radius,-radius,radius*2,radius*2);ctx.restore();
}
function smooth(x){x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)}
function floatSpores(ctx,m,t){
 const d=density[m];if(!d)return;
 const H=heights[m],dir=wind[m],gust=.32+.68*Math.pow(.5+.5*Math.sin(t*.19+m*1.7),2);
 // Tiny airborne motes, distributed through the atmosphere, with irregular gaps.
 for(let k=0;k<Math.round(19*d);k++){
  const seed=m*809+k*13+3,period=12+rand(seed)*14,phase=(t/period+rand(seed+1))%1;
  const fade=smooth(phase*6)*smooth((1-phase)*6);
  const px=((rand(seed+2)*1536+dir*t*(7+rand(seed+3)*9)+Math.sin(t*.36+seed)*16)%1536+1536)%1536;
  const py=H*(.10+rand(seed+4)*.36)+Math.sin(t*.24+seed)*17-phase*18;
  ctx.globalAlpha=Math.min(.72,fade*gust*(.35+rand(seed+5)*.32)*intensity);
  ctx.fillStyle=['#F5CFD9','#D8D2F4','#F1C5DD','#CFC0E7'][k%4];
  ctx.beginPath();const size=1.0+rand(seed+6)*1.6;ctx.ellipse(px,py,size,size*.82,0,0,Math.PI*2);ctx.fill();
 }
 ctx.globalAlpha=1;
}
// Individual pollen: screen-crossing wind currents, with independent soft motion.
// Persistent world-space field. All positions are expressed in units of landscape height,
// never screen pixels. The camera is used only when projecting positions for drawing.
const pollen={items:[],t:null,cam:0,start:null,end:null};
const layers=[{size:[.024,.036],speed:.026},{size:[.031,.040],speed:.043},{size:[.038,.044],speed:.058}];
const between=(a,b,r)=>a+(b-a)*r;
function populate(start,end){
 const items=[],spacing=.39;
 for(let lane=0;lane<3;lane++){
  let j=0;
  for(let x=start+.09+lane*spacing/3;x<end+.28;x+=spacing){
   const seed=lane*100003+j++*173+81,r=i=>rand(seed+i*17);
   const layer=r(1)<.35?0:r(1)<.78?1:2,L=layers[layer];
   const size=between(...L.size,r(2)),choices=pollenFamilies[Math.floor(r(3)*pollenFamilies.length)];
   const low=.07+size*.72,high=.5-size*.72;
   const y=low+(high-low)*((lane+.15+.70*r(4))/3);
   items.push({layer,size,art:choices[Math.floor(r(5)*choices.length)],x:x+(r(6)-.5)*.065,y,
    vx:L.speed*between(.91,1.09,r(7)),phase:r(8)*Math.PI*2,phi:r(9)*Math.PI*2,rate:between(.38,.86,r(10)),
    rotation:r(11)*Math.PI*2,spin:between(.035,.11,r(12))*(r(13)<.5?-1:1),rock:between(.24,.57,r(14)),age:0});
  }
 }
 return items;
}
function tick(m,W,H,t,cam,seam,total){
 if(mode==='off'||reduced||!ready()||!W||!H||!Number.isFinite(total))return;
 const p=pollen,start=(seam+cam)/H,end=total/H,view=cam/H,viewRight=view+W/H;
 if(p.start===null||Math.abs(p.start-start)>.02||Math.abs(p.end-end)>.02){
  p.items=populate(start,end);p.start=start;p.end=end;p.t=t;
 }
 const dt=p.t===null||t<p.t?0:Math.min(.055,Math.max(0,t-p.t));p.t=t;p.cam=cam;
 const windPulse=.80+.20*Math.sin(t*.21);
 for(const q of p.items){
  q.age+=dt;
  const gust=1+.24*Math.sin(t*.38+q.phi)+.12*Math.sin(t*.93+q.phase);
  q.x-=q.vx*windPulse*gust*dt;
  q.x+=.008*Math.sin(q.age*1.15+q.phase)*dt;
  const low=.07+q.size*.72,high=.5-q.size*.72;
  let vy=.025*Math.sin(q.age*q.rate+q.phase)+.011*Math.sin(q.age*1.3+q.phase*.7);
  const margin=.09;if(vy>0)vy*=smooth((high-q.y)/margin);else vy*=smooth((q.y-low)/margin);
  q.y=Math.max(low,Math.min(high,q.y+vy*dt));q.rotation+=q.spin*dt;
  // Recycle only outside the camera view. No visible pop on crossing a module boundary.
  if(q.x<start-.28&&(q.x+q.size<view||q.x-q.size>viewRight)){
   const destination=end+.30+(q.x-(start-.28));
   if(destination-q.size>viewRight||destination+q.size<view)q.x=destination;
  }
 }
}
function drawPollen(ctx,front,W,H){
 if(mode==='off'||reduced||!ready())return;
 for(const q of pollen.items){
  if((q.size>.036)!==front)continue;
  const x=q.x*H-pollen.cam,y=q.y*H,size=q.size*H;
  if(x+size<0||x-size>W)continue;
  ctx.save();ctx.globalAlpha=1;ctx.shadowBlur=0;ctx.shadowColor='transparent';ctx.translate(x,y);ctx.rotate(q.rotation+q.rock*Math.sin(q.age*.64+q.phase)+.12*Math.sin(q.age*1.31+q.phi));
  ctx.drawImage(atlas,q.art%4*cell,Math.floor(q.art/4)*cell,cell,cell,-size/2,-size/2,size,size);ctx.restore();
 }
}
function pollenReset(){pollen.t=null;pollen.items=[];pollen.start=null;pollen.end=null}
function distantBirds(ctx,m,t){
 if(!birdScenes.has(m))return;
 // Infrequent silhouettes, well above the horizon, distinct from the large predator.
 const period=23+m%3*4,phase=(t+m*3.1+2)%period;
 if(phase>11)return;
 for(let i=0;i<2;i++){
  const u=(phase-i*.65)/10;if(u<0||u>1)continue;
  const x=m===0?380+u*1170:-28+u*1590,y=(m===0?286:heights[m]*.255)+Math.sin(u*Math.PI*1.3+i)*11+i*12;
  const a=Math.min(1,u*8,(1-u)*8),span=10+i*1.8,wing=4+Math.sin(t*5+i*1.7)*3;
  ctx.save();ctx.translate(x,y);ctx.globalAlpha=Math.min(.8,.65*a*intensity);ctx.strokeStyle='#574566';ctx.lineWidth=1.65;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(-span,-wing);ctx.quadraticCurveTo(-span*.44,-wing-1,0,0);ctx.quadraticCurveTo(span*.44,-wing-1,span,-wing);ctx.stroke();ctx.restore();
 }
}
function draw(ctx,im,m,ox,oy,w,h,t,viewW,danger){
 if(mode==='off'||reduced||!areas[m]||!Number.isFinite(t)||!w||!h)return;
 ctx.save();ctx.translate(ox,oy);ctx.scale(w/1536,h/heights[m]);
 // Keep every effect inside its own landscape; the original artwork is never moved.
 ctx.beginPath();ctx.rect(0,0,1536,heights[m]);ctx.clip();
 for(let j=0;j<areas[m].length;j++){const a=areas[m][j];if(ox+a.r*w/1536<0||ox+a.x*w/1536>viewW)continue;
 if(mistScenes.has(m)&&j===0)mist(ctx,a,t,m);
 if(shimmerScenes.has(m)&&(m!==0||j!==0))shimmer(ctx,a,t,m===0||a.y<500);
 }
 if(m===0){openingWater(ctx,im,t);sunsetWaterGlints(ctx,t);}
 floatSpores(ctx,m,t);ctx.globalAlpha=1;
 if(!danger)distantBirds(ctx,m,t);
 ctx.restore();
}
window.GoldenAtmosphere={draw,tick,drawPollen,pollenReset};
})();