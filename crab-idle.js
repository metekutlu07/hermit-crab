/* Delicate eye-stalk motion sampled from the original watercolor pixels.
 * The character and sand outside the small eye regions are not redrawn.
 */
(function(){
'use strict';
const canvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
const moves=[0,-.45,-1,-.45,0,.45,1,.45,0];
function pose(t,home){
 const dur=home?7.8:8.6,shift=((t%dur)+dur)%dur;
 // Long pauses between curious glances; each motion uses three intermediate steps.
 if(shift<1.6)return 0;
 if(shift<2.65)return [1,2,2,1,0][Math.min(4,Math.floor((shift-1.6)/.21))];
 if(shift<4.5)return 0;
 if(shift<5.55)return [5,6,6,5,0][Math.min(4,Math.floor((shift-4.5)/.21))];
 return 0;
}
function makeFrames(im,rect,eyes,amplitude){
 const [x,y,w,h]=rect,base=canvas(w,h),ctx=base.getContext('2d',{willReadFrequently:true});
 ctx.drawImage(im,x,y,w,h,0,0,w,h);
 const src=ctx.getImageData(0,0,w,h),out=[base];
 for(let i=1;i<moves.length;i++){
  if(moves[i]===0){out.push(base);continue}
  const c=canvas(w,h),g=c.getContext('2d'),pixels=g.createImageData(w,h);pixels.data.set(src.data);
  // Compact deformation fields with a fixed boundary. The feet, shell and face stay still.
  for(const eye of eyes){
   const [ex0,ey0,rx,ry]=eye,ex=ex0-x,ey=ey0-y;
   for(let yy=Math.max(0,Math.floor(ey-ry));yy<Math.min(h,Math.ceil(ey+ry));yy++){
    for(let xx=Math.max(0,Math.floor(ex-rx));xx<Math.min(w,Math.ceil(ex+rx));xx++){
     const d=((xx-ex)/rx)**2+((yy-ey)/ry)**2;if(d>=1)continue;
     const weight=(1-d)**2;
     const sx=clamp(xx-moves[i]*amplitude*weight,0,w-1),sy=clamp(yy+Math.abs(moves[i])*1.4*weight,0,h-1);
     const ix=Math.floor(sx),iy=Math.floor(sy),fx=sx-ix,fy=sy-iy;
     const a=(iy*w+ix)*4,b=(iy*w+Math.min(ix+1,w-1))*4,cc=(Math.min(iy+1,h-1)*w+ix)*4,dd=(Math.min(iy+1,h-1)*w+Math.min(ix+1,w-1))*4,k=(yy*w+xx)*4;
     for(let j=0;j<4;j++)pixels.data[k+j]=Math.round((src.data[a+j]*(1-fx)+src.data[b+j]*fx)*(1-fy)+(src.data[cc+j]*(1-fx)+src.data[dd+j]*fx)*fy);
    }
   }
  }
  g.putImageData(pixels,0,0);out.push(c);
 }
 return out;
}
let gameFrames=null,failedGame=false;
function gameFrame(im,t){
 if(reduce.matches||failedGame)return null;
 if(!gameFrames){try{gameFrames=makeFrames(im,[0,0,320,280],[[205,143,18,25],[257,139,18,25]],8)}catch(e){failedGame=true;return null}}
 return gameFrames[pose(t,false)];
}
window.CrabIdle={gameFrame};
const layer=document.getElementById('homeCrabLayer'),home=document.getElementById('home'),art=home?.querySelector('.home-art'),img=art?.querySelector('picture img');
if(!layer||!img)return;
const view=layer.getContext('2d');let frames=null,rect=null,src='',last=-1,start=null,lastCheck=0;
function prepare(){
 if(!img.complete||!img.naturalWidth||img.currentSrc===src)return;
 const portrait=img.naturalHeight>img.naturalWidth;
 // Native pixel coordinates from the two original homepage paintings.
 const data=portrait?{size:[788,1536],rect:[207,350,360,287],eyes:[[435,463,23,32],[494,462,23,32]],amp:10}:{size:[1536,864],rect:[575,143,335,250],eyes:[[780,247,22,30],[836,245,22,30]],amp:9};
 const sx=img.naturalWidth/data.size[0],sy=img.naturalHeight/data.size[1];
 rect=data.rect.map((v,i)=>Math.round(v*(i%2?sx===sy?sx:sy:sx)));
 const eyes=data.eyes.map(e=>[e[0]*sx,e[1]*sy,e[2]*sx,e[3]*sy]);
 try{
  frames=makeFrames(img,rect,eyes,data.amp*sx);src=img.currentSrc;layer.width=rect[2];layer.height=rect[3];last=-1;start=null;layout();layer.classList.add('ready');
 }catch(e){frames=null;layer.classList.remove('ready')}
}
function layout(){
 if(!rect||!frames)return;
 const w=art.clientWidth,h=art.clientHeight;if(!w||!h)return;
 const scale=Math.max(w/img.naturalWidth,h/img.naturalHeight);
 const ox=(w-img.naturalWidth*scale)/2,oy=(h-img.naturalHeight*scale)/2;
 layer.style.left=(ox+rect[0]*scale)+'px';layer.style.top=(oy+rect[1]*scale)+'px';layer.style.width=(rect[2]*scale)+'px';layer.style.height=(rect[3]*scale)+'px';
 // Keep title above the shell even in a short in-app browser viewport.
 const title=document.getElementById('homeTitle');if(title&&img.naturalHeight>img.naturalWidth){
  const shellTop=oy+365*img.naturalHeight/1536*scale;
  const ideal=Math.min(h*.09,shellTop-title.offsetHeight-12);
  title.style.top=Math.max(5,ideal)+'px';
 }else if(title)title.style.removeProperty('top');
}
img.addEventListener('load',()=>{layer.classList.remove('ready');src='';prepare()});
window.addEventListener('resize',()=>{prepare();layout()});
if(typeof ResizeObserver!=='undefined')new ResizeObserver(layout).observe(art);
function animate(now){
 if(now-lastCheck>250){lastCheck=now;prepare();layout()}
 if(frames&&home.classList.contains('visible')){
  if(start===null)start=now;
  const p=reduce.matches?0:pose((now-start)/1000,true);
  if(p!==last){view.clearRect(0,0,layer.width,layer.height);view.drawImage(frames[p],0,0);last=p}
 }else start=null;
 requestAnimationFrame(animate);
}
prepare();requestAnimationFrame(animate);
})();