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
const density=[.85,.28,.64,.16,.90,1,0,.55,.38,.92,.70];
const wind=[1,1,-1,1,1,-1,1,-1,1,1,-1];
const atlas=new Image();atlas.src='assets/golden-spores-atlas.png?v=1';
const cell=256;
const ready=()=>atlas.complete&&atlas.naturalWidth===768&&atlas.naturalHeight===512;
const seen=new Map();
function localTime(m,t){if(!seen.has(m)||t<seen.get(m))seen.set(m,t);return Math.max(0,t-seen.get(m))}
const birdScenes=new Set([0,1,3,5,8,10]);
const mistScenes=new Set([0,1,3,5,8]);
const rand=(n)=>{const x=Math.sin(n*127.1+311.7)*43758.5453123;return x-Math.floor(x)};
function bounds(p){return [Math.min(...p.map(a=>a[0])),Math.min(...p.map(a=>a[1])),Math.max(...p.map(a=>a[0])),Math.max(...p.map(a=>a[1]))]}
function clip(ctx,p){ctx.beginPath();p.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.clip()}
const areas=water.map((ps,m)=>ps.map((p,j)=>{const [x,y,r,b]=bounds(p),seed=(m+1)*1000+j*100;const count=Math.min(35,Math.max(6,Math.round((r-x)*(b-y)/1200)));
return {p,x,y,r,b,glints:Array.from({length:count},(_,i)=>{const k=seed+i*9;return {x:x+rand(k)*(r-x),y:y+rand(k+1)*(b-y),length:14+rand(k+2)*30,phase:rand(k+3)*Math.PI*2,period:2.8+rand(k+4)*4,drift:8+rand(k+5)*12}})} }));
function shimmer(ctx,a,t,warm){
 ctx.save();clip(ctx,a.p);
 for(const g of a.glints){
  const phase=t*Math.PI*2/g.period+g.phase;
  const pulse=Math.pow(.5+.5*Math.sin(phase),1.6);
  if(pulse<.05)continue;
  const x=g.x+Math.sin(phase*.5)*g.drift,y=g.y+Math.sin(phase)*.8,l=g.length*(.8+pulse*.2);
  ctx.globalAlpha=Math.min(.85,(warm?.58:.48)*pulse*intensity);
  const grad=ctx.createLinearGradient(x-l/2,y,x+l/2,y);const color=warm?'255,221,157':'232,240,235';
  grad.addColorStop(0,'rgba('+color+',0)');grad.addColorStop(.5,'rgba('+color+',1)');grad.addColorStop(1,'rgba('+color+',0)');
  ctx.strokeStyle=grad;ctx.lineWidth=1.4+pulse*1.1;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(x-l/2,y+.3);ctx.quadraticCurveTo(x,y-1,x+l/2,y);ctx.stroke();
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
 for(let k=0;k<Math.round(65*d);k++){
  const seed=m*809+k*13+3,period=12+rand(seed)*14,phase=(t/period+rand(seed+1))%1;
  const fade=smooth(phase*6)*smooth((1-phase)*6);
  const px=((rand(seed+2)*1536+dir*t*(7+rand(seed+3)*9)+Math.sin(t*.36+seed)*16)%1536+1536)%1536;
  const py=H*(.13+rand(seed+4)*.58)+Math.sin(t*.24+seed)*17-phase*18;
  ctx.globalAlpha=Math.min(.72,fade*gust*(.35+rand(seed+5)*.32)*intensity);
  ctx.fillStyle=['#FFF0C5','#F5CFD9','#D8D2F4','#DCEAD2'][k%4];
  ctx.beginPath();const size=1.0+rand(seed+6)*1.6;ctx.ellipse(px,py,size,size*.82,0,0,Math.PI*2);ctx.fill();
 }
 ctx.globalAlpha=1;
}
function painted(ctx,m,t,layer,viewLeft,viewRight){
 if(!ready()||!density[m])return;
 const H=heights[m],d=density[m],dir=wind[m],clock=localTime(m,t);
 // Each stream has its own time and trajectory. They are not a single texture moving over the screen.
 const n=layer===0?Math.round(5*d):layer===1?Math.round(6*d):d>.5?2:0;
 for(let k=0;k<n;k++){
  const seed=m*1171+layer*301+k*29+11,period=(layer===2?29:20)+rand(seed)*13;
  const duration=layer===2?period*.50:period*.69;
  const shift=k===0&&m===0&&layer===1?duration*.22:rand(seed+1)*period;
  const time=(clock+shift)%period;if(time>duration)continue;
  const u=time/duration,fade=smooth(u*7)*smooth((1-u)*5);
  const anchor=n===1?700:180+k*1200/Math.max(1,n-1);
  const travel=(layer===0?350:layer===1?470:680)+rand(seed+2)*160;
  const x=anchor+dir*((u-.25)*travel)+Math.sin(u*6.1+seed)*22;
  const y=H*(layer===0?.16+rand(seed+3)*.28:layer===1?.23+rand(seed+3)*.43:.30+rand(seed+3)*.44)+Math.sin(u*5+seed)*24-dir*u*28;
  const size=(layer===0?36+rand(seed+4)*35:layer===1?86+rand(seed+4)*72:155+rand(seed+4)*62)*(1+Math.sin(u*Math.PI)*.08);
  if(x+size<viewLeft||x-size>viewRight)continue;
  const edge=smooth(x/70)*smooth((1536-x)/70);
  const alpha=Math.min(.91,(layer===0?.37:layer===1?.77:.46)*fade*edge*intensity);
  if(alpha<.01)continue;
  const art=(m*3+k*5+layer*2)%6;
  ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,y);ctx.rotate((rand(seed+5)-.5)*.65+Math.sin(u*5+seed)*.18);
  ctx.drawImage(atlas,art%3*cell,Math.floor(art/3)*cell,cell,cell,-size/2,-size/2,size,size);
  ctx.restore();
 }
}
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
 shimmer(ctx,a,t,m===0&&j<2||m===4);
 }
 const left=-ox*1536/w,right=(viewW-ox)*1536/w;
 floatSpores(ctx,m,t);painted(ctx,m,t,0,left,right);painted(ctx,m,t,1,left,right);ctx.globalAlpha=1;
 if(!danger)distantBirds(ctx,m,t);
 ctx.restore();
}
function foreground(ctx,m,ox,oy,w,h,t,viewW){
 if(mode==='off'||reduced||!areas[m]||!Number.isFinite(t)||!w||!h)return;
 ctx.save();ctx.translate(ox,oy);ctx.scale(w/1536,h/heights[m]);painted(ctx,m,t,2,-ox*1536/w,(viewW-ox)*1536/w);ctx.restore();
}
window.GoldenAtmosphere={draw,foreground};
})();