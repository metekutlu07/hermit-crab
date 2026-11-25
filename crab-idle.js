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
})();
