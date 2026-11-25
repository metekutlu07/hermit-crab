/* Golden Shores: atmospheric overlays on stationary original watercolor paintings.
   Coordinates are source-image pixels. Nothing is warped or resampled. */
(function(){
'use strict';
const reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
const rect=(x,y,w,h)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
// Conservative, hand-selected open-water patches, not collision polygons.
// Avoid land, coral, plant silhouettes and stepping stones.
const water=[
 [rect(480,424,326,70),rect(485,508,118,42),rect(1189,423,164,48),rect(1120,425,232,18)],
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
const spores=[
 [[125,505,160,108],[1190,508,220,72]],
 [[435,490,270,90],[1240,522,170,65]],
 [[375,501,210,65],[1270,460,170,80]],
 [[90,475,190,100],[685,489,170,94]],
 [[450,485,215,82],[1250,445,190,80]],
 [[100,420,155,115],[1335,410,160,80]],
 [],
 [[122,550,230,100],[1050,559,230,90]],
 [[240,515,220,90],[660,565,175,68]],
 [[350,365,220,105],[1280,390,195,85]],
 [[175,320,220,135],[1210,369,215,118]]
];
const birdScenes=new Set([1,3,5,8,10]);
const mistScenes=new Set([0,1,3,5,8]);
const rand=(n)=>{const x=Math.sin(n*127.1+311.7)*43758.5453123;return x-Math.floor(x)};
function bounds(p){return [Math.min(...p.map(a=>a[0])),Math.min(...p.map(a=>a[1])),Math.max(...p.map(a=>a[0])),Math.max(...p.map(a=>a[1]))]}
function clip(ctx,p){ctx.beginPath();p.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.clip()}
const areas=water.map((ps,m)=>ps.map((p,j)=>{const [x,y,r,b]=bounds(p),seed=(m+1)*1000+j*100;const count=Math.min(20,Math.max(3,Math.round((r-x)*(b-y)/2400)));
return {p,x,y,r,b,glints:Array.from({length:count},(_,i)=>{const k=seed+i*9;return {x:x+rand(k)*(r-x),y:y+rand(k+1)*(b-y),length:8+rand(k+2)*21,phase:rand(k+3)*Math.PI*2,period:3.8+rand(k+4)*5,drift:4+rand(k+5)*6}})} }));
function shimmer(ctx,a,t,warm){
 ctx.save();clip(ctx,a.p);
 for(const g of a.glints){
  const phase=t*Math.PI*2/g.period+g.phase;
  const pulse=Math.pow(Math.max(0,Math.sin(phase)),2);
  if(pulse<.05)continue;
  const x=g.x+Math.sin(phase*.5)*g.drift,y=g.y+Math.sin(phase)*.8,l=g.length*(.8+pulse*.2);
  ctx.globalAlpha=(warm?.20:.16)*pulse;
  const grad=ctx.createLinearGradient(x-l/2,y,x+l/2,y);const color=warm?'255,221,157':'232,240,235';
  grad.addColorStop(0,'rgba('+color+',0)');grad.addColorStop(.5,'rgba('+color+',1)');grad.addColorStop(1,'rgba('+color+',0)');
  ctx.strokeStyle=grad;ctx.lineWidth=.8+pulse*.65;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(x-l/2,y+.3);ctx.quadraticCurveTo(x,y-1,x+l/2,y);ctx.stroke();
 }
 ctx.restore();
}
function mist(ctx,a,t,m){
 if(a.r-a.x<160||a.b-a.y<24)return;
 ctx.save();clip(ctx,a.p);const cx=(a.x+a.r)/2+Math.sin(t/12+m)*((a.r-a.x)*.16),cy=a.y+(a.b-a.y)*.48;
 ctx.translate(cx,cy);ctx.scale(1,.12);
 const radius=Math.min(180,(a.r-a.x)*.54),g=ctx.createRadialGradient(0,0,0,0,0,radius);
 g.addColorStop(0,'rgba(238,218,229,.055)');g.addColorStop(.55,'rgba(238,218,229,.022)');g.addColorStop(1,'rgba(238,218,229,0)');ctx.fillStyle=g;ctx.fillRect(-radius,-radius,radius*2,radius*2);ctx.restore();
}
function floatSpores(ctx,m,t){
 for(let j=0;j<spores[m].length;j++){
  const [x,y,w,h]=spores[m][j];
  for(let k=0;k<4;k++){
   const seed=m*211+j*97+k*13+3,period=7+rand(seed)*6,phase=(t/period+rand(seed+1))%1;
   const fade=Math.sin(Math.PI*phase)**2;
   const px=x+rand(seed+2)*w+Math.sin(phase*6.28+seed)*12+phase*10;
   const py=y+rand(seed+3)*h-phase*20;
   ctx.globalAlpha=fade*(.22+rand(seed+4)*.17);
   ctx.fillStyle=k%3===0?'#E3C9F4':'#FFE4B2';
   ctx.beginPath();ctx.ellipse(px,py,.7+rand(seed+5)*.8,.8+rand(seed+6)*.6,0,0,Math.PI*2);ctx.fill();
  }
 }
}
function distantBirds(ctx,m,t){
 if(!birdScenes.has(m))return;
 // Infrequent silhouettes, well above the horizon, distinct from the large predator.
 const period=31+m%3*5,phase=(t+m*4.7)%period;
 if(phase>9)return;
 for(let i=0;i<2;i++){
  const u=(phase-i*.52)/8;if(u<0||u>1)continue;
  const x=-28+u*1590,y=heights[m]*.255+Math.sin(u*Math.PI*1.3+i)*11+i*12;
  const a=Math.min(1,u*8,(1-u)*8),span=7+i*1.4,wing=2.8+Math.sin(t*5+i*1.7)*2.1;
  ctx.save();ctx.translate(x,y);ctx.globalAlpha=.36*a;ctx.strokeStyle='#574566';ctx.lineWidth=1.15;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(-span,-wing);ctx.quadraticCurveTo(-span*.44,-wing-1,0,0);ctx.quadraticCurveTo(span*.44,-wing-1,span,-wing);ctx.stroke();ctx.restore();
 }
}
function draw(ctx,im,m,ox,oy,w,h,t,viewW,danger){
 if(reduced||!areas[m]||!Number.isFinite(t)||!w||!h)return;
 ctx.save();ctx.translate(ox,oy);ctx.scale(w/1536,h/heights[m]);
 // Keep every effect inside its own landscape; the original artwork is never moved.
 ctx.beginPath();ctx.rect(0,0,1536,heights[m]);ctx.clip();
 for(let j=0;j<areas[m].length;j++){const a=areas[m][j];if(ox+a.r*w/1536<0||ox+a.x*w/1536>viewW)continue;
 if(mistScenes.has(m)&&j===0)mist(ctx,a,t,m);
 shimmer(ctx,a,t,m===0&&j<2||m===4);
 }
 floatSpores(ctx,m,t);ctx.globalAlpha=1;
 if(!danger)distantBirds(ctx,m,t);
 ctx.restore();
}
window.GoldenAtmosphere={draw};
})();