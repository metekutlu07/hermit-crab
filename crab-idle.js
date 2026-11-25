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
 if(!frames)frames=split(homeSheet,4,2,400,380);
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