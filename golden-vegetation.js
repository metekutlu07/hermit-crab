/* Golden Shores: one painterly frame-animation experiment in Hermit's Home.
   No pixel deformation, camera-relative wobble, or movement of the surrounding scenery. */
(function(){
'use strict';
const patch=new Image();
patch.src='assets/golden-plant-patch.png?v=1';
const P={x:1308,y:431,w:171,h:152},sourceW=1536,sourceH=938;
const reduced=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
const sequence=[0,1,0,2];
function draw(ctx,im,m,ox,oy,w,h,t,viewW){
 if(m!==0||!patch.complete||patch.naturalWidth!==P.w*3||patch.naturalHeight!==P.h)return;
 const x=ox+P.x/sourceW*w,y=oy+P.y/sourceH*h,pw=P.w/sourceW*w,ph=P.h/sourceH*h;
 if(x+pw<0||x>viewW)return;
 const u=reduced?0:Math.max(0,t)/1.8;
 const i=Math.floor(u)%sequence.length,f=u%1;
 const a=sequence[i],b=sequence[(i+1)%sequence.length];
 const p=Math.max(0,(f-.45)/.55),mix=p*p*(3-2*p);
 ctx.save();
 ctx.drawImage(patch,a*P.w,0,P.w,P.h,x,y,pw,ph);
 if(mix>0){ctx.globalAlpha*=mix;ctx.drawImage(patch,b*P.w,0,P.w,P.h,x,y,pw,ph)}
 ctx.restore();
}
window.GoldenVegetation={draw};
})();