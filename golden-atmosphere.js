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
const density=[0,.28,.64,.16,.90,1,0,.55,.38,.92,.70];
const wind=[1,1,-1,1,1,-1,1,-1,1,1,-1];
const atlas=new Image();atlas.src='assets/golden-blob-pollen.png?v=1';
const cell=160;
const ready=()=>atlas.complete&&atlas.naturalWidth===640&&atlas.naturalHeight===480;
// Purple and pink only, retaining original pigments.
const pollenFamilies=[[1,4,10],[3,6]];
const birdScenes=new Set([0,1,3,5,8,10]);
const mistScenes=new Set([0,1,3,5,8]);
const shimmerScenes=new Set([0,1,2,5,7,8,10]);
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
  ctx.globalAlpha=Math.min(.38,(warm?.29:.23)*pulse*Math.min(intensity,1.15));
  const grad=ctx.createLinearGradient(x-l/2,y,x+l/2,y);const color=warm?'255,221,157':'232,240,235';
  grad.addColorStop(0,'rgba('+color+',0)');grad.addColorStop(.5,'rgba('+color+',1)');grad.addColorStop(1,'rgba('+color+',0)');
  ctx.strokeStyle=grad;ctx.lineWidth=.9+pulse*.65;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(x-l/2,y+.3);ctx.quadraticCurveTo(x,y-1,x+l/2,y);ctx.stroke();
 }
 ctx.restore();
}
// Opening sunset: illuminate existing painted pigment rather than adding a glowing disc.
// Localized masks are extracted once from the actual painting at its native coordinates.
let sunsetMasks=null;
function buildSunsetMasks(im){
 if(sunsetMasks&&sunsetMasks.im===im)return sunsetMasks;
 if(typeof document==='undefined'||!im?.naturalWidth)return null;
 try{
  const source=document.createElement('canvas');source.width=1536;source.height=938;
  const sc=source.getContext('2d',{willReadFrequently:true});sc.drawImage(im,0,0,1536,938);
  const px=sc.getImageData(0,0,1536,938).data;
  function makeMask(x,y,w,h,kind){
   const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d');const out=ctx.createImageData(w,h),d=out.data;
   for(let j=0;j<h;j++)for(let i=0;i<w;i++){
    const X=x+i,Y=y+j,at=(Y*1536+X)*4,k=(j*w+i)*4;
    const r=px[at],g=px[at+1],b=px[at+2];
    // Warm gold/peach pigment only; dark purple contours and cool sea are excluded.
    const warm=smooth((r-b-12)/54)*smooth((g-b+4)/40)*smooth((r-145)/80);
    let weight=0;
    if(kind==='sun'){
     // Approximate solar centre from the supplied mobile screenshot.
     const rho=Math.hypot((X-474)/130,(Y-371)/112);
     const falloff=smooth(1-rho);
     // Avoid the large foreground tree on the left of the opening.
     weight=falloff*smooth((X-395)/55)*warm;
    }else{
     // Existing horizontal golden reflections beneath the sun, not the sandy path.
     const gold=warm*smooth((g-95)/65);
     const edge=smooth((X-x)/18)*smooth((x+w-X)/24)*smooth((Y-y)/8)*smooth((y+h-Y)/10);
     weight=gold*edge;
    }
    d[k]=255;d[k+1]=kind==='sun'?217:232;d[k+2]=kind==='sun'?174:173;d[k+3]=Math.round(weight*255);
   }
   ctx.putImageData(out,0,0);return{c,x,y,w,h};
  }
  sunsetMasks={im,sun:makeMask(385,255,250,170,'sun'),sea:makeMask(390,416,405,104,'sea')};
  return sunsetMasks;
 }catch(e){return null}
}
function openingSunset(ctx,im,t){
 const masks=buildSunsetMasks(im);if(!masks)return;
 ctx.save();ctx.globalCompositeOperation='screen';
 const sun=masks.sun;
 // Small amplitude and two slow, non-synchronized cycles avoid a mechanical pulse.
 const breathe=.5+.32*Math.sin(t*.31)+.18*Math.sin(t*.113+1.6);
 ctx.globalAlpha=.09+.30*breathe;
 ctx.drawImage(sun.c,sun.x,sun.y);
 const sea=masks.sea;
 // Travel along existing golden brushstrokes. Multiple staggered horizontal bands.
 for(let y=0;y<sea.h;y+=2){
  const f=y/sea.h,phase=t*(.80+f*.24)-y*.21;
  const glint=Math.pow(.5+.5*Math.sin(phase+.50*Math.sin(t*.23+y*.07)),2);
  const shimmer=.5+.5*Math.sin(t*.47+y*.13+1.3);
  ctx.globalAlpha=.12+.55*glint*(.55+.45*shimmer);
  const dy=Math.min(2,sea.h-y);
  ctx.drawImage(sea.c,0,y,sea.w,dy,sea.x,sea.y+y,sea.w,dy);
 }
 ctx.restore();
}
// A visible layer of golden strokes in the ocean beneath the sun.
function sunsetWaterGlints(ctx,t){
 ctx.save();clip(ctx,[[393,422],[516,422],[538,432],[538,488],[468,488],[444,470],[420,453]]);
 const rows=[{x:475,y:427,l:58},{x:479,y:436,l:62},{x:460,y:446,l:51},{x:492,y:456,l:68},{x:486,y:470,l:55},{x:509,y:480,l:36}];
 for(let i=0;i<rows.length;i++){
  const g=rows[i],phase=t*(1.05+i*.09)+i*1.63,p=.5+.5*Math.sin(phase);
  const x=g.x+7*Math.sin(t*.61+i*2.1),y=g.y+1.15*Math.sin(phase*.67),l=g.l*(.5+.5*p);
  const grad=ctx.createLinearGradient(x-l/2,y,x+l/2,y);grad.addColorStop(0,'rgba(255,238,182,0)');grad.addColorStop(.45,'rgba(255,245,201,1)');grad.addColorStop(1,'rgba(255,238,182,0)');
  ctx.globalAlpha=.18+.57*p*p;ctx.strokeStyle=grad;ctx.lineWidth=1.2+1.5*p;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x-l/2,y);ctx.quadraticCurveTo(x,y-.8,x+l/2,y+.3);ctx.stroke();
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
  const py=H*(.10+rand(seed+4)*.47)+Math.sin(t*.24+seed)*17-phase*18;
  ctx.globalAlpha=Math.min(.72,fade*gust*(.35+rand(seed+5)*.32)*intensity);
  ctx.fillStyle=['#F5CFD9','#D8D2F4','#F1C5DD','#CFC0E7'][k%4];
  ctx.beginPath();const size=1.0+rand(seed+6)*1.6;ctx.ellipse(px,py,size,size*.82,0,0,Math.PI*2);ctx.fill();
 }
 ctx.globalAlpha=1;
}
// Individual pollen: screen-crossing wind currents, with independent soft motion.
const pollen={items:[],t:null,cam:0,w:0,h:0,next:0,serial:0};
const layers=[
 {size:[.024,.036],speed:[.022,.040],parallax:.09},
 {size:[.031,.063],speed:[.038,.072],parallax:.20},
 {size:[.064,.100],speed:[.055,.090],parallax:.35}
];
const between=(a,b,r)=>a+(b-a)*r;
function emit(m,W,H,seeded=false,seam=-Infinity){
 const d=density[m]||0;if(!d)return;
 const max=W<H?12:19;
 const free=max-pollen.items.length;if(free<=0)return;
 const seed=++pollen.serial*37+m*971;
 const r=i=>rand(seed+i*11);
 const layer=r(1)<.40?0:r(1)<.92?1:2;
 const count=Math.min(free,layer===2?2:r(2)<.45?1:r(2)<.78?2:3);
 const L=layers[layer],cy=H*between(.13,.54,r(4)),cx=seeded?Math.max(seam+H*.12,W*between(.25,.95,r(5))):Math.max(W+H*.13,seam+H*.15);
 const common=between(...L.speed,r(6))*H,phi=r(7)*Math.PI*2, family=Math.floor(r(8)*pollenFamilies.length);
 for(let k=0;k<count;k++){
  const n=seed+k*73,q=i=>rand(n+i*17);
  const size=H*Math.max(.024,between(...L.size,q(1))*(layer===2?1:k===0?1:k===1?.68:.48));
  const choices=pollenFamilies[family],art=choices[Math.floor(q(3)*choices.length)];
  pollen.items.push({layer,art,family,size,x:cx+k*H*.037+H*(q(4)-.5)*.025,y:cy+H*(q(5)-.5)*.09,
   age:seeded?1.7:q(6)*.45,life:Math.max(22,(W+H*.4)/common*1.8),
   vx:common*between(.79,1.23,q(7)),vy:H*between(-.013,.011,q(8)),
   phase:q(9)*Math.PI*2,phi,rate:between(.38,.86,q(10)),rotation:q(11)*Math.PI*2,
   spin:between(.035,.11,q(12))*(q(13)<.5?-1:1),rock:between(.24,.57,q(14))});
 }
}
function tick(m,W,H,t,cam,seam=-Infinity){
 if(mode==='off'||reduced||!ready()||!W||!H)return;
 const p=pollen;
 // Introduce particles offscreen before the beach enters view, never at the scene switch.
 const nearBeach=m===0&&seam<W+H*.25,zone=m===0?(nearBeach?1:0):m,d=density[zone]||0;
 const reset=p.t===null||t<p.t||t-p.t>1||Math.abs(W-p.w)>2||Math.abs(H-p.h)>2||Math.abs(cam-p.cam)>H*1.5;
 if(reset){p.items=[];p.t=t;p.cam=cam;p.w=W;p.h=H;p.next=t;if(d&&m>0){for(let i=0;i<2;i++)emit(zone,W,H,true,seam)}}
 const dt=Math.min(.055,Math.max(0,t-p.t)),dc=cam-p.cam;p.t=t;p.cam=cam;
 const windPulse=.74+.26*Math.sin(t*.21+m*.8);
 if(d&&t>=p.next){
  emit(zone,W,H,false,seam);
  const lull=rand(p.serial*29+zone*73)<.24;
  p.next=t+(lull?7:between(2.4,5,rand(p.serial*59)))/Math.max(.30,d);
 }else if(!d){p.next=t}
 for(const q of p.items){
  q.age+=dt;
  const gust=1+.32*Math.sin(t*.38+q.phi)+.19*Math.sin(t*.93+q.phase);
  const flutter=Math.sin(q.age*q.rate+q.phase);
  q.x-=q.vx*windPulse*gust*dt+dc*(m===0?1:layers[q.layer].parallax);
  q.x+=H*.018*Math.sin(q.age*1.15+q.phase)*dt;
  const low=H*.07+q.size*.72,high=H*2/3-q.size*.72;
  let vy=q.vy+H*(.034*flutter+.014*Math.sin(q.age*1.3+q.phase*.7));
  const margin=H*.09;if(vy>0)vy*=smooth((high-q.y)/margin);else vy*=smooth((q.y-low)/margin);
  q.y=Math.max(low,Math.min(high,q.y+vy*dt));
  q.rotation+=q.spin*dt;
 }
 p.items=p.items.filter(q=>q.x> -q.size*1.3&&q.x<W+H*.95);
}
function drawPollen(ctx,front,W,H){
 if(mode==='off'||reduced||!ready())return;
 for(const q of pollen.items.slice().sort((a,b)=>a.size-b.size)){
  if((q.size>H*.036)!==front||q.x+q.size<0||q.x-q.size>W)continue;
  const size=q.size;
  ctx.save();ctx.globalAlpha=1;ctx.shadowBlur=0;ctx.shadowColor='transparent';ctx.translate(q.x,q.y);ctx.rotate(q.rotation+q.rock*Math.sin(q.age*.64+q.phase)+.12*Math.sin(q.age*1.31+q.phi));
  ctx.drawImage(atlas,q.art%4*cell,Math.floor(q.art/4)*cell,cell,cell,-size/2,-size/2,size,size);ctx.restore();
 }
}
function pollenReset(){pollen.t=null;pollen.items=[]}
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
 if(shimmerScenes.has(m)&&(m!==0||j!==0))shimmer(ctx,a,t,m===0);
 }
 if(m===0){openingSunset(ctx,im,t);sunsetWaterGlints(ctx,t);}
 floatSpores(ctx,m,t);ctx.globalAlpha=1;
 if(!danger)distantBirds(ctx,m,t);
 ctx.restore();
}
window.GoldenAtmosphere={draw,tick,drawPollen,pollenReset};
})();