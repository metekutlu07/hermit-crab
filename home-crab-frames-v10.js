/* V10: independently illustrated PNG poses, no runtime pixel deformation.
 The original painting is the only full-size background; the first frame is its exact crop. */
(function(){
'use strict';
const home=document.getElementById('home'),art=home?.querySelector('.home-art'),photo=art?.querySelector('picture img'),layer=document.getElementById('homeCrabLayer');
if(!home||!photo||!layer)return;
const ctx=layer.getContext('2d');if(!ctx)return;
const specs={portrait:{w:788,h:1536,x:208,y:349,cw:355,ch:284,shellTop:365},landscape:{w:1536,h:864,x:577,y:143,cw:328,ch:248,shellTop:153}};
const params=new URLSearchParams(location.search),reduce=window.matchMedia('(prefers-reduced-motion: reduce)'),force=params.get('motion')==='on';
const seq=[[0,1.3],[1,.17],[2,.17],[3,.65],[4,.17],[1,.17],[0,1.3],[5,.18],[6,.65],[7,.18],[5,.18],[0,.5]];
const duration=seq.reduce((t,p)=>t+p[1],0);
let debug=null;if(params.get('homeDebug')==='1'){debug=document.createElement('div');debug.id='homeCrabDebug';home.append(debug)}
const status=window.homeCrabStatus={version:'illustrated-v10',orientation:null,asset:null,loaded:false,frame:0,reason:'loading'};
function update(reason,n){status.reason=reason;status.frame=n;if(debug)debug.textContent=JSON.stringify(status,null,1)}
const store={};
function get(name){
 if(store[name])return store[name];
 const im=new Image(),entry={im,sp:specs[name],failed:false};store[name]=entry;
 im.onload=()=>{entry.failed=false};im.onerror=()=>{entry.failed=true};
 im.src='assets/crab-home-'+name+'-frames.png';return entry;
}
const orientation=()=>photo.naturalWidth&&photo.naturalHeight?(photo.naturalHeight>photo.naturalWidth?'portrait':'landscape'):(window.matchMedia('(orientation:portrait)').matches?'portrait':'landscape');
get(orientation()); // Begin the current orientation's download before the entry gate opens.
let prev=null,start=null,last=-1,lastLayout='',checkAt=0;
function frameAt(t){let p=t%duration;for(const [n,d] of seq){if(p<d)return n;p-=d}return 0}
function layout(sp){
 const w=art.clientWidth,h=art.clientHeight;if(!w||!h)return false;
 const scale=Math.max(w/sp.w,h/sp.h),ox=(w-sp.w*scale)/2,oy=(h-sp.h*scale)/2;
 const key=[w,h,sp.w].join(':');
 if(key!==lastLayout){
  layer.style.left=(ox+sp.x*scale)+'px';layer.style.top=(oy+sp.y*scale)+'px';
  layer.style.width=sp.cw*scale+'px';layer.style.height=sp.ch*scale+'px';
  const title=document.getElementById('homeTitle');
  if(title){const top=oy+sp.shellTop*scale;title.style.top=Math.max(3,Math.min(h*(sp.h>sp.w?.09:.045),top-title.offsetHeight-12))+'px'}
  lastLayout=key;
 }
 return true;
}
function tick(now){
 const name=orientation(),entry=get(name),sp=entry.sp,im=entry.im;
 status.orientation=name;status.asset=im.src;
 if(entry!==prev){prev=entry;last=-1;start=null;lastLayout='';layer.classList.remove('ready')}
 const active=home.classList.contains('visible')&&(document.getElementById('entryGate')?.hidden!==false);
 const loaded=im.complete&&im.naturalWidth>0&&im.naturalWidth%4===0&&im.naturalHeight%2===0;
 status.loaded=loaded;
 if(!active||!loaded||!photo.complete||!layout(sp)){
  layer.classList.remove('ready');last=-1;start=null;update(entry.failed?'asset missing or failed to load':!active?'waiting for entry':!loaded?'loading sprite':'waiting for picture',0);
  requestAnimationFrame(tick);return;
 }
 if(start===null)start=now;
 const n=reduce.matches&&!force?0:frameAt((now-start)/1000);
 if(n!==last){
  if(n===0){layer.classList.remove('ready')}else{
   if(layer.width!==sp.cw)layer.width=sp.cw;if(layer.height!==sp.ch)layer.height=sp.ch;
   const cw=im.naturalWidth/4,ch=im.naturalHeight/2;
   ctx.clearRect(0,0,sp.cw,sp.ch);ctx.drawImage(im,(n%4)*cw,Math.floor(n/4)*ch,cw,ch,0,0,sp.cw,sp.ch);
   layer.classList.add('ready');
  }
  last=n;update(reduce.matches&&!force?'reduced motion: neutral pose':'playing illustrated frames',n);
 }
 requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
})();