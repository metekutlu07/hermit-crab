/* Original homepage animation, unchanged pixels and original timing. */
(function(){
'use strict';
const home=document.getElementById('home'),art=home?.querySelector('.home-art'),photo=art?.querySelector('picture img'),layer=document.getElementById('homeCrabLayer');
if(!home||!art||!photo||!layer)return;
const ctx=layer.getContext('2d');if(!ctx)return;
const im=new Image();im.src='assets/crab-home-look.png';
const seq=[[0,1.8],[1,.25],[2,.75],[1,.25],[3,1.4],[4,.18],[3,.8],[5,.3],[6,.8],[7,.4],[0,1.3]];
const duration=seq.reduce((sum,p)=>sum+p[1],0),cw=400,ch=380;
layer.width=cw;layer.height=ch;
let start=null,last=-1,lastLayout='';
function layout(){
 const w=art.clientWidth,h=art.clientHeight,bw=photo.naturalWidth,bh=photo.naturalHeight;
 if(!w||!h||!bw||!bh)return false;
 const key=[w,h,bw,bh].join(':');if(key===lastLayout)return true;
 const portrait=bh>bw,sc=Math.max(w/bw,h/bh),iw=bw*sc,ih=bh*sc,ox=(w-iw)/2,oy=(h-ih)/2;
 const sw=iw*(portrait?.45:.202),sh=sw*ch/cw,center=ox+iw*(portrait?.49:.483),base=oy+ih*(portrait?.405:.443)+h*.055,sy=base-sh*367/ch;
 layer.style.left=(center-sw/2)+'px';layer.style.top=sy+'px';layer.style.width=sw+'px';layer.style.height=sh+'px';
 const title=document.getElementById('homeTitle');
 if(title)title.style.top=Math.max(3,Math.min(h*(portrait?.17:.11),sy-title.offsetHeight-10))+'px';
 lastLayout=key;return true;
}
function frameAt(t){let p=t%duration;for(const [n,d] of seq){if(p<d)return n;p-=d}return 0}
function draw(now){
 if(!home.classList.contains('visible')||!im.complete||im.naturalWidth!==1600||im.naturalHeight!==760||!photo.complete||!layout()){
  start=null;last=-1;layer.classList.remove('ready');requestAnimationFrame(draw);return
 }
 if(start===null)start=now;
 const n=frameAt((now-start)/1000);
 if(n!==last){ctx.clearRect(0,0,cw,ch);ctx.drawImage(im,(n%4)*cw,Math.floor(n/4)*ch,cw,ch,0,0,cw,ch);layer.classList.add('ready');last=n}
 requestAnimationFrame(draw);
}
photo.addEventListener('load',()=>{lastLayout='';layout()});window.addEventListener('resize',()=>{lastLayout='';layout()});
requestAnimationFrame(draw);
})();