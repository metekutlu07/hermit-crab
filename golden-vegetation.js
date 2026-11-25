/* Living Golden Shores: local root-anchored deformation of the original painting.
 No replacement images, duplicated plants, or physics changes. */
(function(){
'use strict';
const regions=[
 [[.20,.355,.065,.225,3.3],[.87,.455,.10,.19,4.4]], // 01: purple stems, coastal grasses
 [[.285,.46,.108,.15,5.1],[.405,.50,.105,.14,3.8]], // 02: two leaf clusters
 [[.58,.285,.12,.17,4.2],[.70,.185,.13,.23,5.8]], // 03: hanging bellflowers and tall leaves
 [[.105,.29,.11,.23,4.3],[.44,.45,.105,.16,5.3]], // 04: bells and grasses
 [[.02,.32,.115,.27,4.5],[.77,.50,.09,.11,3.6]], // 05: tall left stems, small coastal foliage
 [[.005,.01,.145,.205,5.4],[.36,.49,.10,.15,4.0]], // 06: arch grasses, pool-side leaves
 [[.07,.42,.12,.22,4.2],[.81,.69,.12,.20,5.5]], // 07: bridge approach, foreground plants
 [[.04,.38,.11,.23,3.8],[.64,.55,.095,.18,4.8]], // 08: shore vegetation
 [[.405,.22,.12,.23,5.3],[.43,.60,.095,.13,3.8]], // 09: upper bulbs, lower leaves
 [[.18,.005,.26,.56,6.5],[.59,.41,.13,.23,4.9]], // 10: great algae cluster
 [[.04,.02,.20,.25,5.8],[.23,.36,.10,.27,4.1]] // 11: arch foliage
];
const reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
function draw(ctx,im,m,ox,oy,w,h,t,viewW){
 if(reduced||!im.naturalWidth||!regions[m])return;
 const iw=im.naturalWidth,ih=im.naturalHeight;
 for(let j=0;j<regions[m].length;j++){
  const [nx,ny,nw,nh,period]=regions[m][j],x=ox+nx*w,y=oy+ny*h,rw=nw*w,rh=nh*h;
  if(x+rw<0||x>viewW)continue;
  const sx=nx*iw,sy=ny*ih,sw=nw*iw,sh=nh*ih;
  const sway=Math.sin(t*Math.PI*2/period+m*1.83+j*2.14)*.035+Math.sin(t*Math.PI*2/(period*1.67)+j)*.010;
  const strips=24;
  // Repaint the same region with its left/right boundaries fixed.
  // The displacement fades to zero at the top, root and side boundaries.
  for(let k=0;k<strips;k++){
   const u=(k+.5)/strips,shift=rw*sway*Math.pow(1-u,1.3)*Math.min(1,u*6);
   const sourceY=sy+k*sh/strips,destY=y+k*rh/strips,sourceH=Math.min(sh/strips+.5,sy+sh-sourceY),destH=Math.min(rh/strips+.55,y+rh-destY);
   const pivot=.5,dl=rw*pivot+shift;
   ctx.drawImage(im,sx,sourceY,sw*pivot,sourceH,x,destY,dl,destH);
   ctx.drawImage(im,sx+sw*pivot,sourceY,sw*(1-pivot),sourceH,x+dl,destY,rw-dl,destH);
  }
 }
}
window.GoldenVegetation={draw};
})();