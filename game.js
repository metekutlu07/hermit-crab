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
const ZH={
 'Begin Exploration':'开始探索','A bird is approaching. Hold HIDE!':'飞鸟正在靠近，按住躲藏键！','Safe inside your shell.':'壳中很安全。','Your shell is your refuge. Hold HIDE next time.':'贝壳是你的庇护所。下次记得按住躲藏键。','The bird caught you outside your shell.':'你没有及时躲进壳里，被飞鸟发现了。',
 'About':'关于',
 'A Traveler':'小小旅人','in a Shell':'壳中的旅程','Begin Journey':'开始旅程','Shell Collection':'贝壳收藏','Continue Journey':'继续旅程','Settings':'设置',
 'Golden Shores':'金色海岸','Coral Gardens':'珊瑚花园','Crystal Caverns':'水晶洞穴','Sea of Stars':'星之海',
 'CHAPTER I':'第一章','CHAPTER II':'第二章','CHAPTER III':'第三章','CHAPTER IV':'第四章',
 'MENU':'菜单','Lives:':'生命：','Shells:':'贝壳：','HIDE':'躲藏','JUMP':'跳跃',
 'Traveler’s Journal':'旅人日志','Resume':'继续','Shell Encyclopedia':'贝壳图鉴','Terrain Editor':'地形编辑器','Restart Chapter':'重新开始本章','Main Menu':'主菜单','Back':'返回','Mute Sound':'关闭声音','Enable Sound':'开启声音','Homecoming':'归家','Return Home':'返回首页','Return to Main Menu':'返回主菜单','See the Homecoming':'查看归家故事','Next Chapter':'下一章',
 'Pause the journey, consult your shell encyclopedia, or return to the beach.':'暂停旅程，查看贝壳图鉴，或返回海滩。','Collect specimens across the four chapters and discover their habitats.':'收集四个章节中的贝壳标本，探索它们的栖息地。','Undiscovered shell':'尚未发现的贝壳','Collected':'已收集','Sound:':'声音：','Progress is saved automatically in this browser.':'游戏进度会自动保存在此浏览器。','Desktop: ← → to move, ↑ to jump, ↓ to hide.':'电脑：← → 移动，↑ 跳跃，↓ 躲藏。','Mobile: hold arrows and tap Jump simultaneously.':'手机：按住方向键，同时点击跳跃。',
 'Leaving Home':'离开家园','Explore and discover.':'探索与发现。','Tide pool · Try the jump again!':'潮池 · 再试一次跳跃！','You fell into the tide pool.':'你掉进了潮池。','Careful! One heart lost.':'小心！失去一点生命。','The traveler retreats into its shell · Checkpoint':'旅人退回壳中 · 返回检查点',
 'Scallop':'扇贝','Cowrie':'宝螺','Cockle':'鸟蛤','Limpet':'帽贝','Moon Snail':'月螺','Turret Shell':'塔螺','Cone Shell':'芋螺','Murex':'骨螺','Olive Shell':'榧螺','Abalone':'鲍鱼','Ammonite':'菊石','Fossil Gastropod':'腹足类化石','Fossil Bivalve':'双壳类化石','Nautilus':'鹦鹉螺','Mineral Shell':'矿物贝壳','Pearl Oyster':'珍珠贝','Paper Nautilus':'船蛸','Moon Abalone':'月鲍','Glass Shell':'玻璃贝壳','Starlight Shell':'星光贝壳',
 'Encyclopedia specimen:':'图鉴标本：','End of terrain test':'地形测试结束'
};
let gameLanguage='en';
const tr=v=>gameLanguage==='zh'?(ZH[v]||v):v;
function translatedText(v){if(gameLanguage!=='zh')return v;if(ZH[v])return ZH[v];return Object.keys(ZH).sort((a,b)=>b.length-a.length).reduce((t,k)=>t.split(k).join(ZH[k]),v)}
function updateHomeLanguage(){
 document.documentElement.lang=gameLanguage==='zh'?'zh-CN':'en';
 const title=$('homeTitle');if(title){const a=title.querySelectorAll('span');a[0].textContent=tr('A Traveler');a[1].textContent=tr('in a Shell')}
 for(const [id,label] of [['begin','Begin Journey'],['collection','Shell Collection'],['continue','Continue Journey'],['settingsHome','Settings'],['aboutHome','About'],['pauseBtn','MENU'],['livesLabel','Lives:'],['shellsLabel','Shells:']]){const el=$(id);if(el)el.textContent=tr(label)}
 for(const [id,label] of [['hide','HIDE'],['jump','JUMP']]){const el=$(id);if(el)el.querySelector('span').textContent=tr(label)}
}

let buttonPointers=new Map(),touchPointers=new Map(),heldKeys=new Map(),audio=null;
let goldenSoundscape=null;
function soundPreference(){try{return localStorage.getItem('travelerSoundEnabled')!=='0'}catch{return true}}
function syncSoundButtons(){
 const zh=gameLanguage==='zh',retry=state.sound&&(!audio||audio.state!=='running');
 const label=zh?(retry?'声音：重试':state.sound?'声音：开启':'声音：关闭'):(retry?'Sound: Retry':state.sound?'Sound: On':'Sound: Off');
 for(const id of ['soundHome','soundGame']){const el=$(id);if(el){el.textContent=label;el.setAttribute('aria-pressed',String(state.sound&&!retry));el.setAttribute('aria-label',label)}}
}
function primeAudio(){
 if(!state.sound){syncSoundButtons();return}
 try{
  if(!audio||audio.state==='closed'){
   const AC=window.AudioContext||window.webkitAudioContext;if(!AC)throw Error('Web Audio unavailable');
   audio=new AC();goldenSoundscape=null;
   audio.onstatechange=()=>{syncSoundButtons();updateAtmosphere()};
  }
  // Resume synchronously from a real button gesture (including Safari).
  const pending=audio.resume();
  if(audio.state!=='running'){try{const unlock=audio.createBufferSource();unlock.buffer=audio.createBuffer(1,128,audio.sampleRate);unlock.connect(audio.destination);unlock.start(0);unlock.onended=()=>unlock.disconnect()}catch{}}
  pending?.then(()=>{syncSoundButtons();updateAtmosphere()}).catch(()=>syncSoundButtons());
  if(audio.state==='running')updateAtmosphere();
 }catch(err){console.warn('Audio could not start',err)}
 syncSoundButtons();
}
function setSound(enabled){
 state.sound=enabled;
 try{localStorage.setItem('travelerSoundEnabled',enabled?'1':'0')}catch{}
 if(enabled)primeAudio();
 syncSoundButtons();updateAtmosphere();
}
function toggleSound(){if(state.sound&&(!audio||audio.state!=='running'))setSound(true);else setSound(!state.sound)}
function updateAtmosphere(){
 try{
  if(!audio||!window.GoldenSoundscape)return;
  const active=state.sound&&!document.hidden&&(!state.paused||state.chapterIntro)&&(state.mode==='home'||(state.mode==='game'&&state.chapter===0));
  const gate=$('entryGate');const permitted=!gate||gate.hidden||gate.classList.contains('gate-depart');
  if(active&&permitted&&!goldenSoundscape&&audio.state==='running')goldenSoundscape=new window.GoldenSoundscape(audio);
  goldenSoundscape?.update(active&&permitted&&audio.state==='running');
 }catch(err){if(!window.__soundError){window.__soundError=String(err);console.warn('Soundscape error',err)}}
}
function safeGet(){try{return JSON.parse(localStorage.getItem('travelerShellSave')||'null')}catch{return null}}
function save(){if(testModule)return;try{localStorage.setItem('travelerShellSave',JSON.stringify({chapter:state.chapter,x:state.x,layout:newGolden&&state.chapter===0?'golden-v2':'legacy',layoutWidths:newGolden&&state.chapter===0?[...newWidths]:null,health:state.health,available:state.available,shell:state.shell,collections:state.collections,broken:state.broken}))}catch{}}
// A quiet, unpitched take-off gesture: a little breath and sand/shell texture.
let jumpAudioCache=null,jumpAudioIndex=0;
function jumpSound(){
 if(!state.sound||!audio||audio.state!=='running')return;
 try{
  const c=audio;
  if(!jumpAudioCache||jumpAudioCache.ctx!==c){
   const buffers=[];
   for(let k=0;k<3;k++){
    const duration=.22+k*.018,len=Math.ceil(c.sampleRate*duration),buf=c.createBuffer(1,len,c.sampleRate),d=buf.getChannelData(0);
    let seed=3317+k*163,low=0,slow=0;
    for(let i=0;i<len;i++){
     seed=(Math.imul(seed,1664525)+1013904223)>>>0;const white=seed/4294967296*2-1;
     low+=.19*(white-low);slow+=.035*(low-slow);
     const t=i/c.sampleRate,u=t/duration;
     const breath=Math.sin(Math.PI*u)**2*(1-u*.45);
     const grains=Math.exp(-t*37)*(1-Math.exp(-t*260));
     d[i]=(low-slow)*breath*.85+low*grains*.20;
    }
    buffers.push(buf);
   }
   jumpAudioCache={ctx:c,buffers};
  }
  const source=c.createBufferSource(),filter=c.createBiquadFilter(),gain=c.createGain();
  source.buffer=jumpAudioCache.buffers[jumpAudioIndex++%3];
  filter.type='lowpass';filter.frequency.value=1650;filter.Q.value=.45;
  gain.gain.value=.18;source.connect(filter);filter.connect(gain);gain.connect(c.destination);
  source.start();source.onended=()=>{try{source.disconnect();filter.disconnect();gain.disconnect()}catch{}};
 }catch{}
}
function tone(freq=660){if(!state.sound)return;try{audio=audio||new(window.AudioContext||window.webkitAudioContext)();const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.setValueAtTime(freq,audio.currentTime);o.frequency.exponentialRampToValueAtTime(freq*1.25,audio.currentTime+.1);g.gain.setValueAtTime(.07,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.22);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+.24)}catch{}}
function assetURL(url){return (window.TRAVEL_ASSETS&&window.TRAVEL_ASSETS[url])||A+url}function img(url){const i=new Image();i.src=assetURL(url);return i}
for(const c of CHAPTERS)for(let m=0;m<3;m++)assets[`${c.key}-${m}`]=img(`${c.key}-${m+1}.jpg`);
for(const kind of Object.keys(SHELLS))for(let i=0;i<2;i++)assets[`crab-${kind}-${i}`]=img(`crab-${kind}-${i}.png`);
// Golden Shell watercolor animation. Keep the legacy sprite until all three sheets are loaded.
const GOLDEN_ANIMS={idle:img('crab-golden-idle.png'),walk:img('crab-golden-walk.png'),jump:img('crab-golden-jump.png')};
const GOLDEN_CELL_W=320,GOLDEN_CELL_H=280;
const GOLDEN_HIDDEN=img('crab-golden-hidden.png');
const specimenFiles=['scallop','cowrie','cockle','limpet','moon-snail'].map(n=>'specimen-'+n+'.png');
const specimenArt=specimenFiles.map(f=>img(f));
const painterlySpecimenArt=specimenFiles.map(f=>img(f.replace('.png','-painted.png')));
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
 if(kind==='golden'&&imageReady(GOLDEN_HIDDEN)){
  const w=130,h=w*GOLDEN_HIDDEN.naturalHeight/GOLDEN_HIDDEN.naturalWidth;
  cx.save();cx.translate(state.x,state.y);cx.scale(goldenAnim.facing,1);cx.drawImage(GOLDEN_HIDDEN,-w/2,-h,w,h);cx.restore();return true;
 }
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
try{const v=JSON.parse(localStorage.getItem('goldenTerrainV6')||'null');if(Array.isArray(v)&&v.length===defaults.length)terrain=v.map((m,i)=>({...defaults[i],ground:m.ground,platforms:m.platforms,walls:m.walls||defaults[i].walls,hazards:m.hazards||defaults[i].hazards}));}catch{}
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
function floorAt(ch,x){if(!newGolden||ch!==0)return CHAPTERS[ch].floor;const ys=goldenGround.map(l=>lineY(l,x)).filter(y=>y!==null);if(ys.length)return Math.min(...ys);const platforms=goldenPlatforms.map(l=>lineY(l,x)).filter(y=>y!==null);return platforms.length?Math.min(...platforms):CHAPTERS[ch].floor}
function hasSupport(x){return goldenSurfaces.some(l=>lineY(l,x)!==null)}
function safeSpawn(m){const start=moduleStart(0,m),end=start+moduleWidth(0,m),within=l=>l[0][0]>=start-.1&&l[0][0]<end;const ground=goldenGround.filter(within);const candidates=ground.length?ground:goldenPlatforms.filter(within).sort((a,b)=>a[0][0]-b[0][0]);const l=candidates[0];return l?Math.min(l[l.length-1][0]-2,l[0][0]+Math.min(105,(l[l.length-1][0]-l[0][0])/2)):start+105}
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
  // Cross a touching seam or a small step without snapping onto a high background ledge.
  const seam=wasGrounded&&before===null&&state.vy>=0&&Math.abs(y-prevY)<=Math.min(16,4+Math.abs(state.x-prevX)*1.5);
  const crossed=state.vy>=0&&prevY<=(before??y)+4&&state.y>=y;
  if(follow||seam||crossed){if(result===null||y<result)result=y}
 }return result;
}
window.addEventListener('keydown',e=>{if(e.code==='KeyG'&&!e.repeat&&state.mode==='game')terrainDebug=!terrainDebug;});
document.addEventListener('contextmenu',e=>e.preventDefault());document.addEventListener('selectstart',e=>e.preventDefault());function mode(name){state.mode=name;if(name==='home')state.paused=false;$('home').classList.toggle('visible',name==='home');$('game').classList.toggle('visible',name==='game');if(name==='game'){resize();requestAnimationFrame(resize)}else clearHeld()}
function initialCollection(ch){return CHAPTERS[ch].specimens.map((name,i)=>({x:ch*0+210+i*920+([0,90,200,0,60][i]),id:`${ch}-${i}`,name,got:!!state.collections[`${ch}-${i}`]}))}
function enterChapter(ch,resetPosition=true){state.chapter=ch;resetGoldenAnimation();const C=CHAPTERS[ch];if(resetPosition){state.x=120;state.y=floorAt(ch,state.x)-1;state.ground=false;state.vx=0;state.vy=0;state.health=3;state.broken=false}clearHeld();state.vx=0;state.vy=0;jumps=0;state.checkpoint=110;state.picks=initialCollection(ch);state.paused=false;state.invincible=0;updateHud();mode('game');note(C.descs[0]+' · Explore and discover.',2700);save()}
async function begin(){primeAudio();if(state.mode!=='home'||goldenIntroBusy)return; if(testModule){await waitForNewArt();state.collections={};state.available=['golden'];state.shell='golden';enterChapter(0);return}showGoldenIntro(async()=>{await waitForNewArt();state.collections={};state.available=['golden'];state.shell='golden';enterChapter(0)})}
async function resume(){primeAudio();const s=safeGet();if(!s){begin();return}await waitForNewArt();if(state.mode!=='home')return;Object.assign(state,{available:s.available||['golden'],shell:s.shell||'golden',collections:s.collections||{},broken:!!s.broken,health:s.health||3});enterChapter(Math.max(0,Math.min(3,s.chapter||0)),false);let x=s.x||100;if(state.chapter===0){if(s.layout==='golden-v2'){const old=s.layoutWidths||[NEW_W,NEW_W,MW];let m=0,offset=0;while(m+1<old.length&&x>=offset+old[m]){offset+=old[m];m++}m=Math.min(m,moduleCount(0)-1);x=moduleStart(0,m)+(x-offset)*moduleWidth(0,m)/(old[m]||MW)}else if(newGolden)x=legacyX(0,x);}state.x=Math.max(100,Math.min(chapterWidth(state.chapter)-120,x));if(newGolden&&!hasSupport(state.x))state.x=safeSpawn(moduleAt(0,state.x));state.y=floorAt(state.chapter,state.x)-1;state.ground=false;state.health=Math.max(1,state.health);makePickups();updateHud();save()}
function shellGlyph(kind){const glyphs={golden:'<path d="M12 20C7 20 3 16 3 11a9 9 0 0 1 18 0c0 5-4 9-9 9zM12 15a4 4 0 1 0-4-4c0 3 3 5 6 4"/>',spring:'<path d="M5 19h14L12 3 5 19zM8 12h8m-6-5h4m-7 9h10"/>',heavy:'<path d="M4 15 7 6l7-3 7 7-3 10H8zM7 6l7 7 4 7m-4-7 7-3M4 15l10-2"/>',float:'<ellipse cx="12" cy="12" rx="8" ry="10" transform="rotate(30 12 12)"/><path d="M8 14c-1-3 1-6 4-7"/>'};return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">'+glyphs[kind]+'</svg>'}
function updateHud(){const C=CHAPTERS[state.chapter];$('chapterIndex').textContent=tr(C.title);$('chapterName').textContent=tr(C.name);const n=C.specimens.filter((_,i)=>state.collections[`${state.chapter}-${i}`]).length;$('collectedCount').textContent=n;$('statusLeft').setAttribute('aria-label',state.health+' of 3 lives');$('hearts').textContent=state.health;const slots=$('shellSlots');slots.innerHTML='';slots.hidden=state.available.length<=1;for(const kind of state.available){const b=document.createElement('button');b.className='shell-choice'+(state.shell===kind?' selected':'');b.dataset.kind=kind;b.setAttribute('aria-label',SHELLS[kind].name+' Shell');b.title=SHELLS[kind].ability;b.setAttribute('aria-pressed',String(state.shell===kind));b.innerHTML=shellGlyph(kind);b.addEventListener('click',()=>equip(kind));slots.append(b)}}
function equip(kind){if(!state.available.includes(kind))return;state.shell=kind;tone(510);updateHud();save();note(`${SHELLS[kind].name} Shell · ${SHELLS[kind].ability}`,1800)}
function collectionMessage(name){
 if(gameLanguage==='zh')return '已收集：'+translatedText(name);
 const common=['Scallop','Cowrie','Cockle','Limpet','Moon Snail','Murex','Abalone','Nautilus','Paper Nautilus','Moon Abalone'];
 const noun=name.toLowerCase()+(common.includes(name)?' shell':'');
 return (/^[aeiou]/i.test(noun)?'An ':'A ')+noun+' collected.';
}
function note(txt,ms=2300){const el=$('message');el.textContent=translatedText(txt);el.classList.add('show');clearTimeout(state.messages);state.messages=setTimeout(()=>el.classList.remove('show'),ms)}
function unlock(kind){if(state.available.includes(kind))return;state.available.push(kind);equip(kind);tone(830);note(`Discovered ${SHELLS[kind].name} Shell! ${SHELLS[kind].ability}`,4000);save()}
function syncHeld(){
 const actions=[...buttonPointers.values(),...heldKeys.values()];
 for(const a of ['left','right','hide'])controls[a]=actions.includes(a);
 for(const a of ['left','right','hide','jump']){const b=$(a);if(b)b.classList.toggle('pressed',actions.includes(a))}
}
function clearHeld(){
 const captures=[...buttonPointers.entries()];buttonPointers.clear();touchPointers.clear();heldKeys.clear();syncHeld();
 for(const [id,a] of captures){if(typeof id==='number'){const b=$(a);try{if(b.hasPointerCapture(id))b.releasePointerCapture(id)}catch{}}}
}
function release(id){if(buttonPointers.delete(id))syncHeld()}
function assign(id,a){if(buttonPointers.get(id)===a)return;buttonPointers.set(id,a);syncHeld();if(a==='jump')jump()}
function inControl(a,x,y){const b=$(a),r=b.getBoundingClientRect();return x>=r.left-18&&x<=r.right+18&&y>=r.top-18&&y<=r.bottom+18}
function reconcileTouches(e){if(!e.touches)return;const active=new Set(Array.from(e.touches,t=>t.identifier));for(const id of touchPointers.keys())if(!active.has(id)){touchPointers.delete(id);release('t:'+id)}}
function finishTouches(e){for(const t of Array.from(e.changedTouches||[])){if(touchPointers.has(t.identifier)){touchPointers.delete(t.identifier);release('t:'+t.identifier)}}reconcileTouches(e)}
const playable=()=>state.mode==='game'&&!state.paused;
for(const a of ['left','right','jump','hide']){
 const b=$(a);
 // Native touch handling on iOS, independent of pointer capture.
 b.addEventListener('touchstart',e=>{
  e.preventDefault();reconcileTouches(e);if(!playable())return;
  for(const t of Array.from(e.changedTouches)){if(!inControl(a,t.clientX,t.clientY))continue;touchPointers.set(t.identifier,a);assign('t:'+t.identifier,a)}
  // Restore other still-held controls from the full touch list before the next frame.
  for(const t of Array.from(e.touches||[])){const b=t.target?.closest?.('#controls .ctrl'),action=b?.id;if(action&&['left','right','hide'].includes(action)&&inControl(action,t.clientX,t.clientY)){touchPointers.set(t.identifier,action);assign('t:'+t.identifier,action)}}
 },{passive:false});
 b.addEventListener('pointerdown',e=>{
  if(e.pointerType==='touch')return;e.preventDefault();if(!playable()||e.button!==0)return;
  release(e.pointerId);try{b.setPointerCapture(e.pointerId)}catch{}assign(e.pointerId,a);
 });
 for(const ev of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,e=>release(e.pointerId));
 for(const ev of ['contextmenu','dragstart','selectstart'])b.addEventListener(ev,e=>e.preventDefault());
}
document.addEventListener('touchstart',reconcileTouches,{capture:true,passive:true});
document.addEventListener('touchmove',e=>{
 let managed=false;reconcileTouches(e);
 for(const t of Array.from(e.changedTouches||[])){
  const a=touchPointers.get(t.identifier);if(!a)continue;managed=true;
  if(!inControl(a,t.clientX,t.clientY)){touchPointers.delete(t.identifier);release('t:'+t.identifier)}
 }
 if(managed&&e.cancelable)e.preventDefault();
},{capture:true,passive:false});
for(const ev of ['touchend','touchcancel'])document.addEventListener(ev,finishTouches,{capture:true,passive:true});
document.addEventListener('pointermove',e=>{const a=buttonPointers.get(e.pointerId);if(a&&(!e.buttons||!inControl(a,e.clientX,e.clientY)))release(e.pointerId)},{capture:true});
for(const ev of ['pointerup','pointercancel'])document.addEventListener(ev,e=>release(e.pointerId),{capture:true});
window.addEventListener('blur',clearHeld);window.addEventListener('pagehide',clearHeld);
document.addEventListener('visibilitychange',()=>{if(document.hidden)clearHeld()});
for(const ev of ['gesturestart','gesturechange','gestureend'])document.addEventListener(ev,e=>{if(playable()&&e.cancelable)e.preventDefault()},{passive:false});
const KEYMAP={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',Space:'jump',ArrowUp:'jump',KeyW:'jump',ArrowDown:'hide',KeyH:'hide',ShiftLeft:'hide'};
window.addEventListener('keydown',e=>{if(!playable())return;const a=KEYMAP[e.code];if(!a)return;e.preventDefault();if(a==='jump'){if(!e.repeat){heldKeys.set(e.code,a);syncHeld();jump()}}else{heldKeys.set(e.code,a);syncHeld()}});
window.addEventListener('keyup',e=>{if(heldKeys.delete(e.code))syncHeld()});
let jumps=0;
function jump(){if(state.mode!=='game'||state.paused||controls.hide)return;const direction=(+!!controls.right)-(+!!controls.left);if(state.ground){if(direction)state.vx=direction*(state.shell==='heavy'?215:newGolden?415:350);state.vy=newGolden?-940:-730;state.ground=false;jumps=1;jumpSound()}else if(state.shell==='spring'&&jumps<2){state.vy=-670;jumps=2;jumpSound()}}
function groundSegments(ch){let seg=[];for(let m=0;m<3;m++){const left=m*MW,right=(m+1)*MW,C=CHAPTERS[ch];if(ch===3&&m===1){seg.push([left,left+370,C.floor],[left+1320,right,C.floor]);for(let [a,b,y] of C.platforms[m])seg.push([left+a,left+b,y])}else if(ch===0&&m===1){seg.push([left,left+585,C.floor],[left+760,right,C.floor]);seg.push([left+585,left+760,C.floor-72])}else{seg.push([left,right,C.floor])}for(let [a,b,y] of C.platforms[m]){if(ch===3&&m===1)continue;seg.push([left+a,left+b,y])}}return seg}
let segments=CHAPTERS.map((_,i)=>groundSegments(i));
function breakWall(){if(state.broken)return;state.broken=true;state.vx=135;tone(290);note('The granite shell fractures the ancient stone!',2500);save()}
function hurt(message){if(state.invincible>0){if(newGolden){state.x=state.checkpoint;state.y=floorAt(state.chapter,state.x)-3;state.vx=state.vy=0;state.ground=false;clearHeld()}return}state.health--;state.invincible=1.7;clearHeld();tone(240);if(newGolden)state.x=state.checkpoint;if(state.health<=0){state.health=3;state.x=state.checkpoint;note('The traveler retreats into its shell · Checkpoint',2000)}else note(message||'Careful! One heart lost.',1700);state.y=floorAt(state.chapter,state.x)-40;state.vy=0;state.vx=0;state.ground=false;jumps=0;updateHud();save()}
function showGoldenCompletion(preview=false){
 const zh=gameLanguage==='zh',names=CHAPTERS[0].specimens;
 const found=names.map((_,i)=>preview||!!state.collections['0-'+i]);
 const count=found.filter(Boolean).length;
 const number=['no','one','two','three','four','five'][count];
 const title=zh?'恭喜！':'Congratulations!';
 const intro=zh?'你已探索了岛屿的金色海岸。':'You have explored the Golden Shores of the island.';
 const summary=zh?'你已收集了 '+count+' 种不同的贝壳。':count===1?'You have collected one shell.':'You have collected '+number+' different shells.';
 const next=()=>{closeDialog();if(preview){mode('home');return}enterChapter(1)};
 const home=()=>{closeDialog();mode('home')};
 showDialog(title,'',[{text:zh?'前往珊瑚花园':'Continue to Coral Gardens',fn:next},{text:zh?'返回主菜单':'Main Menu',fn:home}]);
 const overlay=$('overlay');overlay.classList.add('chapter-complete');
 const body=$('dialogBody');body.innerHTML='';
 function el(tag,cls,txt,parent){const node=document.createElement(tag);if(cls)node.className=cls;if(txt!==undefined)node.textContent=txt;parent.append(node);return node}
 el('p','completion-kicker',zh?'第一章 · 金色海岸':'CHAPTER I · GOLDEN SHORES',body);
 el('p','completion-intro',intro,body);
 el('p','completion-summary',summary,body);
 const list=el('ol','completion-shells',undefined,body);
 names.forEach((name,i)=>{
  const row=el('li','completion-shell'+(found[i]?'':' uncollected'),undefined,list);
  const art=el('div','completion-art',undefined,row);
  if(found[i]){
   const image=document.createElement('img');
   image.alt='';image.draggable=false;image.src=imageReady(painterlySpecimenArt[i])?painterlySpecimenArt[i].src:assetURL(specimenFiles[i].replace('.png','-painted.png'));
   image.onerror=()=>{image.onerror=null;image.src=assetURL(specimenFiles[i])};art.append(image);
  }else el('span','completion-missing','?',art);
  const label=el('div','completion-label',undefined,row);
  el('span','completion-name',found[i]?(zh?tr(name):name):(zh?'尚未发现':'Undiscovered shell'),label);
  if(!found[i])el('small','completion-status',zh?'未收集':'Not collected',label);
 });
 // Put the chapter identifier before the heading; preserve the standard dialog semantics.
 const kicker=body.querySelector('.completion-kicker');$('dialogTitle').before(kicker);
 $('dialogTitle').focus?.();
}
function finishChapter(){state.paused=true;clearHeld();const C=CHAPTERS[state.chapter];save();if(state.chapter===0){showGoldenCompletion();return}if(state.chapter===3){mode('home');showDialog('Homecoming','<p>The little traveler has crossed the golden shore, coral gardens, crystal caverns and sea of stars.</p><p>The most extraordinary shell may be the one that feels like home.</p>',[{text:'See the Homecoming',fn:()=>{mode('home');showEpilogue()}},{text:'Return to Main Menu',fn:()=>{closeDialog();mode('home')}}]);return}
const next=CHAPTERS[state.chapter+1];showDialog(`${C.name} · Complete`,`<p>You reached the end of this chapter.</p><p>Continue into <strong>${next.name}</strong>?</p>`,[{text:`Enter ${next.name}`,fn:()=>{closeDialog();enterChapter(state.chapter+1)}},{text:'Home',fn:()=>{closeDialog();mode('home')}}])}
const birdArt=img('golden-shores-bird.png');
let birdEvent=null,birdDone=new Set();
let goldenIntroBusy=false;
const introNames=[null,'wake01.jpeg','wake02.jpeg','wake03.jpeg','wake04.jpeg','intro-bird.jpeg'];
const introShellNames=specimenFiles.map(f=>f.replace('.png','-painted.png'));
const introCache=new Map();
function loadIntroArt(name){
 if(introCache.has(name))return introCache.get(name);
 const promise=new Promise((resolve,reject)=>{
  const im=new Image();im.alt='';im.draggable=false;im.decoding='async';im.fetchPriority=name==='intro-loading.jpeg'?'high':'auto';
  im.onload=async()=>{try{if(im.decode)await im.decode()}catch{}resolve(im)};
  im.onerror=()=>reject(new Error(name));im.src=assetURL(name);
 });
 introCache.set(name,promise);promise.catch(()=>{if(introCache.get(name)===promise)introCache.delete(name)});
 return promise;
}
// Warm the small loading illustration before the player presses Begin Journey.
introShellNames.forEach(name=>loadIntroArt(name).catch(()=>{}));

function showGoldenIntro(onStart){
 if(goldenIntroBusy)return;
 goldenIntroBusy=true;state.chapterIntro=true;state.paused=true;clearHeld();$('message').classList.remove('show');
 const zh=gameLanguage==='zh', overlay=$('overlay'),body=$('dialogBody'),buttons=$('dialogButtons'),heading=$('dialogTitle');
 overlay.classList.remove('chapter-intro','chapter-complete');overlay.querySelector('.completion-kicker')?.remove();
 overlay.classList.add('story-intro','visible');overlay.setAttribute('aria-hidden','false');
 const images=[];
 const jobs=introNames.map((name,i)=>name?loadIntroArt(name).then(im=>{images[i]=im;return im}):Promise.resolve(null));
 jobs.forEach(job=>job.catch(()=>{}));
 const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let active=true;
 function button(label,action){buttons.innerHTML='';const el=document.createElement('button');el.textContent=label;el.onclick=action;buttons.append(el);return el}
 function scene(type,im,words){
  overlay.dataset.story=type;heading.textContent=type==='loading'?(zh?'金色海岸':'Golden Shores'):'';
  body.innerHTML='';buttons.innerHTML='';
  const art=document.createElement('div');art.className='story-painting';art.append(im);body.append(art);
  const caption=document.createElement('div');caption.className='story-caption';body.append(caption);
  if(type==='loading'){const chapter=document.createElement('small');chapter.className='story-chapter';chapter.textContent=zh?'第一章':'CHAPTER I';caption.append(chapter)}
  const p=document.createElement('p');p.textContent=words;caption.append(p);
  return art;
 }
 async function start(){
  if(!active)return;active=false;buttons.querySelector('button')?.setAttribute('disabled','');primeAudio();
  try{if(onStart)await onStart()}finally{goldenIntroBusy=false;overlay.classList.remove('story-intro');delete overlay.dataset.story;closeDialog()}
 }
 const fadeMs=reduced?0:650;
 const holdMs=reduced?0:1000;
 async function fadeOut(){
  const dialog=overlay.querySelector('.dialog');
  dialog.classList.add('story-fade-out');
  await delay(fadeMs);
 }
 function revealScene(){
  const dialog=overlay.querySelector('.dialog');
  dialog.classList.remove('story-fade-out');
  // Force the transition to start from the hidden state after changing the painting.
  dialog.getBoundingClientRect();
  dialog.classList.remove('story-ui-hidden');
 }
 async function bird(){
  if(!active||overlay.dataset.story!=='wake')return;
  const next=buttons.querySelector('button');if(next.disabled)return;next.disabled=true;
  const dialog=overlay.querySelector('.dialog'),art=body.querySelector('.story-painting');
  dialog.classList.add('story-ui-hidden');
  const incoming=images[5];incoming.classList.add('story-crossfade');art.append(incoming);
  incoming.getBoundingClientRect();incoming.classList.add('story-crossfade-visible');
  await delay(fadeMs);
  if(!active)return;
  incoming.classList.remove('story-crossfade','story-crossfade-visible');
  scene('bird',incoming,zh?'飞鸟靠近时，躲进你的壳中，直到危险远去。':'When birds approach, retreat into your shell until danger passes.');
  const startButton=button(zh?'开始':'Start',start);startButton.disabled=true;
  dialog.getBoundingClientRect();dialog.classList.remove('story-ui-hidden');
  await delay(fadeMs);startButton.disabled=false;
 }
 async function awaken(){
  await fadeOut();
  if(!active)return;
  const dialog=overlay.querySelector('.dialog');
  dialog.classList.add('story-ui-hidden');
  const art=scene('wake',images[1],zh?'夕阳沉入海面，小小旅人苏醒了。是时候沿着海岸漫游，寻找一个新家了。':'As the sun sinks into the ocean, a little traveler awakens. It is time for the hermit crab to wander along the shore in search of a new home.');
  const next=button(zh?'下一页':'Next',bird);next.disabled=true;
  dialog.getBoundingClientRect();dialog.classList.remove('story-fade-out');
  await delay(fadeMs+holdMs);
  if(!reduced){for(const [i,ms] of [[2,800],[3,800],[4,400]]){if(overlay.dataset.story!=='wake')return;art.replaceChildren(images[i]);await delay(ms)}}else art.replaceChildren(images[4]);
  dialog.classList.remove('story-ui-hidden');
  await delay(fadeMs);next.disabled=false;
 }
 const placeholder=document.createElement('div');
 const art=scene('loading',placeholder,zh?'加载中':'Loading');
 const dots=document.createElement('span');dots.className='story-dots';dots.innerHTML='<i>.</i><i>.</i><i>.</i>';body.querySelector('p').append(dots);
 async function runLoading(){
  try{
   const row=document.createElement('div');row.className='story-shell-row';art.replaceChildren(row);
   const shells=await Promise.all(introShellNames.map((name,i)=>loadIntroArt(name).catch(()=>loadIntroArt(specimenFiles[i]))));
   shells.forEach((im,i)=>{
    const cell=document.createElement('div');cell.className='story-shell-cell';
    // Trim transparent margins so the wipe spans the visible specimen rather than empty pixels.
    const canvas=document.createElement('canvas');canvas.width=im.naturalWidth;canvas.height=im.naturalHeight;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});let specimen=im;
    if(ctx){try{ctx.drawImage(im,0,0);const {data}=ctx.getImageData(0,0,canvas.width,canvas.height);let x0=canvas.width,y0=canvas.height,x1=-1,y1=-1;
    for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){if(data[(y*canvas.width+x)*4+3]>24){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y)}}
    if(x1>=x0&&y1>=y0){const crop=document.createElement('canvas');crop.width=x1-x0+1;crop.height=y1-y0+1;crop.getContext('2d').drawImage(canvas,x0,y0,crop.width,crop.height,0,0,crop.width,crop.height);specimen=crop}
    }catch{}}
    specimen.classList.add('story-specimen-wipe');specimen.style.animationDelay=(i*.36)+'s';cell.append(specimen);row.append(cell)
   });
   const minimum=delay(3000);
   await Promise.all([minimum,...introNames.slice(1).map((name,i)=>jobs[i+1].catch(()=>loadIntroArt(name)).then(im=>{images[i+1]=im}))]);
   if(active)awaken();
  }catch(err){
   // Do not replace the illustrated story with the old modal. Preserve the loading scene and offer retry.
   const p=body.querySelector('p');p.textContent=zh?'插图加载失败，请重试。':'An illustration could not load. Please retry.';
   button(zh?'重试':'Retry',()=>{goldenIntroBusy=false;overlay.classList.remove('story-intro');showGoldenIntro(onStart)});
  }
 }
 runLoading();
}
function updateBird(dt){
 if(!newGolden||state.chapter!==0||testModule||!imageReady(birdArt))return;
 const m=moduleAt(0,state.x);
 if(!birdEvent&&state.ground&&[3,7,10].includes(m)&&!birdDone.has(m)&&state.x>=moduleStart(0,m)+moduleWidth(0,m)*(m===3?.24:.42)){
  birdDone.add(m);birdEvent={module:m,t:0,warning:m===3?3:2.5,resolved:false,x:state.x+1000};tone(1120);clearTimeout(state.messages);$('message').classList.remove('show');
 }
 const b=birdEvent;if(!b)return;b.t+=dt;b.x=state.x+(b.warning-b.t)*335;
 if(!b.resolved&&b.t>=b.warning){
  b.resolved=true;
  if(controls.hide)note('Safe inside your shell.',1800);
  else {birdDone.delete(b.module);birdEvent=null;state.invincible=0;hurt('The bird caught you outside your shell.');return}
 }
 if(b.t>b.warning+2)birdEvent=null;
}
function drawBird(){
 const b=birdEvent;if(!b)return;
 const p=Math.max(0,1-Math.abs(b.warning-b.t)/1.8),x=b.x;
 cx.save();cx.globalAlpha=.15*p;cx.fillStyle='#302744';cx.beginPath();cx.ellipse(x,Math.min(810,floorAt(0,Math.max(0,Math.min(chapterWidth(0)-1,x)))-3),100,19,0,0,Math.PI*2);cx.fill();cx.restore();
 const seq=[0,1,2,1,3,4,5,4,3],n=seq[Math.floor(b.t*9)%seq.length];cx.save();cx.translate(x,170+p*180+Math.sin(b.t*4)*8);cx.scale(-1,1);cx.drawImage(birdArt,n%3*384,Math.floor(n/3)*384,384,384,-155,-155,310,310);cx.restore();
}
function progress(dt){if(state.mode!=='game'||state.paused)return;const C=CHAPTERS[state.chapter],m=moduleAt(state.chapter,state.x);state.checkpoint=newGolden?safeSpawn(m):Math.max(110,moduleStart(state.chapter,m)+105);
 if(m===0&&state.x>moduleWidth(state.chapter,0)*.36)unlock(C.unlock);
 if(state.chapter===2&&m===1&&!state.broken){const wall=MW+855;if(state.x>wall-85&&state.x<wall+45){if(state.shell==='heavy'&&(controls.right||controls.hide)){breakWall()}else if(state.vx>0){state.x=wall-85;state.vx=0;if(performance.now()%1200<dt*1000)note('A fractured wall · Try the Granite Shell',1600)}}}
 const prevY=state.y,prevX=state.x,wasGrounded=state.ground;const wanted=(+!!controls.right)-(+!!controls.left);
 const maxspeed=controls.hide?0:state.shell==='heavy'?215:newGolden?415:350;
 if(wanted){const target=wanted*maxspeed;state.vx+=(target-state.vx)*Math.min(1,dt*(state.ground?12:8))}else state.vx*=Math.exp(-(state.ground||controls.hide?12:.65)*dt);
 state.x+=state.vx*dt;state.x=Math.max(66,Math.min(chapterWidth(state.chapter)+80,state.x));
 state.vy+=(state.shell==='float'&&!state.ground?GRAV*.34:GRAV)*dt;state.y+=state.vy*dt;if(newGolden)state.x=blockWalls(prevX,prevY,state.x,state.y);state.ground=false;
 const sh=segments[state.chapter];let landed=null;if(newGolden&&state.chapter===0){landed=newLanding(prevX,prevY,wasGrounded)}else for(const [x1,x2,y] of sh){if(state.x+31>x1&&state.x-31<x2&&prevY<=y+4&&state.y>=y&&state.vy>=0){if(landed===null||y<landed)landed=y}}
 if(landed!==null){state.y=landed;state.vy=0;state.ground=true;jumps=0}
 const water=state.chapter===3&&m===1&&state.x>MW+370&&state.x<MW+1320;
 if(water&&state.shell==='float'&&!state.ground&&state.y>590){state.y=590;state.vy=0;state.ground=true;jumps=0;state.vx*=.96}
 if(newGolden&&!state.ground&&touchesWater(state.x,prevY,state.y)){hurt('Tide pool · Try the jump again!');return}if(state.y>880){hurt(water?'Deep water · Use the Floating Shell!':'You fell into the tide pool.');return;}
 const nextModule=moduleAt(state.chapter,state.x);if(nextModule!==m)save();
 for(const item of state.picks||[]){
  const near=item.raised
   ? Math.abs(item.x-state.x)<82&&state.y<=item.surfaceY+18&&state.y>=item.surfaceY-145
   : Math.abs(item.x-state.x)<64&&Math.abs(item.y-state.y)<110;
  if(!item.got&&near){item.got=true;state.collections[item.id]=true;tone(880);note(collectionMessage(item.name),2200);updateHud();save()}
 }
 if(state.x>=chapterWidth(state.chapter)-110){if(newGolden&&state.chapter===0&&(loadedCount<defaults.length||testModule)){state.x=chapterWidth(0)-110;state.vx=0;if(!state.waitingForModule){state.waitingForModule=true;note(testModule?'End of terrain test':'The journey continues soon · Module '+String(loadedCount+1).padStart(2,'0'),3000)}}else finishChapter()}else state.waitingForModule=false;
 updateBird(dt);state.invincible=Math.max(0,state.invincible-dt);state.anim+=dt;
}
function makePickups(){
 const C=CHAPTERS[state.chapter];
 if(newGolden&&state.chapter===0){
  // Source-image coordinates, with positions snapped to existing collision surfaces.
  const places=[{m:1,x:350,platform:0},{m:3,x:400,platform:0},{m:5,x:810,platform:3},{m:7,x:850,platform:0},{m:9,x:750,platform:0}];
  state.picks=C.specimens.flatMap((name,i)=>{
   const p=places[i];if(p.m>=loadedCount)return [];
   const x=moduleStart(0,p.m)+p.x*moduleWidth(0,p.m)/defaults[p.m].width;
   const target=terrain[p.m].platforms[p.platform];
   const base=target&&target.length>=2?lineY(nativeLine(p.m,target),x):null;
   const ground=floorAt(0,x);
   // Use the raised surface, never the ground underneath it.
   const surfaceY=base??(ground-130);
   return [{x,y:surfaceY-12,surfaceY,raised:true,id:'0-'+i,name,got:!!state.collections['0-'+i],artIndex:i}];
  });return;
 }
 state.picks=C.specimens.map((name,i)=>{const x=legacyX(state.chapter,350+i*890+(i%2)*170);return {x,y:floorAt(state.chapter,x)-35-(i===2?75:0),id:state.chapter+'-'+i,name,got:!!state.collections[state.chapter+'-'+i],artIndex:state.chapter===0?i:undefined}}).filter(item=>item.x<chapterWidth(state.chapter)-110);
}
const oldEnter=enterChapter;enterChapter=function(ch,reset=true){newGolden=ch===0&&newReady;window.GoldenAtmosphere?.pollenReset();birdEvent=null;birdDone.clear();oldEnter(ch,reset);makePickups()};
function resize(){const r=canvas.getBoundingClientRect(),dpr=Math.min(3,devicePixelRatio||1);canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);cx.setTransform(dpr,0,0,dpr,0,0);state.viewW=Math.max(1,r.width);state.viewH=Math.max(1,r.height);state.zoom=newGolden?1:r.width<650&&r.height>r.width?1.045:1;state.scale=state.viewH/MH*state.zoom;state.originY=(state.viewH-MH*state.scale)/2}
window.addEventListener('resize',resize);resize();
function render(){if(state.mode!=='game'||!canvas.width||!canvas.height)return;const C=CHAPTERS[state.chapter],S=state.scale,W=state.viewW,H=state.viewH;
 cx.save();cx.clearRect(0,0,W,H);cx.fillStyle=C.palette;cx.fillRect(0,0,W,H);
 const camera=Math.max(0,Math.min(chapterWidth(state.chapter)-W/S,state.x-W/S*.40));state.cam=camera;
 for(let m=0;m<moduleCount(state.chapter);m++){const width=moduleWidth(state.chapter,m),ox=(moduleStart(state.chapter,m)-camera)*S;if(ox>W+2||ox+width*S<0)continue;const im=assets[newGolden&&newModule[m]?`golden-new-${m}`:`${C.key}-${m}`];if(im.complete&&im.naturalWidth){cx.drawImage(im,ox,state.originY,width*S,MH*S);if(newGolden&&newModule[m]&&state.chapter===0)window.GoldenAtmosphere?.draw(cx,im,m,ox,state.originY,width*S,MH*S,state.anim,W,!!birdEvent)}}
 if(newGolden&&state.chapter===0&&!terrainDebug){window.GoldenAtmosphere?.tick(moduleAt(0,state.x),W,H,state.anim,camera*S,(moduleStart(0,1)-camera)*S,chapterWidth(0)*S);window.GoldenAtmosphere?.drawPollen(cx,false,W,H)}
 cx.save();cx.translate(-camera*S,state.originY);cx.scale(S,S);
 if(terrainDebug){cx.save();cx.lineWidth=3;const stroke=(lines,color,closed=false)=>{cx.strokeStyle=color;for(const l of lines){cx.beginPath();l.forEach(([x,y],i)=>i?cx.lineTo(x,y):cx.moveTo(x,y));if(closed){cx.closePath();cx.fillStyle='rgba(75,195,255,.20)';cx.fill()}cx.stroke()}};
 if(newGolden){stroke(goldenGround,'#72ffac');stroke(goldenPlatforms,'#ffd56a');stroke(goldenWalls,'#ff657b');stroke(goldenHazards,'#63cbff',true)}else stroke(segments[state.chapter].map(([a,b,y])=>[[a,y],[b,y]]),'#72ffac');cx.restore()}
 drawBird();
 // Interactable cracked wall, separate from background.
 if(state.chapter===2&&!state.broken){const x=MW+845,y=CHAPTERS[2].floor;cx.fillStyle='#a28bb5cd';cx.strokeStyle='#e6c8de';cx.lineWidth=5;cx.beginPath();cx.moveTo(x-10,y);cx.lineTo(x-8,y-165);cx.lineTo(x+65,y-167);cx.lineTo(x+63,y);cx.closePath();cx.fill();cx.stroke();cx.strokeStyle='#583e72';cx.lineWidth=3;cx.beginPath();cx.moveTo(x+20,y-165);cx.lineTo(x+44,y-122);cx.lineTo(x+15,y-76);cx.lineTo(x+38,y-29);cx.stroke()}
 for(const item of state.picks||[]){
 if(item.got)continue;
 const painted=painterlySpecimenArt[item.artIndex];
 const im=imageReady(painted)?painted:specimenArt[item.artIndex];
 if(imageReady(im)){
  const w=[142,142,142,144,148][item.artIndex],h=w*im.naturalHeight/im.naturalWidth;
  const phase=state.anim*1.85+item.artIndex*1.7;
  const bottom=item.raised?item.y+Math.sin(phase)*8:item.y+22;
  // Two thin, stationary elliptical markers on the support surface, no glow.
  const baseY=item.raised?item.surfaceY:item.y+22;
  cx.save();
  cx.shadowBlur=0;cx.shadowColor='transparent';
  cx.strokeStyle='rgba(255,246,225,.92)';cx.lineWidth=1.8;
  cx.beginPath();cx.ellipse(item.x,baseY,w*.47,10,0,0,Math.PI*2);cx.stroke();
  cx.strokeStyle='rgba(255,246,225,.55)';cx.lineWidth=1.1;
  cx.beginPath();cx.ellipse(item.x,baseY,w*.34,6,0,0,Math.PI*2);cx.stroke();
  cx.drawImage(im,item.x-w/2,bottom-h,w,h);
  cx.restore();
 }else{
  cx.font='55px serif';cx.textAlign='center';cx.shadowColor='transparent';cx.shadowBlur=0;cx.fillText('🐚',item.x,item.y-14+Math.sin(state.anim*3+item.x)*5);cx.shadowBlur=0;
 }
}
 const px=state.x,py=state.y,walk=Math.abs(state.vx)>36&&state.ground;const kind=state.shell,frame=walk?(Math.floor(state.anim*7)%2):0;
 if(!(controls.hide&&drawHiddenShell(kind))&&(kind!=='golden'||!drawGoldenSprite())){
  const im=assets[`crab-${kind}-${frame}`],base=assets[`crab-${kind}-0`],sprite=imageReady(im)?im:base;
  if(imageReady(sprite)){cx.save();cx.translate(px,py);if(state.vx< -12)cx.scale(-1,1);cx.drawImage(sprite,-76,-116,152,116);cx.restore()}
 }
 cx.restore();
 if(newGolden&&state.chapter===0&&!terrainDebug)window.GoldenAtmosphere?.drawPollen(cx,true,W,H);
 cx.restore()}
function updateBirdWarning(){const el=$('birdWarning'),b=birdEvent;const active=!!b&&!b.resolved&&state.mode==='game'&&!state.paused;el.hidden=!active;if(!active)return;const remaining=Math.max(0,b.warning-b.t);el.querySelector('span').textContent=(gameLanguage==='zh'?'飞鸟靠近 · 按住躲藏键':'Bird approaching · Hold HIDE')+' · '+remaining.toFixed(1)+'s';el.querySelector('i').style.transform='scaleX('+Math.max(0,Math.min(1,remaining/b.warning))+')';}
function loop(now){const dt=Math.min(.038,(now-state.last)/1000||.016);state.last=now;progress(dt);updateBirdWarning();updateAtmosphere();render();requestAnimationFrame(loop)}requestAnimationFrame(loop);
function showDialog(title,html,buttons){state.paused=true;clearHeld();$('overlay').classList.remove('chapter-complete');$('overlay').querySelector('.completion-kicker')?.remove();$('dialogTitle').textContent=tr(title);$('dialogBody').innerHTML=translatedText(html);const box=$('dialogButtons');box.innerHTML='';for(const b of buttons){const btn=document.createElement('button');btn.textContent=tr(b.text);btn.addEventListener('click',b.fn);box.append(btn)}$('overlay').classList.add('visible');$('overlay').setAttribute('aria-hidden','false')}
document.addEventListener('visibilitychange',updateAtmosphere);
function closeDialog(){state.chapterIntro=false;$('overlay').classList.remove('chapter-intro','chapter-complete');$('overlay').querySelector('.completion-kicker')?.remove(); $('overlay').classList.remove('visible');$('overlay').setAttribute('aria-hidden','true');state.paused=false;clearHeld()}
function pause(){showDialog('Traveler’s Journal','<p>Pause the journey, consult your shell encyclopedia, or return to the beach.</p>',[{text:'Resume',fn:closeDialog},{text:'Shell Encyclopedia',fn:encyclopedia},{text:'Settings',fn:settings},{text:'Terrain Editor',fn:()=>window.open('terrain.html','_blank')},{text:'Restart Chapter',fn:()=>{closeDialog();enterChapter(state.chapter);if(state.chapter===0&&!testModule)showGoldenIntro()}},{text:'Main Menu',fn:()=>{closeDialog();mode('home')}}])}
function encyclopedia(){let html='<p class="progress">Collect specimens across the four chapters and discover their habitats.</p>';for(let c=0;c<4;c++){html+=`<h3>${CHAPTERS[c].name}</h3>`;CHAPTERS[c].specimens.forEach((s,i)=>{const got=state.collections[`${c}-${i}`];html+=`<div class="entry ${got?'':'locked'}"><span>${got?'🐚':'◇'} ${got?s:'Undiscovered shell'}</span><span>${got?'Collected':'?'}</span></div>`})}showDialog('Shell Encyclopedia',html,[{text:'Back',fn:()=>{closeDialog();if(state.mode==='game')pause()}}])}
function about(){const zh=gameLanguage==='zh';showDialog('About', '<p>'+ (zh?"《壳中旅人》是一场水彩世界中的冒险，讲述小寄居蟹螺仔离开海岸边的家，探索未知世界的故事。它穿越金色海岸、珊瑚花园、水晶洞穴与星之海，收集贝壳、发现新的能力，并寻找归家的道路。这是一段关于好奇心、脆弱、适应与归属的宁静旅程；每一次换壳，都是一次成长。":"A Traveler in a Shell is a watercolor adventure following Luo Zai, a little hermit crab who leaves its coastal home to discover an unfamiliar world. Across golden shores, coral gardens, crystal caverns and a sea of stars, the traveler collects shells, discovers new abilities and finds its own way home. A quiet journey about curiosity, vulnerability, adaptation and belonging, where every change of shell is a form of growth.") +'</p><p>Dalian, 2026</p>',[{text:'Back',fn:()=>closeDialog()}])}
function settings(){showDialog('Settings',`<p>Sound: <strong>${state.sound?'On':'Off'}</strong></p><p>Desktop: ← → to move, ↑ to jump, ↓ to hide.<br>Mobile: hold arrows and tap Jump simultaneously.</p><p>Progress is saved automatically in this browser.</p>`,[{text:state.sound?'Mute Sound':'Enable Sound',fn:()=>{setSound(!state.sound);settings()}},{text:'Back',fn:()=>{closeDialog();if(state.mode==='game')pause()}}])}
function showEpilogue(){showDialog('Homecoming',`<img src="${assetURL('epilogue.jpg')}" alt="Homecoming painting" style="max-width:100%;border-radius:12px"><p>The traveler returns with four different homes, and a world of memories.</p>`,[{text:'Return Home',fn:()=>{closeDialog();mode('home')}}])}
$('begin').addEventListener('click',begin);$('continue').addEventListener('click',resume);$('collection').addEventListener('click',encyclopedia);$('settingsHome').addEventListener('click',settings);$('aboutHome').addEventListener('click',about);$('pauseBtn').addEventListener('click',pause);$('soundHome').addEventListener('click',toggleSound);$('soundGame').addEventListener('click',toggleSound);

function setupEntryGate(){
 const gate=$('entryGate');if(!gate)return;
 if(testModule){gate.hidden=true;return}
 const app=$('app'),fullGroup=$('gateFullGroup'),full=$('gateFull'),sound=$('gateSound'),enter=$('gateEnter');
 app.inert=true;state.sound=soundPreference();syncSoundButtons();
 const mq=window.matchMedia('(min-width:700px) and (hover:hover) and (pointer:fine)');
 const request=document.documentElement.requestFullscreen||document.documentElement.webkitRequestFullscreen,exit=document.exitFullscreen||document.webkitExitFullscreen;
 function fullActive(){return !!(document.fullscreenElement||document.webkitFullscreenElement)}
 function refresh(){
  const zh=gameLanguage==='zh';gate.lang=zh?'zh-CN':'en';
  $('gateLanguageLabel').textContent=zh?'选择语言':'Language';$('gateSoundLabel').textContent=zh?'声音':'Sound';$('gateFullLabel').textContent=zh?'全屏':'Full screen';enter.textContent=zh?'进入':'Enter';
  $('gateSoundText').textContent=zh?(state.sound?'开启':'关闭'):(state.sound?'On':'Off');
  sound.setAttribute('aria-pressed',String(state.sound));$('gateSoundPath').setAttribute('d',state.sound?'M3 9h4l5-4v14l-5-4H3zM15 8q5 4 0 8m3-11q8 7 0 14':'M3 9h4l5-4v14l-5-4H3zM16 9l6 6m0-6-6 6');
  fullGroup.hidden=!(mq.matches&&request&&exit);full.setAttribute('aria-pressed',String(fullActive()));$('gateFullPath').setAttribute('d',fullActive()?'M3 8H8V3 M21 8H16V3 M8 21V16H3 M16 21V16H21':'M8 3H3V8 M16 3H21V8 M3 16V21H8 M21 16V21H16');$('gateFullText').textContent=zh?(fullActive()?'开启':'关闭'):(fullActive()?'On':'Off');
 }
 gate.addEventListener('change',()=>{gameLanguage=gate.querySelector('input[name="language"]:checked').value;refresh()});
 sound.addEventListener('click',()=>{state.sound=!state.sound;try{localStorage.setItem('travelerSoundEnabled',state.sound?'1':'0')}catch{}syncSoundButtons();refresh()});
 full.addEventListener('click',async()=>{try{if(fullActive())await exit.call(document);else await request.call(document.documentElement)}catch{}refresh()});
 document.addEventListener('fullscreenchange',refresh);document.addEventListener('webkitfullscreenchange',refresh);mq.addEventListener?.('change',refresh);
 gate.addEventListener('submit',e=>{e.preventDefault();if(enter.disabled)return;enter.disabled=true;updateHomeLanguage();updateHud();app.inert=false;gate.classList.add('gate-depart');if(state.sound)primeAudio();else syncSoundButtons();setTimeout(()=>{gate.hidden=true;if(new URLSearchParams(location.search).get('preview')==='chapter-end')showGoldenCompletion(true);else $('begin').focus?.()},650)});
 refresh();
}

// Final homepage color, including when opening old theme trial URLs.
document.querySelector('.home-art').setAttribute('data-home-theme','coral');
setupEntryGate();
// Help testing without exposing implementation details in the interface.
if(testModule)newAssetsReady.then(()=>{if(newReady){enterChapter(0);const m=Math.max(0,Math.min(loadedCount-1,testModule-1));state.x=safeSpawn(m);state.y=floorAt(0,state.x)-1;state.ground=false;terrainDebug=true;note('Terrain test · Module '+String(m+1).padStart(2,'0'),2400)}});
window.travelerDebug={state,CHAPTERS,goToChapter:n=>enterChapter(Math.max(0,Math.min(3,n))),advanceToEnd:()=>{state.x=chapterWidth(state.chapter)-130;state.y=floorAt(state.chapter,state.x);},setTerrainDebug:value=>{terrainDebug=!!value},getTerrain:()=>newGolden?goldenSurfaces:segments[state.chapter],getObstacles:()=>({walls:goldenWalls,hazards:goldenHazards}),newArtReady:()=>newReady,goldenArtReady,save};
})();
