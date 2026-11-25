/* A Traveler in a Shell · independent reconstruction (2026)
   Plain JavaScript + Canvas 2D; no frameworks or network requests.
   World height is 941 units; module widths preserve the source aspect ratio.
*/
(()=>{'use strict';
const $=id=>document.getElementById(id), A='assets/', MW=1672, MH=941, GRAV=1650;
const CHAPTERS=[
 {key:'golden',name:'Golden Shores',title:'CHAPTER I',floor:626,unlock:'golden',palette:'#d39a56',descs:['Leaving Home','Open Sandy Beach','The Coral Gateway'],specimens:['Scallop','Cowrie','Cockle','Limpet','Moon Snail'],platforms:[[[780,940,515],[1110,1280,490]],[[320,540,552],[800,1010,505],[1220,1390,530]],[[430,620,520],[850,1050,485],[1330,1520,520]]]},
 {key:'coral',name:'Coral Gardens',title:'CHAPTER II',floor:675,unlock:'spring',palette:'#75b6a4',descs:['Shell Discovery','The Great Leap','Coral Bridge'],specimens:['Turret Shell','Cone Shell','Murex','Olive Shell','Abalone'],platforms:[[[275,575,555],[750,1000,480],[1140,1460,545]],[[185,420,560],[650,930,490],[1120,1420,515]],[[270,535,540],[680,880,495],[1080,1420,535]]]},
 {key:'crystal',name:'Crystal Caverns',title:'CHAPTER III',floor:543,unlock:'heavy',palette:'#a8a0d4',descs:['Crystal Threshold','Fractured Chamber','Crystal Cathedral'],specimens:['Ammonite','Fossil Gastropod','Fossil Bivalve','Nautilus','Mineral Shell'],platforms:[[[550,810,440],[1120,1420,385]],[[240,460,430],[950,1200,430]],[[350,620,450],[1000,1250,412]]]},
 {key:'stars',name:'Sea of Stars',title:'CHAPTER IV',floor:568,unlock:'float',palette:'#8baaca',descs:['Pearl Passage','Moonlit Tides','Homeward Light'],specimens:['Pearl Oyster','Paper Nautilus','Moon Abalone','Glass Shell','Starlight Shell'],platforms:[[[430,660,480],[950,1170,445]],[[440,610,590],[800,970,575],[1170,1330,585]],[[425,680,468],[960,1190,485]]]}];
const SHELLS={golden:{name:'Golden',icon:'🐚',ability:'Protection and hiding'},spring:{name:'Spring',icon:'♜',ability:'Double jump'},heavy:{name:'Granite',icon:'◉',ability:'Break fragile walls and withstand current'},float:{name:'Pearl',icon:'◌',ability:'Float on deep water'}};
const assets={}, canvas=$('stage'),cx=canvas.getContext('2d',{alpha:false}),controls={left:false,right:false,hide:false};
const state={mode:'home',chapter:0,x:135,y:0,vx:0,vy:0,ground:false,available:['golden'],shell:'golden',health:3,collections:{},broken:false,paused:false,hidden:false,last:0,anim:0,invincible:0,checkpoint:100,cam:0,messages:0,scale:1,originY:0,viewW:800,viewH:600,zoom:1,sound:true,pickups:[]};
let buttonPointers=new Map(),touchPointers=new Map(),audio=null;
function safeGet(){try{return JSON.parse(localStorage.getItem('travelerShellSave')||'null')}catch{return null}}
function save(){if(testModule)return;try{localStorage.setItem('travelerShellSave',JSON.stringify({chapter:state.chapter,x:state.x,layout:newGolden&&state.chapter===0?'golden-v2':'legacy',layoutWidths:newGolden&&state.chapter===0?[...newWidths]:null,health:state.health,available:state.available,shell:state.shell,collections:state.collections,broken:state.broken}))}catch{}}
function tone(freq=660){if(!state.sound)return;try{audio=audio||new(window.AudioContext||window.webkitAudioContext)();const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.setValueAtTime(freq,audio.currentTime);o.frequency.exponentialRampToValueAtTime(freq*1.25,audio.currentTime+.1);g.gain.setValueAtTime(.07,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.22);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+.24)}catch{}}
function assetURL(url){return (window.TRAVEL_ASSETS&&window.TRAVEL_ASSETS[url])||A+url}function img(url){const i=new Image();i.src=assetURL(url);return i}
for(const c of CHAPTERS)for(let m=0;m<3;m++)assets[`${c.key}-${m}`]=img(`${c.key}-${m+1}.jpg`);
for(const kind of Object.keys(SHELLS))for(let i=0;i<2;i++)assets[`crab-${kind}-${i}`]=img(`crab-${kind}-${i}.png`);
// Golden Shell watercolor animation. Keep the legacy sprite until all three sheets are loaded.
const GOLDEN_ANIMS={idle:img('crab-golden-idle.png'),walk:img('crab-golden-walk.png'),jump:img('crab-golden-jump.png')};
const GOLDEN_CELL_W=320,GOLDEN_CELL_H=280;
const goldenAnim={mode:'idle',elapsed:0,facing:1,lastTime:0,lastGround:false};
function imageReady(im){return !!(im&&im.complete&&im.naturalWidth>0&&im.naturalHeight>0)}
function goldenArtReady(){return Object.values(GOLDEN_ANIMS).every(im=>imageReady(im)&&im.naturalWidth===640&&im.naturalHeight===560)}
function resetGoldenAnimation(){Object.assign(goldenAnim,{mode:'idle',elapsed:0,facing:1,lastTime:state.anim,lastGround:false})}
function selectGoldenFrame(){
 const a=goldenAnim,dt=Math.max(0,Math.min(.05,state.anim-a.lastTime));a.lastTime=state.anim;
 if(!state.paused){if(state.vx>12)a.facing=1;else if(state.vx< -12)a.facing=-1;}
 const mode=controls.hide?'idle':!state.ground?'jump':Math.abs(state.vx)>36?'walk':'idle';
 if(mode!==a.mode){a.mode=mode;a.elapsed=0}else a.elapsed+=dt;
 let frame=0;
 if(mode==='idle')frame=controls.hide?0:Math.floor(a.elapsed*3)%4;
 else if(mode==='walk')frame=Math.floor(a.elapsed*9)%4;
 else frame=a.elapsed<.055&&state.vy<0?0:state.vy< -260?1:Math.abs(state.vy)<=260?2:3;
 return {mode,frame,facing:a.facing};
}

// Shell-only artwork derived from the existing sprites. No squash/stretch is applied.
const shellCache=new Map();
function shellPath(c,kind,painted){
 c.beginPath();
 if(painted){
  c.moveTo(5,10);c.lineTo(312,10);c.lineTo(312,176);
  c.bezierCurveTo(301,191,289,199,272,204);
  c.bezierCurveTo(250,214,218,218,188,223);
  c.bezierCurveTo(153,229,124,241,89,245);
  c.bezierCurveTo(47,250,4,235,5,205);c.closePath();
 }else{
  c.moveTo(30,0);c.lineTo(210,0);c.lineTo(207,109);
  c.bezierCurveTo(198,118,184,122,169,126);
  c.bezierCurveTo(152,132,137,143,120,151);
  c.bezierCurveTo(100,158,82,163,65,177);c.lineTo(30,180);c.closePath();
 }
}
function getShellOnly(kind,painted){
 const key=kind+(painted?'-watercolor':'-legacy'),cached=shellCache.get(key);if(cached)return cached;
 const im=painted?GOLDEN_ANIMS.idle:assets[`crab-${kind}-0`];if(!imageReady(im))return null;
 const w=painted?320:250,h=painted?280:190;
 const layer=document.createElement('canvas');layer.width=w;layer.height=h;const c=layer.getContext('2d');if(!c)return null;
 c.save();shellPath(c,kind,painted);c.clip();
 if(painted){
  c.drawImage(im,0,0,w,h,0,0,w,h);
  // Repaint the exposed aperture with a dark watercolor-toned interior.
  c.save();c.beginPath();c.moveTo(130,213);c.bezierCurveTo(155,177,184,166,217,160);c.bezierCurveTo(253,152,280,163,290,179);c.bezierCurveTo(279,201,239,214,195,223);c.bezierCurveTo(164,230,143,227,130,213);c.closePath();c.clip();
  const g=c.createLinearGradient(155,168,248,230);g.addColorStop(0,'#51354f');g.addColorStop(.55,'#79516d');g.addColorStop(1,'#ad7690');c.fillStyle=g;c.fillRect(115,145,188,91);
  c.globalAlpha=.18;c.drawImage(im,119,85,75,52,121,153,180,84);c.restore();
  // Cover the visible eyestalks using adjacent painted shell texture.
  for(const patch of [[194,130,25,44,164,118,25,44],[235,128,34,47,210,91,34,47]]){
   const [x,y,pw,ph,sx,sy,sw,sh]=patch;c.save();c.beginPath();c.ellipse(x+pw/2,y+ph/2,pw/2,ph/2,0,0,Math.PI*2);c.clip();c.drawImage(im,sx,sy,sw,sh,x,y,pw,ph);c.restore();
  }
 }else{
  c.drawImage(im,0,0,w,h);
  // Remove the visible eyes at the edge while preserving the shell silhouette.
  c.save();c.beginPath();c.moveTo(144,92);c.lineTo(199,82);c.lineTo(199,128);c.lineTo(144,129);c.closePath();c.clip();c.drawImage(im,105,76,39,48,144,83,55,49);c.restore();
 }
 c.restore();
 // Place the shell on the same physical ground line as the crab's feet.
 const result={layer,w,h,foot:painted?245:kind==='spring'?177:160};
 shellCache.set(key,result);return result;
}
function drawHiddenShell(kind){
 const painted=kind==='golden'&&goldenArtReady(),shell=getShellOnly(kind,painted);if(!shell)return false;
 const scale=152/shell.w, facing=kind==='golden'?goldenAnim.facing:(state.vx< -12?-1:1);
 cx.save();cx.translate(state.x,state.y);cx.scale(facing,1);cx.drawImage(shell.layer,-76,-shell.foot*scale,152,shell.h*scale);cx.restore();return true;
}

function drawGoldenSprite(){
 const pose=selectGoldenFrame(),im=GOLDEN_ANIMS[pose.mode];
 if(!goldenArtReady())return false;
 const w=152,h=w*GOLDEN_CELL_H/GOLDEN_CELL_W;
 cx.save();cx.translate(state.x,state.y);cx.scale(pose.facing,1);
 cx.drawImage(im,(pose.frame%2)*GOLDEN_CELL_W,Math.floor(pose.frame/2)*GOLDEN_CELL_H,GOLDEN_CELL_W,GOLDEN_CELL_H,-w/2,-h,w,h);
 cx.restore();return true;
}
assets.epilogue=img('epilogue.jpg');
// New artwork is activated only when both original JPEGs are available.
const NEW_W=1536*MH/938, K=MH/938;
const testModule=Number(new URLSearchParams(location.search).get('testModule'))||0;
let newGolden=false,newReady=false,terrainDebug=false,loadedCount=0;
const defaults=window.GOLDEN_TERRAIN;
let terrain=defaults;
try{const v=JSON.parse(localStorage.getItem('goldenTerrainV2')||'null');if(Array.isArray(v)&&v.length===defaults.length)terrain=v.map((m,i)=>({...defaults[i],ground:m.ground,platforms:m.platforms,walls:m.walls||defaults[i].walls,hazards:m.hazards||defaults[i].hazards}));}catch{}
const newWidths=defaults.map(m=>MH*m.width/m.height),newModule=defaults.map(()=>false);
function loadPainting(name){return new Promise(resolve=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>resolve(null);im.src=assetURL(name)})}
async function choosePainting(primary,fallback){return (await loadPainting(primary))||(fallback?await loadPainting(fallback):null)}
const newAssetsReady=Promise.all(defaults.map((m,i)=>choosePainting(m.file,i===1?'02-open-sandy-beach.jpeg':null))).then(images=>{
 images.forEach((im,i)=>{if(im&&im.naturalWidth>0&&im.naturalHeight>0){assets[`golden-new-${i}`]=im;newWidths[i]=MH*im.naturalWidth/im.naturalHeight;newModule[i]=true}});
 loadedCount=0;while(newModule[loadedCount])loadedCount++;
 goldenSurfaces=buildGoldenSurfaces();newReady=loadedCount>=2;return newReady;
});
async function waitForNewArt(){await Promise.race([newAssetsReady,new Promise(resolve=>setTimeout(resolve,45000))]);}
function moduleWidth(ch,m){return newGolden&&ch===0?newWidths[m]:MW}
function moduleStart(ch,m){let x=0;for(let i=0;i<m;i++)x+=moduleWidth(ch,i);return x}
function moduleCount(ch){return newGolden&&ch===0?loadedCount:3}
function chapterWidth(ch){return moduleStart(ch,moduleCount(ch))}
function moduleAt(ch,x){let m=0;while(m+1<moduleCount(ch)&&x>=moduleStart(ch,m+1))m++;return m}
function legacyX(ch,x){const m=Math.max(0,Math.min(2,Math.floor(x/MW)));return moduleStart(ch,m)+(x-m*MW)*moduleWidth(ch,m)/MW}
function nativeLine(m,points){const offset=newWidths.slice(0,m).reduce((a,b)=>a+b,0),d=defaults[m];return points.map(([x,y])=>[offset+x*newWidths[m]/d.width,y*MH/d.height])}
let goldenGround=[],goldenWalls=[],goldenHazards=[],goldenPlatforms=[];
function buildGoldenSurfaces(){
 goldenGround=[];goldenWalls=[];goldenHazards=[];const platforms=[];
 for(let m=0;m<loadedCount;m++){
  for(const line of terrain[m].ground)if(line.length>=2)goldenGround.push(nativeLine(m,line));
  for(const line of terrain[m].platforms)if(line.length>=2)platforms.push(nativeLine(m,line));
  for(const line of terrain[m].walls||[])if(line.length>=2)goldenWalls.push(nativeLine(m,line));
  for(const poly of terrain[m].hazards||[])if(poly.length>=3)goldenHazards.push(nativeLine(m,poly));
 }
 // Bridge only touching module boundaries, smoothing the last/first 55 world units.
 for(let m=1;m<loadedCount;m++){
  const seam=newWidths.slice(0,m).reduce((a,b)=>a+b,0);
  const left=goldenGround.find(l=>Math.abs(l[l.length-1][0]-seam)<.1&&l[0][0]<seam),right=goldenGround.find(l=>Math.abs(l[0][0]-seam)<.1&&l[l.length-1][0]>seam);
  if(left&&right){const a=left[left.length-1],b=right[0],p=left[left.length-2],q=right[1],d=Math.min(55,(a[0]-p[0])*.5,(q[0]-b[0])*.5);if(d>0){const ly=a[1]+(p[1]-a[1])*d/(a[0]-p[0]),ry=b[1]+(q[1]-b[1])*d/(q[0]-b[0]),mid=(ly+ry)/2;left[left.length-1]=[seam-d,ly];left.push([seam,mid]);right[0]=[seam,mid];right.splice(1,0,[seam+d,ry]);}}
 }
 goldenPlatforms=platforms;return [...goldenGround,...platforms];
}
let goldenSurfaces=buildGoldenSurfaces();
function lineY(points,x){if(x<points[0][0]||x>points[points.length-1][0])return null;
 for(let i=1;i<points.length;i++){const [a,y]=points[i-1],[b,z]=points[i];if(x<=b)return y+(z-y)*(x-a)/(b-a)}return null}
function floorAt(ch,x){if(!newGolden||ch!==0)return CHAPTERS[ch].floor;const ys=goldenGround.map(l=>lineY(l,x)).filter(y=>y!==null);return ys.length?Math.min(...ys):CHAPTERS[ch].floor}
function hasSupport(x){return goldenSurfaces.some(l=>lineY(l,x)!==null)}
function safeSpawn(m){const start=moduleStart(0,m);const lines=goldenGround.filter(l=>l[0][0]>=start-.1&&l[0][0]<start+moduleWidth(0,m));const l=lines[0];return l?Math.min(l[l.length-1][0]-2,l[0][0]+Math.min(105,(l[l.length-1][0]-l[0][0])/2)):start+105}
// Side collision: swept horizontal test against solid line segments.
const BODY_HALF=24,BODY_HEIGHT=64;
function blockWalls(prevX,prevY,nextX,nextY){
 const dx=nextX-prevX;if(Math.abs(dx)<.0001)return nextX;
 const sign=Math.sign(dx),oldEdge=prevX+sign*BODY_HALF;
 let target=nextX;
 for(const wall of goldenWalls)for(let i=1;i<wall.length;i++){
  const [ax,ay]=wall[i-1],[bx,by]=wall[i];
  const low=Math.min(ay,by),high=Math.max(ay,by);
  if(high-low<.001)continue;
  const top=Math.min(prevY,nextY)-BODY_HEIGHT+4,bottom=Math.max(prevY,nextY)-3;
  const lo=Math.max(low,top),hi=Math.min(high,bottom);if(hi<=lo)continue;
  const xAt=y=>ax+(bx-ax)*(y-ay)/(by-ay);
  const boundary=sign>0?Math.min(xAt(lo),xAt(hi)):Math.max(xAt(lo),xAt(hi));
  const nextEdge=target+sign*BODY_HALF;
  if(sign>0&&oldEdge<=boundary+.1&&nextEdge>boundary)target=Math.min(target,boundary-BODY_HALF-.01);
  else if(sign<0&&oldEdge>=boundary-.1&&nextEdge<boundary)target=Math.max(target,boundary+BODY_HALF+.01);
 }
 if(target!==nextX)state.vx=0;
 return target;
}
function inPolygon(x,y,p){let inside=false;for(let i=0,j=p.length-1;i<p.length;j=i++){
 const [a,b]=p[i],[c,d]=p[j];if((b>y)!==(d>y)&&x<(c-a)*(y-b)/(d-b)+a)inside=!inside;
 }return inside;}
function touchesWater(x,fromY,toY){
 if(toY<fromY)return false;
 const steps=Math.max(1,Math.ceil((toY-fromY)/8));
 for(let i=0;i<=steps;i++){const y=fromY+(toY-fromY)*i/steps;if(goldenHazards.some(p=>inPolygon(x,y,p)))return true;}
 return false;
}
function newLanding(prevX,prevY,wasGrounded){
 let result=null;
 for(const line of goldenSurfaces){const y=lineY(line,state.x),before=lineY(line,prevX);if(y===null)continue;
  const follow=wasGrounded&&before!==null&&Math.abs(prevY-before)<=5&&state.vy>=0;
  const crossed=state.vy>=0&&prevY<=(before??y)+4&&state.y>=y;
  if(follow||crossed){if(result===null||y<result)result=y}
 }return result;
}
window.addEventListener('keydown',e=>{if(e.code==='KeyG'&&!e.repeat&&state.mode==='game')terrainDebug=!terrainDebug;});
document.addEventListener('contextmenu',e=>e.preventDefault());document.addEventListener('selectstart',e=>e.preventDefault());function mode(name){state.mode=name;$('home').classList.toggle('visible',name==='home');$('game').classList.toggle('visible',name==='game');if(name==='game'){resize();requestAnimationFrame(resize)}else clearHeld()}
function initialCollection(ch){return CHAPTERS[ch].specimens.map((name,i)=>({x:ch*0+210+i*920+([0,90,200,0,60][i]),id:`${ch}-${i}`,name,got:!!state.collections[`${ch}-${i}`]}))}
function enterChapter(ch,resetPosition=true){state.chapter=ch;resetGoldenAnimation();const C=CHAPTERS[ch];if(resetPosition){state.x=120;state.y=floorAt(ch,state.x)-1;state.ground=false;state.vx=0;state.vy=0;state.health=3;state.broken=false}clearHeld();state.vx=0;state.vy=0;jumps=0;state.checkpoint=110;state.picks=initialCollection(ch);state.paused=false;state.invincible=0;updateHud();mode('game');note(C.descs[0]+' · Explore and discover.',2700);save()}
async function begin(){await waitForNewArt();if(state.mode!=='home')return;state.collections={};state.available=['golden'];state.shell='golden';enterChapter(0)}
async function resume(){const s=safeGet();if(!s){begin();return}await waitForNewArt();if(state.mode!=='home')return;Object.assign(state,{available:s.available||['golden'],shell:s.shell||'golden',collections:s.collections||{},broken:!!s.broken,health:s.health||3});enterChapter(Math.max(0,Math.min(3,s.chapter||0)),false);let x=s.x||100;if(state.chapter===0){if(s.layout==='golden-v2'){const old=s.layoutWidths||[NEW_W,NEW_W,MW];let m=0,offset=0;while(m+1<old.length&&x>=offset+old[m]){offset+=old[m];m++}m=Math.min(m,moduleCount(0)-1);x=moduleStart(0,m)+(x-offset)*moduleWidth(0,m)/(old[m]||MW)}else if(newGolden)x=legacyX(0,x);}state.x=Math.max(100,Math.min(chapterWidth(state.chapter)-120,x));if(newGolden&&!hasSupport(state.x))state.x=safeSpawn(moduleAt(0,state.x));state.y=floorAt(state.chapter,state.x)-1;state.ground=false;state.health=Math.max(1,state.health);makePickups();updateHud();save()}
function shellGlyph(kind){const glyphs={golden:'<path d="M12 20C7 20 3 16 3 11a9 9 0 0 1 18 0c0 5-4 9-9 9zM12 15a4 4 0 1 0-4-4c0 3 3 5 6 4"/>',spring:'<path d="M5 19h14L12 3 5 19zM8 12h8m-6-5h4m-7 9h10"/>',heavy:'<path d="M4 15 7 6l7-3 7 7-3 10H8zM7 6l7 7 4 7m-4-7 7-3M4 15l10-2"/>',float:'<ellipse cx="12" cy="12" rx="8" ry="10" transform="rotate(30 12 12)"/><path d="M8 14c-1-3 1-6 4-7"/>'};return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">'+glyphs[kind]+'</svg>'}
function updateHud(){const C=CHAPTERS[state.chapter];$('chapterIndex').textContent=C.title;$('chapterName').textContent=C.name;const n=C.specimens.filter((_,i)=>state.collections[`${state.chapter}-${i}`]).length;$('collectedCount').textContent=n;$('statusLeft').setAttribute('aria-label',state.health+' of 3 lives');$('hearts').innerHTML=Array.from({length:3},(_,i)=>'<i class="life-dot'+(i<state.health?' full':'')+'"></i>').join('');const slots=$('shellSlots');slots.innerHTML='';slots.hidden=state.available.length<=1;for(const kind of state.available){const b=document.createElement('button');b.className='shell-choice'+(state.shell===kind?' selected':'');b.dataset.kind=kind;b.setAttribute('aria-label',SHELLS[kind].name+' Shell');b.title=SHELLS[kind].ability;b.setAttribute('aria-pressed',String(state.shell===kind));b.innerHTML=shellGlyph(kind);b.addEventListener('click',()=>equip(kind));slots.append(b)}}
function equip(kind){if(!state.available.includes(kind))return;state.shell=kind;tone(510);updateHud();save();note(`${SHELLS[kind].name} Shell · ${SHELLS[kind].ability}`,1800)}
function note(txt,ms=2300){const el=$('message');el.textContent=txt;el.classList.add('show');clearTimeout(state.messages);state.messages=setTimeout(()=>el.classList.remove('show'),ms)}
function unlock(kind){if(state.available.includes(kind))return;state.available.push(kind);equip(kind);tone(830);note(`Discovered ${SHELLS[kind].name} Shell! ${SHELLS[kind].ability}`,4000);save()}
function clearHeld(){controls.left=controls.right=controls.hide=false;buttonPointers.clear();touchPointers.clear();document.querySelectorAll('.ctrl').forEach(b=>b.classList.remove('pressed'))}
function release(id){if(!buttonPointers.has(id))return;const a=buttonPointers.get(id);buttonPointers.delete(id);if(a==='left'||a==='right'||a==='hide')controls[a]=[...buttonPointers.values()].includes(a);const b=$(a);if(b&&!controls[a])b.classList.remove('pressed')}
function assign(id,a){buttonPointers.set(id,a);if(a==='jump')jump();else if(a==='hide')controls.hide=true;else controls[a]=true;const b=$(a);if(b)b.classList.add('pressed')}
for(const a of ['left','right','jump','hide']){const b=$(a);b.addEventListener('pointerdown',e=>{e.preventDefault();if(state.mode!=='game'||state.paused)return;try{b.setPointerCapture(e.pointerId)}catch{}assign(e.pointerId,a)});for(const ev of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,e=>{e.preventDefault();release(e.pointerId)});b.addEventListener('contextmenu',e=>e.preventDefault());b.addEventListener('dragstart',e=>e.preventDefault())}
document.addEventListener('pointerup',e=>release(e.pointerId));document.addEventListener('pointercancel',e=>release(e.pointerId));window.addEventListener('blur',clearHeld);document.addEventListener('visibilitychange',()=>{if(document.hidden)clearHeld()});
const KEYMAP={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',Space:'jump',ArrowUp:'jump',KeyW:'jump',KeyH:'hide',ShiftLeft:'hide'};
window.addEventListener('keydown',e=>{if(state.mode!=='game'||state.paused)return;const a=KEYMAP[e.code];if(!a)return;e.preventDefault();if(a==='jump'){if(!e.repeat)jump()}else controls[a]=true});window.addEventListener('keyup',e=>{const a=KEYMAP[e.code];if(a&&a!=='jump')controls[a]=false});
let jumps=0;
function jump(){if(state.mode!=='game'||state.paused||controls.hide)return;if(state.ground){state.vy=newGolden?-940:-730;state.ground=false;jumps=1;tone(520)}else if(state.shell==='spring'&&jumps<2){state.vy=-670;jumps=2;tone(700)}}
function groundSegments(ch){let seg=[];for(let m=0;m<3;m++){const left=m*MW,right=(m+1)*MW,C=CHAPTERS[ch];if(ch===3&&m===1){seg.push([left,left+370,C.floor],[left+1320,right,C.floor]);for(let [a,b,y] of C.platforms[m])seg.push([left+a,left+b,y])}else if(ch===0&&m===1){seg.push([left,left+585,C.floor],[left+760,right,C.floor]);seg.push([left+585,left+760,C.floor-72])}else{seg.push([left,right,C.floor])}for(let [a,b,y] of C.platforms[m]){if(ch===3&&m===1)continue;seg.push([left+a,left+b,y])}}return seg}
let segments=CHAPTERS.map((_,i)=>groundSegments(i));
function breakWall(){if(state.broken)return;state.broken=true;state.vx=135;tone(290);note('The granite shell fractures the ancient stone!',2500);save()}
function hurt(message){if(state.invincible>0){if(newGolden){state.x=state.checkpoint;state.y=floorAt(state.chapter,state.x)-3;state.vx=state.vy=0;state.ground=false;clearHeld()}return}state.health--;state.invincible=1.7;clearHeld();tone(240);if(newGolden)state.x=state.checkpoint;if(state.health<=0){state.health=3;state.x=state.checkpoint;note('The traveler retreats into its shell · Checkpoint',2000)}else note(message||'Careful! One heart lost.',1700);state.y=floorAt(state.chapter,state.x)-40;state.vy=0;state.vx=0;state.ground=false;jumps=0;updateHud();save()}
function finishChapter(){state.paused=true;clearHeld();const C=CHAPTERS[state.chapter];save();if(state.chapter===3){mode('home');showDialog('Homecoming','<p>The little traveler has crossed the golden shore, coral gardens, crystal caverns and sea of stars.</p><p>The most extraordinary shell may be the one that feels like home.</p>',[{text:'See the Homecoming',fn:()=>{mode('home');showEpilogue()}},{text:'Return to Main Menu',fn:()=>{closeDialog();mode('home')}}]);return}
const next=CHAPTERS[state.chapter+1];showDialog(`${C.name} · Complete`,`<p>You reached the end of this chapter.</p><p>Continue into <strong>${next.name}</strong>?</p>`,[{text:`Enter ${next.name}`,fn:()=>{closeDialog();enterChapter(state.chapter+1)}},{text:'Home',fn:()=>{closeDialog();mode('home')}}])}
function progress(dt){if(state.mode!=='game'||state.paused)return;const C=CHAPTERS[state.chapter],m=moduleAt(state.chapter,state.x);state.checkpoint=newGolden?safeSpawn(m):Math.max(110,moduleStart(state.chapter,m)+105);
 if(m===0&&state.x>moduleWidth(state.chapter,0)*.36)unlock(C.unlock);
 if(state.chapter===2&&m===1&&!state.broken){const wall=MW+855;if(state.x>wall-85&&state.x<wall+45){if(state.shell==='heavy'&&(controls.right||controls.hide)){breakWall()}else if(state.vx>0){state.x=wall-85;state.vx=0;if(performance.now()%1200<dt*1000)note('A fractured wall · Try the Granite Shell',1600)}}}
 const prevY=state.y,prevX=state.x,wasGrounded=state.ground;const wanted=(+!!controls.right)-(+!!controls.left);
 const maxspeed=controls.hide?0:state.shell==='heavy'?215:newGolden?415:350;
 if(wanted){const target=wanted*maxspeed;state.vx+=(target-state.vx)*Math.min(1,dt*(state.ground?12:8))}else state.vx*=Math.exp(-12*dt);
 state.x+=state.vx*dt;state.x=Math.max(66,Math.min(chapterWidth(state.chapter)+80,state.x));
 state.vy+=(state.shell==='float'&&!state.ground?GRAV*.34:GRAV)*dt;state.y+=state.vy*dt;if(newGolden)state.x=blockWalls(prevX,prevY,state.x,state.y);state.ground=false;
 const sh=segments[state.chapter];let landed=null;if(newGolden&&state.chapter===0){landed=newLanding(prevX,prevY,wasGrounded)}else for(const [x1,x2,y] of sh){if(state.x+31>x1&&state.x-31<x2&&prevY<=y+4&&state.y>=y&&state.vy>=0){if(landed===null||y<landed)landed=y}}
 if(landed!==null){state.y=landed;state.vy=0;state.ground=true;jumps=0}
 const water=state.chapter===3&&m===1&&state.x>MW+370&&state.x<MW+1320;
 if(water&&state.shell==='float'&&!state.ground&&state.y>590){state.y=590;state.vy=0;state.ground=true;jumps=0;state.vx*=.96}
 if(newGolden&&!state.ground&&touchesWater(state.x,prevY,state.y)){hurt('Tide pool · Try the jump again!');return}if(state.y>880){hurt(water?'Deep water · Use the Floating Shell!':'You fell into the tide pool.');return;}
 const nextModule=moduleAt(state.chapter,state.x);if(nextModule!==m)save();
 for(const item of state.picks||[]){if(!item.got&&Math.abs(item.x-state.x)<64&&Math.abs(item.y-state.y)<110){item.got=true;state.collections[item.id]=true;tone(880);note(`Encyclopedia specimen: ${item.name}`,2200);updateHud();save()}}
 if(state.x>=chapterWidth(state.chapter)-110){if(newGolden&&state.chapter===0&&(loadedCount<defaults.length||testModule)){state.x=chapterWidth(0)-110;state.vx=0;if(!state.waitingForModule){state.waitingForModule=true;note(testModule?'End of terrain test':'The journey continues soon · Module '+String(loadedCount+1).padStart(2,'0'),3000)}}else finishChapter()}else state.waitingForModule=false;
 state.invincible=Math.max(0,state.invincible-dt);state.anim+=dt;
}
function makePickups(){const C=CHAPTERS[state.chapter];state.picks=C.specimens.map((name,i)=>{const x=newGolden?Math.min(chapterWidth(0)-150,moduleStart(0,Math.min(loadedCount-1,[0,2,4,7,10][i]))+Math.min(350,moduleWidth(0,Math.min(loadedCount-1,[0,2,4,7,10][i]))*.3)):legacyX(state.chapter,350+i*890+(i%2)*170);return {x,y:floorAt(state.chapter,x)-35-(i===2?75:0),id:`${state.chapter}-${i}`,name,got:!!state.collections[`${state.chapter}-${i}`]}}).filter(item=>item.x<chapterWidth(state.chapter)-110)}
const oldEnter=enterChapter;enterChapter=function(ch,reset=true){newGolden=ch===0&&newReady;oldEnter(ch,reset);makePickups()};
function resize(){const r=canvas.getBoundingClientRect(),dpr=Math.min(3,devicePixelRatio||1);canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);cx.setTransform(dpr,0,0,dpr,0,0);state.viewW=Math.max(1,r.width);state.viewH=Math.max(1,r.height);state.zoom=newGolden?1:r.width<650&&r.height>r.width?1.045:1;state.scale=state.viewH/MH*state.zoom;state.originY=(state.viewH-MH*state.scale)/2}
window.addEventListener('resize',resize);resize();
function render(){if(state.mode!=='game'||!canvas.width||!canvas.height)return;const C=CHAPTERS[state.chapter],S=state.scale,W=state.viewW,H=state.viewH;
 cx.save();cx.clearRect(0,0,W,H);cx.fillStyle=C.palette;cx.fillRect(0,0,W,H);
 const camera=Math.max(0,Math.min(chapterWidth(state.chapter)-W/S,state.x-W/S*.40));state.cam=camera;
 for(let m=0;m<moduleCount(state.chapter);m++){const width=moduleWidth(state.chapter,m),ox=(moduleStart(state.chapter,m)-camera)*S;if(ox>W+2||ox+width*S<0)continue;const im=assets[newGolden&&newModule[m]?`golden-new-${m}`:`${C.key}-${m}`];if(im.complete&&im.naturalWidth)cx.drawImage(im,ox,state.originY,width*S,MH*S)}
 cx.save();cx.translate(-camera*S,state.originY);cx.scale(S,S);
 if(terrainDebug){cx.save();cx.lineWidth=3;const stroke=(lines,color,closed=false)=>{cx.strokeStyle=color;for(const l of lines){cx.beginPath();l.forEach(([x,y],i)=>i?cx.lineTo(x,y):cx.moveTo(x,y));if(closed){cx.closePath();cx.fillStyle='rgba(75,195,255,.20)';cx.fill()}cx.stroke()}};
 if(newGolden){stroke(goldenGround,'#72ffac');stroke(goldenPlatforms,'#ffd56a');stroke(goldenWalls,'#ff657b');stroke(goldenHazards,'#63cbff',true)}else stroke(segments[state.chapter].map(([a,b,y])=>[[a,y],[b,y]]),'#72ffac');cx.restore()}
 // Interactable cracked wall, separate from background.
 if(state.chapter===2&&!state.broken){const x=MW+845,y=CHAPTERS[2].floor;cx.fillStyle='#a28bb5cd';cx.strokeStyle='#e6c8de';cx.lineWidth=5;cx.beginPath();cx.moveTo(x-10,y);cx.lineTo(x-8,y-165);cx.lineTo(x+65,y-167);cx.lineTo(x+63,y);cx.closePath();cx.fill();cx.stroke();cx.strokeStyle='#583e72';cx.lineWidth=3;cx.beginPath();cx.moveTo(x+20,y-165);cx.lineTo(x+44,y-122);cx.lineTo(x+15,y-76);cx.lineTo(x+38,y-29);cx.stroke()}
 for(const item of state.picks||[]){if(item.got)continue;cx.font='55px serif';cx.textAlign='center';cx.shadowColor='#fff2b9';cx.shadowBlur=18;cx.fillText('🐚',item.x,item.y-14+Math.sin(state.anim*3+item.x)*5);cx.shadowBlur=0}
 const px=state.x,py=state.y,walk=Math.abs(state.vx)>36&&state.ground;const kind=state.shell,frame=walk?(Math.floor(state.anim*7)%2):0;
 if(!(controls.hide&&drawHiddenShell(kind))&&(kind!=='golden'||!drawGoldenSprite())){
  const im=assets[`crab-${kind}-${frame}`],base=assets[`crab-${kind}-0`],sprite=imageReady(im)?im:base;
  if(imageReady(sprite)){cx.save();cx.translate(px,py);if(state.vx< -12)cx.scale(-1,1);cx.drawImage(sprite,-76,-116,152,116);cx.restore()}
 }
 cx.restore();cx.restore()}
function loop(now){const dt=Math.min(.038,(now-state.last)/1000||.016);state.last=now;progress(dt);render();requestAnimationFrame(loop)}requestAnimationFrame(loop);
function showDialog(title,html,buttons){state.paused=true;clearHeld();$('dialogTitle').textContent=title;$('dialogBody').innerHTML=html;const box=$('dialogButtons');box.innerHTML='';for(const b of buttons){const btn=document.createElement('button');btn.textContent=b.text;btn.addEventListener('click',b.fn);box.append(btn)}$('overlay').classList.add('visible');$('overlay').setAttribute('aria-hidden','false')}
function closeDialog(){ $('overlay').classList.remove('visible');$('overlay').setAttribute('aria-hidden','true');state.paused=false;clearHeld()}
function pause(){showDialog('Traveler’s Journal','<p>Pause the journey, consult your shell encyclopedia, or return to the beach.</p>',[{text:'Resume',fn:closeDialog},{text:'Shell Encyclopedia',fn:encyclopedia},{text:'Settings',fn:settings},{text:'Terrain Editor',fn:()=>window.open('terrain.html','_blank')},{text:'Restart Chapter',fn:()=>{closeDialog();enterChapter(state.chapter)}},{text:'Main Menu',fn:()=>{closeDialog();mode('home')}}])}
function encyclopedia(){let html='<p class="progress">Collect specimens across the four chapters and discover their habitats.</p>';for(let c=0;c<4;c++){html+=`<h3>${CHAPTERS[c].name}</h3>`;CHAPTERS[c].specimens.forEach((s,i)=>{const got=state.collections[`${c}-${i}`];html+=`<div class="entry ${got?'':'locked'}"><span>${got?'🐚':'◇'} ${got?s:'Undiscovered shell'}</span><span>${got?'Collected':'?'}</span></div>`})}showDialog('Shell Encyclopedia',html,[{text:'Back',fn:()=>{closeDialog();if(state.mode==='game')pause()}}])}
function settings(){showDialog('Settings',`<p>Sound: <strong>${state.sound?'On':'Off'}</strong></p><p>Desktop: ← → or A/D to move, Space to jump, H to hide.<br>Mobile: hold arrows and tap Jump simultaneously.</p><p>Progress is saved automatically in this browser.</p>`,[{text:state.sound?'Mute Sound':'Enable Sound',fn:()=>{state.sound=!state.sound;settings()}},{text:'Back',fn:()=>{closeDialog();if(state.mode==='game')pause()}}])}
function showEpilogue(){showDialog('Homecoming',`<img src="${assetURL('epilogue.jpg')}" alt="Homecoming painting" style="max-width:100%;border-radius:12px"><p>The traveler returns with four different homes, and a world of memories.</p>`,[{text:'Return Home',fn:()=>{closeDialog();mode('home')}}])}
$('begin').addEventListener('click',begin);$('continue').addEventListener('click',resume);$('collection').addEventListener('click',encyclopedia);$('settingsHome').addEventListener('click',settings);$('pauseBtn').addEventListener('click',pause);$('soundHome').addEventListener('click',()=>{state.sound=!state.sound;$('muteMark').textContent=state.sound?'':'×';$('soundHome').setAttribute('aria-pressed',String(!state.sound))});
// Help testing without exposing implementation details in the interface.
if(testModule)newAssetsReady.then(()=>{if(newReady){enterChapter(0);const m=Math.max(0,Math.min(loadedCount-1,testModule-1));state.x=safeSpawn(m);state.y=floorAt(0,state.x)-1;state.ground=false;terrainDebug=true;note('Terrain test · Module '+String(m+1).padStart(2,'0'),2400)}});
window.travelerDebug={state,CHAPTERS,goToChapter:n=>enterChapter(Math.max(0,Math.min(3,n))),advanceToEnd:()=>{state.x=chapterWidth(state.chapter)-130;state.y=floorAt(state.chapter,state.x);},setTerrainDebug:value=>{terrainDebug=!!value},getTerrain:()=>newGolden?goldenSurfaces:segments[state.chapter],getObstacles:()=>({walls:goldenWalls,hazards:goldenHazards}),newArtReady:()=>newReady,goldenArtReady,save};
})();
