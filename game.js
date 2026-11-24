/* A Traveler in a Shell · independent reconstruction (2026)
   Plain JavaScript + Canvas 2D; no frameworks or network requests.
   World units are the native 1672 × 941 watercolor image dimensions.
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
function save(){try{localStorage.setItem('travelerShellSave',JSON.stringify({chapter:state.chapter,x:state.x,health:state.health,available:state.available,shell:state.shell,collections:state.collections,broken:state.broken}))}catch{}}
function tone(freq=660){if(!state.sound)return;try{audio=audio||new(window.AudioContext||window.webkitAudioContext)();const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.setValueAtTime(freq,audio.currentTime);o.frequency.exponentialRampToValueAtTime(freq*1.25,audio.currentTime+.1);g.gain.setValueAtTime(.07,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.22);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+.24)}catch{}}
function assetURL(url){return (window.TRAVEL_ASSETS&&window.TRAVEL_ASSETS[url])||A+url}function img(url){const i=new Image();i.src=assetURL(url);return i}
for(const c of CHAPTERS)for(let m=0;m<3;m++)assets[`${c.key}-${m}`]=img(`${c.key}-${m+1}.jpg`);
for(const kind of Object.keys(SHELLS))for(let i=0;i<2;i++)assets[`crab-${kind}-${i}`]=img(`crab-${kind}-${i}.png`);
assets.epilogue=img('epilogue.jpg');
document.addEventListener('contextmenu',e=>e.preventDefault());document.addEventListener('selectstart',e=>e.preventDefault());function mode(name){state.mode=name;$('home').classList.toggle('visible',name==='home');$('game').classList.toggle('visible',name==='game');if(name==='game'){resize();requestAnimationFrame(resize)}else clearHeld()}
function initialCollection(ch){return CHAPTERS[ch].specimens.map((name,i)=>({x:ch*0+210+i*920+([0,90,200,0,60][i]),id:`${ch}-${i}`,name,got:!!state.collections[`${ch}-${i}`]}))}
function enterChapter(ch,resetPosition=true){state.chapter=ch;const C=CHAPTERS[ch];if(resetPosition){state.x=120;state.y=C.floor-1;state.vx=0;state.vy=0;state.health=3;state.broken=false}clearHeld();state.vx=0;state.vy=0;jumps=0;state.checkpoint=110;state.picks=initialCollection(ch);state.paused=false;state.invincible=0;updateHud();mode('game');note(C.descs[0]+' · Explore and discover.',2700);save()}
function begin(){state.collections={};state.available=['golden'];state.shell='golden';enterChapter(0)}
function resume(){const s=safeGet();if(!s){begin();return}Object.assign(state,{available:s.available||['golden'],shell:s.shell||'golden',collections:s.collections||{},broken:!!s.broken,health:s.health||3});enterChapter(Math.max(0,Math.min(3,s.chapter||0)),false);state.x=Math.max(100,s.x||100);state.y=CHAPTERS[state.chapter].floor-1;state.picks=initialCollection(state.chapter);state.health=Math.max(1,state.health);updateHud()}
function shellIcon(kind){return assetURL(`crab-${kind}-0.png`)}
function updateHud(){const C=CHAPTERS[state.chapter];$('chapterIndex').textContent=C.title;$('chapterName').textContent=C.name;const n=C.specimens.filter((_,i)=>state.collections[`${state.chapter}-${i}`]).length;$('collectedCount').textContent=n;$('hearts').textContent='♥ '.repeat(state.health)+'♡ '.repeat(3-state.health);const slots=$('shellSlots');slots.innerHTML='';for(const kind of state.available){const b=document.createElement('button');b.className='shell-choice'+(state.shell===kind?' selected':'');b.dataset.kind=kind;b.setAttribute('aria-label',SHELLS[kind].name+' Shell');b.title=SHELLS[kind].ability;const im=document.createElement('img');im.src=shellIcon(kind);im.alt='';b.append(im);b.addEventListener('click',()=>equip(kind));slots.append(b)}}
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
function jump(){if(state.mode!=='game'||state.paused||controls.hide)return;if(state.ground){state.vy=-730;state.ground=false;jumps=1;tone(520)}else if(state.shell==='spring'&&jumps<2){state.vy=-670;jumps=2;tone(700)}}
function groundSegments(ch){let seg=[];for(let m=0;m<3;m++){const left=m*MW,right=(m+1)*MW,C=CHAPTERS[ch];if(ch===3&&m===1){seg.push([left,left+370,C.floor],[left+1320,right,C.floor]);for(let [a,b,y] of C.platforms[m])seg.push([left+a,left+b,y])}else if(ch===0&&m===1){seg.push([left,left+585,C.floor],[left+760,right,C.floor]);seg.push([left+585,left+760,C.floor-72])}else{seg.push([left,right,C.floor])}for(let [a,b,y] of C.platforms[m]){if(ch===3&&m===1)continue;seg.push([left+a,left+b,y])}}return seg}
let segments=CHAPTERS.map((_,i)=>groundSegments(i));
function breakWall(){if(state.broken)return;state.broken=true;state.vx=135;tone(290);note('The granite shell fractures the ancient stone!',2500);save()}
function hurt(message){if(state.invincible>0)return;state.health--;state.invincible=1.7;clearHeld();tone(240);if(state.health<=0){state.health=3;state.x=state.checkpoint;note('The traveler retreats into its shell · Checkpoint',2000)}else note(message||'Careful! One heart lost.',1700);state.y=CHAPTERS[state.chapter].floor-40;state.vy=0;state.vx=0;state.ground=false;jumps=0;updateHud();save()}
function finishChapter(){state.paused=true;clearHeld();const C=CHAPTERS[state.chapter];save();if(state.chapter===3){mode('home');showDialog('Homecoming','<p>The little traveler has crossed the golden shore, coral gardens, crystal caverns and sea of stars.</p><p>The most extraordinary shell may be the one that feels like home.</p>',[{text:'See the Homecoming',fn:()=>{mode('home');showEpilogue()}},{text:'Return to Main Menu',fn:()=>{closeDialog();mode('home')}}]);return}
const next=CHAPTERS[state.chapter+1];showDialog(`${C.name} · Complete`,`<p>You reached the end of this three-module prototype chapter.</p><p>Continue into <strong>${next.name}</strong>?</p>`,[{text:`Enter ${next.name}`,fn:()=>{closeDialog();enterChapter(state.chapter+1)}},{text:'Home',fn:()=>{closeDialog();mode('home')}}])}
function progress(dt){if(state.mode!=='game'||state.paused)return;const C=CHAPTERS[state.chapter],m=Math.min(2,Math.floor(state.x/MW));state.checkpoint=Math.max(110,Math.floor(state.x/MW)*MW+105);
 if(m===0&&state.x>MW*.36)unlock(C.unlock);
 if(state.chapter===2&&m===1&&!state.broken){const wall=MW+855;if(state.x>wall-85&&state.x<wall+45){if(state.shell==='heavy'&&(controls.right||controls.hide)){breakWall()}else if(state.vx>0){state.x=wall-85;state.vx=0;if(performance.now()%1200<dt*1000)note('A fractured wall · Try the Granite Shell',1600)}}}
 const prevY=state.y;const wanted=(+!!controls.right)-(+!!controls.left);
 const maxspeed=controls.hide?0:state.shell==='heavy'?215:350;
 if(wanted){const target=wanted*maxspeed;state.vx+=(target-state.vx)*Math.min(1,dt*(state.ground?12:8))}else state.vx*=Math.exp(-12*dt);
 state.x+=state.vx*dt;state.x=Math.max(66,Math.min(3*MW+80,state.x));
 state.vy+=(state.shell==='float'&&!state.ground?GRAV*.34:GRAV)*dt;state.y+=state.vy*dt;state.ground=false;
 const sh=segments[state.chapter];let landed=null;for(const [x1,x2,y] of sh){if(state.x+31>x1&&state.x-31<x2&&prevY<=y+4&&state.y>=y&&state.vy>=0){if(landed===null||y<landed)landed=y}}
 if(landed!==null){state.y=landed;state.vy=0;state.ground=true;jumps=0}
 const water=state.chapter===3&&m===1&&state.x>MW+370&&state.x<MW+1320;
 if(water&&state.shell==='float'&&!state.ground&&state.y>590){state.y=590;state.vy=0;state.ground=true;jumps=0;state.vx*=.96}
 if(state.y>880)hurt(water?'Deep water · Use the Floating Shell!':'You fell into the tide pool.');
 if(m>0&&state.x>MW*m+110&&state.checkpoint!==MW*m+110)save();
 for(const item of state.picks||[]){if(!item.got&&Math.abs(item.x-state.x)<64&&Math.abs(item.y-state.y)<110){item.got=true;state.collections[item.id]=true;tone(880);note(`Encyclopedia specimen: ${item.name}`,2200);updateHud();save()}}
 if(state.x>=3*MW-110)finishChapter();
 state.invincible=Math.max(0,state.invincible-dt);state.anim+=dt;
}
function makePickups(){const C=CHAPTERS[state.chapter];state.picks=C.specimens.map((name,i)=>({x:350+i*890+(i%2)*170,y:C.floor-35-(i===2?75:0),id:`${state.chapter}-${i}`,name,got:!!state.collections[`${state.chapter}-${i}`]}))}
const oldEnter=enterChapter;enterChapter=function(ch,reset=true){oldEnter(ch,reset);makePickups()};
function resize(){const r=canvas.getBoundingClientRect(),dpr=Math.min(3,devicePixelRatio||1);canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);cx.setTransform(dpr,0,0,dpr,0,0);state.viewW=Math.max(1,r.width);state.viewH=Math.max(1,r.height);state.zoom=r.width<650&&r.height>r.width?1.045:1;state.scale=state.viewH/MH*state.zoom;state.originY=(state.viewH-MH*state.scale)/2}
window.addEventListener('resize',resize);resize();
function render(){if(state.mode!=='game'||!canvas.width||!canvas.height)return;const C=CHAPTERS[state.chapter],S=state.scale,W=state.viewW,H=state.viewH;
 cx.save();cx.clearRect(0,0,W,H);cx.fillStyle=C.palette;cx.fillRect(0,0,W,H);
 const camera=Math.max(0,Math.min(3*MW-W/S,state.x-W/S*.40));state.cam=camera;
 for(let m=0;m<3;m++){const ox=(m*MW-camera)*S; if(ox>W+2||ox+MW*S<0)continue;const im=assets[`${C.key}-${m}`];if(im.complete&&im.naturalWidth)cx.drawImage(im,ox,state.originY,MW*S,MH*S)}
 cx.save();cx.translate(-camera*S,state.originY);cx.scale(S,S);
 // Interactable cracked wall, separate from background.
 if(state.chapter===2&&!state.broken){const x=MW+845,y=CHAPTERS[2].floor;cx.fillStyle='#a28bb5cd';cx.strokeStyle='#e6c8de';cx.lineWidth=5;cx.beginPath();cx.moveTo(x-10,y);cx.lineTo(x-8,y-165);cx.lineTo(x+65,y-167);cx.lineTo(x+63,y);cx.closePath();cx.fill();cx.stroke();cx.strokeStyle='#583e72';cx.lineWidth=3;cx.beginPath();cx.moveTo(x+20,y-165);cx.lineTo(x+44,y-122);cx.lineTo(x+15,y-76);cx.lineTo(x+38,y-29);cx.stroke()}
 for(const item of state.picks||[]){if(item.got)continue;cx.font='55px serif';cx.textAlign='center';cx.shadowColor='#fff2b9';cx.shadowBlur=18;cx.fillText('🐚',item.x,item.y-14+Math.sin(state.anim*3+item.x)*5);cx.shadowBlur=0}
 const px=state.x,py=state.y,walk=Math.abs(state.vx)>36&&state.ground;const kind=state.shell,frame=walk?(Math.floor(state.anim*7)%2):0;const im=assets[`crab-${kind}-${frame}`];
 if(im.complete&&im.naturalWidth){cx.save();cx.translate(px,py);if(state.vx< -12)cx.scale(-1,1);if(controls.hide)cx.scale(1,.72);cx.drawImage(im,-76,-116,152,116);cx.restore()}
 cx.restore();cx.restore()}
function loop(now){const dt=Math.min(.038,(now-state.last)/1000||.016);state.last=now;progress(dt);render();requestAnimationFrame(loop)}requestAnimationFrame(loop);
function showDialog(title,html,buttons){state.paused=true;clearHeld();$('dialogTitle').textContent=title;$('dialogBody').innerHTML=html;const box=$('dialogButtons');box.innerHTML='';for(const b of buttons){const btn=document.createElement('button');btn.textContent=b.text;btn.addEventListener('click',b.fn);box.append(btn)}$('overlay').classList.add('visible');$('overlay').setAttribute('aria-hidden','false')}
function closeDialog(){ $('overlay').classList.remove('visible');$('overlay').setAttribute('aria-hidden','true');state.paused=false;clearHeld()}
function pause(){showDialog('Traveler’s Journal','<p>Pause the journey, consult your shell encyclopedia, or return to the beach.</p>',[{text:'Resume',fn:closeDialog},{text:'Shell Encyclopedia',fn:encyclopedia},{text:'Settings',fn:settings},{text:'Restart Chapter',fn:()=>{closeDialog();enterChapter(state.chapter)}},{text:'Main Menu',fn:()=>{closeDialog();mode('home')}}])}
function encyclopedia(){let html='<p class="progress">Collect specimens across the four chapters and discover their habitats.</p>';for(let c=0;c<4;c++){html+=`<h3>${CHAPTERS[c].name}</h3>`;CHAPTERS[c].specimens.forEach((s,i)=>{const got=state.collections[`${c}-${i}`];html+=`<div class="entry ${got?'':'locked'}"><span>${got?'🐚':'◇'} ${got?s:'Undiscovered shell'}</span><span>${got?'Collected':'?'}</span></div>`})}showDialog('Shell Encyclopedia',html,[{text:'Back',fn:()=>{closeDialog();if(state.mode==='game')pause()}}])}
function settings(){showDialog('Settings',`<p>Sound: <strong>${state.sound?'On':'Off'}</strong></p><p>Desktop: ← → or A/D to move, Space to jump, H to hide.<br>Mobile: hold arrows and tap Jump simultaneously.</p><p>Progress is saved automatically in this browser.</p>`,[{text:state.sound?'Mute Sound':'Enable Sound',fn:()=>{state.sound=!state.sound;settings()}},{text:'Back',fn:()=>{closeDialog();if(state.mode==='game')pause()}}])}
function showEpilogue(){showDialog('Homecoming',`<img src="${assetURL('epilogue.jpg')}" alt="Homecoming painting" style="max-width:100%;border-radius:12px"><p>The traveler returns with four different homes, and a world of memories.</p>`,[{text:'Return Home',fn:()=>{closeDialog();mode('home')}}])}
$('begin').addEventListener('click',begin);$('continue').addEventListener('click',resume);$('collection').addEventListener('click',encyclopedia);$('settingsHome').addEventListener('click',settings);$('pauseBtn').addEventListener('click',pause);$('soundHome').addEventListener('click',()=>{state.sound=!state.sound;$('muteMark').textContent=state.sound?'':'×';$('soundHome').setAttribute('aria-pressed',String(!state.sound))});
// Help testing without exposing implementation details in the interface.
window.travelerDebug={state,CHAPTERS,goToChapter:n=>enterChapter(Math.max(0,Math.min(3,n))),advanceToEnd:()=>{state.x=3*MW-130;state.y=CHAPTERS[state.chapter].floor;},save};
})();
