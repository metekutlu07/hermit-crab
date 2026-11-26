/* Mobile homepage: six independently painted tide frames, crisp stop-motion. */
(function(){
 'use strict';
 const home=document.getElementById('home'),art=home?.querySelector('.home-art'),crab=document.getElementById('homeCrabLayer');
 if(!home||!art||!crab)return;
 const portrait=matchMedia('(orientation: portrait)'),reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const names=['frame_01_original','frame_02','frame_03','frame_04','frame_05','frame_06'];
 const extensions=['jpg','jpeg','png','webp','JPG','JPEG','PNG','WEBP'];
 const frameMs=1200;
 let loading=false,frames=null,layer=null,start=null,last=-1;
 async function loadFrame(name){
  for(const ext of extensions){
   try{
    const im=new Image();im.alt='';im.draggable=false;im.className='home-tide-flow';im.decoding='async';
    await new Promise((ok,fail)=>{im.onload=ok;im.onerror=fail;im.src='assets/'+name+'.'+ext;});
    if(!im.naturalWidth||!im.naturalHeight)continue;
    if(im.decode)try{await im.decode()}catch{}
    return im;
   }catch{}
  }
  throw Error('Missing tide frame: '+name);
 }
 async function prepare(){
  if(loading||frames||!portrait.matches||reduce.matches)return;
  loading=true;
  try{
   const loaded=await Promise.all(names.map(loadFrame));
   // Show nothing until all six frames are available, keeping the original photo as fallback.
   layer=document.createElement('div');layer.className='home-tide';layer.setAttribute('aria-hidden','true');
   loaded.forEach((im,i)=>{im.style.visibility=i===0?'visible':'hidden';layer.append(im)});
   art.insertBefore(layer,crab);frames=loaded;layer.classList.add('ready');last=0;
   requestAnimationFrame(draw);
  }catch(e){console.warn('Tide sequence unavailable; keeping original homepage.',e)}
  finally{loading=false}
 }
 function draw(now){
  if(!portrait.matches||reduce.matches||document.hidden||!home.classList.contains('visible')){
   start=null;requestAnimationFrame(draw);return;
  }
  if(start===null)start=now;
  const index=Math.floor((now-start)/frameMs)%frames.length;
  if(index!==last){
   frames[index].style.visibility='visible';
   if(last>=0)frames[last].style.visibility='hidden';
   last=index;
  }
  requestAnimationFrame(draw);
 }
 prepare();if(portrait.addEventListener)portrait.addEventListener('change',prepare);else portrait.addListener(prepare);
})();
