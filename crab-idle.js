/* Original painted crab pixels, exported to discrete PNG animation frames.
 * No runtime recoloring, shadows or procedural deformation.
 * The first pose and original game idle sprites are preserved.
 */
(function(){
'use strict';
const load=name=>{const im=new Image();im.src='assets/'+name;return im};
const ready=(im,w,h)=>!!im&&im.complete&&im.naturalWidth===w&&im.naturalHeight===h;
const canvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
function split(im,cols,rows,w,h){
 const result=[];for(let i=0;i<cols*rows;i++){const c=canvas(w,h);c.getContext('2d').drawImage(im,(i%cols)*w,Math.floor(i/cols)*h,w,h,0,0,w,h);result.push(c)}return result;
}
const looks=[[0,1.4],[1,.15],[2,.15],[3,.75],[4,.15],[5,.15],[6,1.5],[7,.15],[8,.15],[9,.75],[10,.15],[11,.15],[0,.35]];
const lookDuration=looks.reduce((s,p)=>s+p[1],0);
function lookFrame(t){
 if(reduced.matches)return 0;
 let p=((t%lookDuration)+lookDuration)%lookDuration;
 for(const [n,d] of looks){if(p<d)return n;p-=d}return 0;
}
const gameSheet=load('crab-golden-idle2.png');
let gameLookFrames=null,originalFrames=null,originalImage=null;
function gameFrame(im,t){
 // Before upload, keep the game's original four-frame breathing idle.
 if(!ready(gameSheet,1280,840)||!ready(im,640,560))return null;
 if(!gameLookFrames)gameLookFrames=split(gameSheet,4,3,320,280);
 if(im!==originalImage){originalFrames=split(im,2,2,320,280);originalImage=im}
 if(reduced.matches)return originalFrames[0];
 // Four full cycles of the original 3fps idle, then one eye-motion loop.
 const baseDuration=16/3,p=((t%(baseDuration+lookDuration))+(baseDuration+lookDuration))%(baseDuration+lookDuration);
 return p<baseDuration?originalFrames[Math.floor(p*3)%4]:gameLookFrames[lookFrame(p-baseDuration)];
}
window.CrabIdle={gameFrame};
const home=document.getElementById('home'),layer=document.getElementById('homeCrabLayer'),art=home?.querySelector('.home-art');
if(!home||!layer||!art)return;
const ctx=layer.getContext('2d'),portraitQuery=window.matchMedia('(orientation: portrait)');
const specs={
 portrait:{size:[788,1536],rect:[208,349,355,284],shellTop:365},
 landscape:{size:[1536,864],rect:[577,143,328,248],shellTop:153}
};
const store={};
function get(name){
 if(!store[name])store[name]={spec:specs[name],bg:load('home-'+name+'-original-clean.png'),sheet:load('crab-home-'+name+'-original.png'),frames:null};
 return store[name];
}
let last=-1,lastEntry=null,lastW=0,lastH=0,lastScale=0,start=null;
function draw(now){
 if(!home.classList.contains('visible')){start=null;requestAnimationFrame(draw);return}
 const portrait=portraitQuery.matches,entry=get(portrait?'portrait':'landscape'),sp=entry.spec;
 const [x,y,cw,ch]=sp.rect,[bw,bh]=sp.size,w=art.clientWidth,h=art.clientHeight;
 if(!w||!h||!ready(entry.bg,bw,bh)||!ready(entry.sheet,cw*4,ch*3)){
  layer.classList.remove('ready');last=-1;start=null;requestAnimationFrame(draw);return
 }
 if(!entry.frames)entry.frames=split(entry.sheet,4,3,cw,ch);
 if(start===null||entry!==lastEntry)start=now;
 const frame=lookFrame((now-start)/1000),ratio=Math.min(2,window.devicePixelRatio||1,2400/Math.max(w,h));
 if(frame!==last||entry!==lastEntry||w!==lastW||h!==lastH||ratio!==lastScale){
  const pw=Math.round(w*ratio),ph=Math.round(h*ratio);
  if(layer.width!==pw)layer.width=pw;if(layer.height!==ph)layer.height=ph;
  ctx.setTransform(ratio,0,0,ratio,0,0);
  const scale=Math.max(w/bw,h/bh),iw=bw*scale,ih=bh*scale,ox=(w-iw)/2,oy=(h-ih)/2;
  ctx.clearRect(0,0,w,h);
  ctx.drawImage(entry.bg,ox,oy,iw,ih);
  ctx.drawImage(entry.frames[frame],ox+x*scale,oy+y*scale,cw*scale,ch*scale);
  const title=document.getElementById('homeTitle');
  if(title)title.style.top=Math.max(3,Math.min(h*(portrait?.09:.045),oy+sp.shellTop*scale-title.offsetHeight-12))+'px';
  layer.classList.add('ready');last=frame;lastEntry=entry;lastW=w;lastH=h;lastScale=ratio;
 }
 requestAnimationFrame(draw);
}
requestAnimationFrame(draw);
})();