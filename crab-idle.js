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
// Homepage uses the two original artworks, not the regenerated purple crab.
// Extract a crab-sized patch of the original painting, including its sandy shadow.
// Build aligned eye-motion frames from original pixels, without redrawing the shell.
const home=document.getElementById('home'),layer=document.getElementById('homeCrabLayer'),art=home?.querySelector('.home-art'),photo=art?.querySelector('picture img');
if(!home||!layer||!art||!photo)return;
const ctx=layer.getContext('2d');
const specs={
 portrait:{size:[788,1536],rect:[208,349,355,284],eyes:[[435,463,26,34],[494,462,26,34]],amp:10,shellTop:365},
 landscape:{size:[1536,864],rect:[577,143,328,248],eyes:[[780,246,24,30],[836,244,24,30]],amp:9,shellTop:153}
};
let frames=null,rect=null,activeSrc='',last=-1,started=null,meta=null;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function build(photo,rect,eyes,amp){
 const [x,y,w,h]=rect,base=canvas(w,h),c=base.getContext('2d',{willReadFrequently:true});
 c.drawImage(photo,x,y,w,h,0,0,w,h);const original=c.getImageData(0,0,w,h);
 const out=[];
 for(let step=-6;step<=6;step++){
  if(step===0){out.push(base);continue}
  const dest=canvas(w,h),dc=dest.getContext('2d'),p=dc.createImageData(w,h);p.data.set(original.data);
  const amount=step/6;
  for(const [ax,ay,rx,ry] of eyes){
   const ex=ax-x,ey=ay-y;
   for(let j=Math.max(0,Math.floor(ey-ry));j<Math.min(h,Math.ceil(ey+ry));j++){
    for(let i=Math.max(0,Math.floor(ex-rx));i<Math.min(w,Math.ceil(ex+rx));i++){
     const r=((i-ex)/rx)**2+((j-ey)/ry)**2;if(r>=1)continue;
     const k=(1-r)*(1-r)*(1+2*r);
     const sx=clamp(i-amount*amp*k,0,w-1),sy=clamp(j+(Math.abs(amount)*1.4)*k,0,h-1);
     const ix=Math.floor(sx),iy=Math.floor(sy),fx=sx-ix,fy=sy-iy;
     const a=(iy*w+ix)*4,b=(iy*w+Math.min(w-1,ix+1))*4,d=(Math.min(h-1,iy+1)*w+ix)*4,e=(Math.min(h-1,iy+1)*w+Math.min(w-1,ix+1))*4,at=(j*w+i)*4;
     for(let channel=0;channel<4;channel++)p.data[at+channel]=Math.round((original.data[a+channel]*(1-fx)+original.data[b+channel]*fx)*(1-fy)+(original.data[d+channel]*(1-fx)+original.data[e+channel]*fx)*fy);
    }
   }
  }
  dc.putImageData(p,0,0);out.push(dest);
 }
 return out;
}
function layout(){
 if(!rect||!meta)return;
 const w=art.clientWidth,h=art.clientHeight;if(!w||!h)return;
 const scale=Math.max(w/photo.naturalWidth,h/photo.naturalHeight),ox=(w-photo.naturalWidth*scale)/2,oy=(h-photo.naturalHeight*scale)/2;
 layer.style.left=(ox+rect[0]*scale)+'px';layer.style.top=(oy+rect[1]*scale)+'px';layer.style.width=rect[2]*scale+'px';layer.style.height=rect[3]*scale+'px';
 const title=document.getElementById('homeTitle');
 if(title){const portrait=meta===specs.portrait;const top=oy+meta.shellTop*photo.naturalHeight/meta.size[1]*scale;title.style.top=Math.max(3,Math.min(h*(portrait?.09:.045),top-title.offsetHeight-12))+'px'}
}
function prepare(){
 if(!photo.complete||!photo.naturalWidth)return;
 const source=photo.currentSrc||photo.src;if(source===activeSrc&&frames)return;
 layer.classList.remove('ready');activeSrc=source;
 meta=photo.naturalHeight>photo.naturalWidth?specs.portrait:specs.landscape;
 const sx=photo.naturalWidth/meta.size[0],sy=photo.naturalHeight/meta.size[1];
 rect=meta.rect.map((v,i)=>Math.round(v*(i%2?sy:sx)));
 const eyes=meta.eyes.map(e=>[e[0]*sx,e[1]*sy,e[2]*sx,e[3]*sy]);
 try{
  frames=build(photo,rect,eyes,meta.amp*sx);layer.width=rect[2];layer.height=rect[3];
  ctx.drawImage(frames[6],0,0);last=6;started=null;layout();
  layer.classList.add('ready');
 }catch(err){frames=null;layer.classList.remove('ready')}
}
const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t)};
function gaze(t){
 const p=t%8.4;
 if(p<1.7)return 0;
 if(p<2.2)return -smooth((p-1.7)/.5);
 if(p<3.05)return -1;
 if(p<3.55)return -(1-smooth((p-3.05)/.5));
 if(p<4.85)return 0;
 if(p<5.35)return smooth((p-4.85)/.5);
 if(p<6.1)return 1;
 if(p<6.6)return 1-smooth((p-6.1)/.5);
 return 0;
}
photo.addEventListener('load',()=>{activeSrc='';prepare()});
window.addEventListener('resize',()=>{prepare();layout()});
if(typeof ResizeObserver!=='undefined')new ResizeObserver(layout).observe(art);
let checkAt=0;
function animate(now){
 if(now-checkAt>350){checkAt=now;prepare();layout()}
 if(frames&&home.classList.contains('visible')){
  if(started===null)started=now;
  const n=reduced.matches?6:Math.round(gaze((now-started)/1000)*6)+6;
  if(n!==last){ctx.clearRect(0,0,layer.width,layer.height);ctx.drawImage(frames[n],0,0);last=n}
 }else started=null;
 requestAnimationFrame(animate);
}
prepare();requestAnimationFrame(animate);
})();