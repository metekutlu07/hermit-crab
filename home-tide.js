/* Mobile homepage: original painting plus two registered tide variants. */
(function(){
 'use strict';
 const home=document.getElementById('home'),art=home?.querySelector('.home-art');
 if(!art||!home)return;
 const portrait=matchMedia('(orientation: portrait)'),reduce=matchMedia('(prefers-reduced-motion: reduce)');
 let started=false;
 function prepare(){
  if(started||!portrait.matches||reduce.matches)return;
  started=true;
  const layer=document.createElement('div');layer.className='home-tide';layer.setAttribute('aria-hidden','true');
  const frames=['assets/home-tide-retreat.webp','assets/home-tide-advance.webp'].map((url,i)=>{
   const im=new Image();im.alt='';im.draggable=false;im.className='home-tide-frame tide-'+i;im.decoding='async';im.src=url;layer.append(im);return im;
  });
  Promise.all(frames.map(im=>im.decode?im.decode():new Promise((ok,fail)=>{if(im.complete&&im.naturalWidth)ok();else{im.onload=ok;im.onerror=fail}}))).then(()=>{
   if(frames.some(im=>im.naturalWidth!==898||im.naturalHeight!==1751))return;
   art.insertBefore(layer,document.getElementById('homeCrabLayer'));layer.classList.add('ready');
  }).catch(()=>{started=false});
 }
 prepare();if(portrait.addEventListener)portrait.addEventListener('change',prepare);else portrait.addListener(prepare);
})();
