/* Registered animated painting: mobile tide, 24 crisp frames, no crossfade. */
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
  const im=new Image();im.alt='';im.draggable=false;im.className='home-tide-flow';im.decoding='async';
  im.onload=()=>{if(im.naturalWidth!==898||im.naturalHeight!==1751){started=false;return}layer.append(im);art.insertBefore(layer,document.getElementById('homeCrabLayer'));layer.classList.add('ready')};
  im.onerror=()=>{started=false};im.src='assets/home-tide-flow.webp?v=1';
 }
 prepare();if(portrait.addEventListener)portrait.addEventListener('change',prepare);else portrait.addListener(prepare);
})();
