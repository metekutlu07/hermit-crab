/* Real PNG frame animation. Keep the existing art until optional new files are uploaded. */
(function(){
'use strict';
const load=name=>{const im=new Image();im.src='assets/'+name;return im};
const ready=(im,w,h)=>im.complete&&im.naturalWidth>0&&(!w||(im.naturalWidth===w&&im.naturalHeight===h));
const canvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
function split(im,cols,rows,w,h){
 const result=[];for(let i=0;i<cols*rows;i++){const c=canvas(w,h);c.getContext('2d').drawImage(im,(i%cols)*w,Math.floor(i/cols)*h,w,h,0,0,w,h);result.push(c)}return result;
}
function timeline(t,seq){
 if(reduced.matches)return 0;
 let total=0;for(const [n,d] of seq)total+=d;
 let p=((t%total)+total)%total;
 for(const [n,d] of seq){if(p<d)return n;p-=d}return 0;
}

// Selective color correction of the existing PNG frames. No pose or texture changes.
const clamp01=v=>Math.max(0,Math.min(1,v));
function smooth(v){v=clamp01(v);return v*v*(3-2*v)}
function warmHomeFrame(c){
 const cx=c.getContext('2d'),p=cx.getImageData(0,0,c.width,c.height),d=p.data;
 for(let i=0;i<d.length;i+=4){
  if(!d[i+3])continue;
  const r=d[i]/255,g=d[i+1]/255,b=d[i+2]/255,v=Math.max(r,g,b),mn=Math.min(r,g,b),ch=v-mn;
  let h=0,s=v?ch/v:0;
  if(ch){h=v===r?(g-b)/ch:v===g?2+(b-r)/ch:4+(r-g)/ch;h/=6;if(h<0)h+=1}
  const signed=h>.5?h-1:h,y=Math.floor(i/4/c.width);
  const shell=1-smooth((y-200)/60),light=smooth((v-.72)/.23)*shell;
  const pink=smooth((.063-signed)/.075)*smooth((v-.26)/.28)*smooth((s-.045)/.13);
  const amount=clamp01(pink*(.63+.27*shell)+.22*light);
  let nh=signed+(.085-signed)*amount,ns=clamp01(s*(1-.07*amount)+.035*shell*amount);
  const shadow=smooth((y-282)/45)*smooth((.02-signed)/.05)*smooth((.47-s)/.27);
  nh=nh*(1-shadow)+.09*shadow;ns=ns*(1-shadow)+(.24+.09*(1-v))*shadow;
  const nv=clamp01(v*(1-.055*shadow)+.03*amount*(1-v));
  nh=((nh%1)+1)%1;
  const q=nh*6,sector=Math.floor(q),f=q-sector,P=nv*(1-ns),Q=nv*(1-ns*f),T=nv*(1-ns*(1-f));
  const rgb=[[nv,T,P],[Q,nv,P],[P,nv,T],[P,Q,nv],[T,P,nv],[nv,P,Q]][sector%6];
  d[i]=Math.round(rgb[0]*255);d[i+1]=Math.round(rgb[1]*255);d[i+2]=Math.round(rgb[2]*255);d[i+3]=Math.round(d[i+3]*(1-.34*shadow));
 }
 cx.putImageData(p,0,0);return c;
}

const gameSequence=[[0,2.2],[1,.28],[2,.65],[1,.25],[0,1.6],[3,.3],[4,.65],[5,.4],[0,1.5]];
const homeSequence=[[0,1.8],[1,.25],[2,.75],[1,.25],[3,1.4],[4,.18],[3,.8],[5,.3],[6,.8],[7,.4],[0,1.3]];
const gameSheet=load('crab-golden-look.png');let gameFrames=null;
function gameFrame(im,t){
 if(!ready(gameSheet,960,560))return null;
 if(!gameFrames)gameFrames=split(gameSheet,3,2,320,280);
 return gameFrames[timeline(t,gameSequence)];
}
window.CrabIdle={gameFrame};
const home=document.getElementById('home'),layer=document.getElementById('homeCrabLayer'),art=home?.querySelector('.home-art');
if(!home||!layer||!art)return;
const bgPortrait=load('home-portrait-empty.jpeg'),bgLandscape=load('home-landscape-empty.jpeg'),homeSheet=load('crab-home-look.png');
const ctx=layer.getContext('2d'),portraitQuery=window.matchMedia('(orientation: portrait)');
let frames=null,last=-1,lastBg=null,lastW=0,lastH=0,lastScale=0,start=null;
function draw(now){
 if(!home.classList.contains('visible')){start=null;requestAnimationFrame(draw);return}
 const portrait=portraitQuery.matches,bg=portrait?bgPortrait:bgLandscape;
 const w=art.clientWidth,h=art.clientHeight;
 if(!w||!h||!ready(bg)||!ready(homeSheet,1600,760)){
  layer.classList.remove('ready');last=-1;start=null;requestAnimationFrame(draw);return
 }
 if(!frames)frames=split(homeSheet,4,2,400,380).map(warmHomeFrame);
 if(start===null)start=now;
 const frame=timeline((now-start)/1000,homeSequence);
 const ratio=Math.min(2,window.devicePixelRatio||1,2400/Math.max(w,h));
 if(frame!==last||bg!==lastBg||w!==lastW||h!==lastH||ratio!==lastScale){
  const bw=Math.round(w*ratio),bh=Math.round(h*ratio);
  if(layer.width!==bw)layer.width=bw;if(layer.height!==bh)layer.height=bh;
  ctx.setTransform(ratio,0,0,ratio,0,0);
  const sc=Math.max(w/bg.naturalWidth,h/bg.naturalHeight),iw=bg.naturalWidth*sc,ih=bg.naturalHeight*sc,ox=(w-iw)/2,oy=(h-ih)/2;
  ctx.clearRect(0,0,w,h);ctx.drawImage(bg,ox,oy,iw,ih);
  // Anchor the new sprite to the center and baseline of the original painted crab.
  const sw=iw*(portrait?.45:.202),sh=sw*380/400,center=ox+iw*(portrait?.49:.483),base=oy+ih*(portrait?.405:.443);
  const sy=base-sh*367/380;
  ctx.drawImage(frames[frame],center-sw/2,sy,sw,sh);
  const title=document.getElementById('homeTitle');
  if(title){
   const desired=h*(portrait?.09:.045);
   title.style.top=Math.max(3,Math.min(desired,sy-title.offsetHeight-10))+'px';
  }
  layer.classList.add('ready');last=frame;lastBg=bg;lastW=w;lastH=h;lastScale=ratio;
 }
 requestAnimationFrame(draw);
}
requestAnimationFrame(draw);
})();