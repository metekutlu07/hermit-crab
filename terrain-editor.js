(()=>{'use strict';
const $=id=>document.getElementById(id),base=window.GOLDEN_TERRAIN,copy=x=>JSON.parse(JSON.stringify(x)),key='goldenTerrainV5',kinds=['ground','platforms','walls','hazards'],names={ground:'Ground',platforms:'Platform',walls:'Wall',hazards:'Water'},colors={ground:'#72ffac',platforms:'#ffd56a',walls:'#ff657b',hazards:'#63cbff'};
const ordered=k=>k==='ground'||k==='platforms',minPoints=k=>k==='hazards'?3:2;
let data=copy(base);try{const v=JSON.parse(localStorage.getItem(key)||'null');if(valid(v))data=v.map((m,i)=>({...base[i],ground:m.ground,platforms:m.platforms,walls:m.walls,hazards:m.hazards}));}catch{}
let index=0,kind='ground',lineIndex=0,vertex=-1,mode='move',drag=null,history=[],img=new Image(),loadToken=0;
const cv=$('art'),ctx=cv.getContext('2d');
function valid(v){return Array.isArray(v)&&v.length===base.length&&v.every((m,i)=>m&&kinds.every(k=>Array.isArray(m[k])&&m[k].every(l=>Array.isArray(l)&&l.length>=minPoints(k)&&l.every((p,j)=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)&&p[0]>=0&&p[0]<=base[i].width&&p[1]>=0&&p[1]<=base[i].height&&(!ordered(k)||!j||p[0]>l[j-1][0])))))}
const cur=()=>data[index],line=()=>cur()[kind][lineIndex];
function snapshot(){history.push(JSON.stringify(data));if(history.length>50)history.shift()}
function status(t){$('status').textContent=t}
function setMode(m){mode=m;for(const id of ['move','insert','ground','platform','wall','water'])$(id).classList.toggle('active',id===m);status(m==='move'?'Drag any vertex. Select a line from the menu or click a vertex.':m==='insert'?'Click to insert a point on the selected surface.':m==='wall'?'Click wall endpoints in any direction, then Finish line.':m==='water'?'Click around the water boundary, then Finish line.':'Click from left to right, then Finish line.');}
function list(){const sel=$('lines');sel.replaceChildren();for(const k of kinds)cur()[k].forEach((l,i)=>{const o=document.createElement('option');o.value=k+':'+i;o.textContent=names[k]+' '+(i+1);sel.append(o)});sel.value=kind+':'+lineIndex;if(!sel.value&&sel.options.length){sel.selectedIndex=0;[kind,lineIndex]=sel.value.split(':');lineIndex=+lineIndex}draw()}
function firstIssue(){
 for(let i=0;i<data.length;i++)for(const k of kinds)for(let n=0;n<data[i][k].length;n++){
  const l=data[i][k][n];
  if(l.length<minPoints(k))return {i,k,n,reason:'needs '+minPoints(k)+' points; currently '+l.length};
  for(let p=0;p<l.length;p++){
   const q=l[p];
   if(!Array.isArray(q)||q.length!==2||!q.every(Number.isFinite)||q[0]<0||q[0]>base[i].width||q[1]<0||q[1]>base[i].height)return {i,k,n,reason:'point '+(p+1)+' lies outside the painting or is invalid'};
   if(ordered(k)&&p&&q[0]<=l[p-1][0])return {i,k,n,reason:'points '+p+' and '+(p+1)+' must be ordered left to right'};
  }
 }
 return null;
}
function locateIssue(issue){
 const {i,k,n,reason}=issue;
 kind='ground';lineIndex=-1;choose(i);kind=k;lineIndex=n;vertex=-1;setMode('move');list();
 status('Module '+String(i+1).padStart(2,'0')+' · '+names[k]+' '+(n+1)+': '+reason+'. Correct this line or use Delete line if accidental. Your other edits are unchanged.');
}
function persist(){if(!valid(data)){const issue=firstIssue();if(issue)locateIssue(issue);else status('Terrain data is invalid. No edits have been removed.');return false}try{localStorage.setItem(key,JSON.stringify(data));status('Saved locally. Test or export when ready.');return true}catch(e){status('Browser storage unavailable. Export JSON instead.');return false}}
function draw(){ctx.clearRect(0,0,cv.width,cv.height);if(img.complete&&img.naturalWidth)ctx.drawImage(img,0,0,cv.width,cv.height);ctx.lineJoin='round';ctx.lineCap='round';const unit=cv.width/Math.max(1,cv.getBoundingClientRect().width);for(const k of kinds)cur()[k].forEach((l,i)=>{const sel=kind===k&&lineIndex===i;ctx.strokeStyle=colors[k];ctx.fillStyle=ctx.strokeStyle;ctx.globalAlpha=sel?1:.75;ctx.lineWidth=(sel?3:2)*unit;ctx.beginPath();l.forEach((p,j)=>j?ctx.lineTo(...p):ctx.moveTo(...p));if(k==='hazards'&&l.length>=3){ctx.closePath();ctx.save();ctx.globalAlpha=.19;ctx.fill();ctx.restore()}ctx.stroke();if(sel)l.forEach((p,j)=>{ctx.beginPath();ctx.arc(p[0],p[1],(j===vertex?7:4.5)*unit,0,Math.PI*2);ctx.fillStyle=j===vertex?'white':ctx.strokeStyle;ctx.fill();ctx.strokeStyle='#20172c';ctx.lineWidth=1.2*unit;ctx.stroke();ctx.strokeStyle=colors[k]});ctx.globalAlpha=1});}
function choose(i){if(line()&&line().length<minPoints(kind)){status('Finish or delete the incomplete line first.');return}index=Math.max(0,Math.min(base.length-1,i));$('module').value=index;kind='ground';lineIndex=0;vertex=-1;setMode('move');cv.width=cur().width;cv.height=cur().height;const token=++loadToken;img=new Image();img.onload=()=>{if(token===loadToken)draw()};img.onerror=()=>status('Cannot load '+cur().file);img.src='assets/'+cur().file;list()}
function point(e){const r=cv.getBoundingClientRect();return [Math.max(0,Math.min(cv.width,Math.round((e.clientX-r.left)*cv.width/r.width))),Math.max(0,Math.min(cv.height,Math.round((e.clientY-r.top)*cv.height/r.height)))]}
function nearest(p){let hit=null,min=14*cv.width/cv.getBoundingClientRect().width;for(const k of kinds)cur()[k].forEach((l,i)=>l.forEach((q,j)=>{const d=Math.hypot(q[0]-p[0],q[1]-p[1]);if(d<min){min=d;hit={k,i,j}}}));return hit}
cv.addEventListener('pointerdown',e=>{e.preventDefault();const p=point(e);if(['ground','platform','wall','water'].includes(mode)){const l=line();if(ordered(kind)&&l.length&&p[0]<=l[l.length-1][0]){status('Points must move from left to right.');return}snapshot();l.push(p);vertex=l.length-1;draw();return}if(mode==='insert'){const l=line();if(!l)return;if(ordered(kind)&&l.some(q=>q[0]===p[0]))return;snapshot();if(ordered(kind)){l.push(p);l.sort((a,b)=>a[0]-b[0]);vertex=l.indexOf(p)}else{let at=1,best=Infinity;const n=kind==='hazards'?l.length:l.length-1;for(let j=0;j<n;j++){const a=l[j],b=l[(j+1)%l.length],dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy||1))),dist=Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);if(dist<best){best=dist;at=j+1}}l.splice(at,0,p);vertex=at;}draw();return}const hit=nearest(p);if(hit){kind=hit.k;lineIndex=hit.i;vertex=hit.j;snapshot();drag=e.pointerId;cv.setPointerCapture(e.pointerId);list()}});
cv.addEventListener('pointermove',e=>{if(drag!==e.pointerId)return;const p=point(e),l=line();if(!l||vertex<0)return;if(ordered(kind))p[0]=Math.max(vertex?l[vertex-1][0]+1:0,Math.min(vertex<l.length-1?l[vertex+1][0]-1:cv.width,p[0]));l[vertex]=p;draw()});
for(const ev of ['pointerup','pointercancel','lostpointercapture'])cv.addEventListener(ev,e=>{if(drag===e.pointerId)drag=null});
$('lines').onchange=()=>{[kind,lineIndex]=$('lines').value.split(':');lineIndex=+lineIndex;vertex=-1;setMode('move');draw()};
$('module').onchange=()=>choose(+$('module').value);$('prev').onclick=()=>choose(index-1);$('next').onclick=()=>choose(index+1);
$('move').onclick=()=>setMode('move');$('insert').onclick=()=>{if(line())setMode('insert')};
function add(k){if(line()&&line().length<minPoints(kind)){status('Finish or delete the incomplete line first.');return}snapshot();kind=k;cur()[k].push([]);lineIndex=cur()[k].length-1;vertex=-1;list();setMode(({ground:'ground',platforms:'platform',walls:'wall',hazards:'water'})[k])}
$('ground').onclick=()=>add('ground');$('platform').onclick=()=>add('platforms');$('wall').onclick=()=>add('walls');$('water').onclick=()=>add('hazards');$('done').onclick=()=>{if(line()&&line().length<minPoints(kind)){status(kind==='hazards'?'A water polygon needs three points.':'A surface needs at least two points.');return}setMode('move')};
$('delPoint').onclick=()=>{const l=line();if(!l||vertex<0)return;if(l.length<=minPoints(kind)){status('Minimum vertices reached. Use Delete line instead.');return}snapshot();l.splice(vertex,1);vertex=-1;draw()};
$('delLine').onclick=()=>{if(!line())return;snapshot();cur()[kind].splice(lineIndex,1);lineIndex=0;vertex=-1;setMode('move');list()};
$('undo').onclick=()=>{if(history.length){data=JSON.parse(history.pop());kind='ground';lineIndex=0;vertex=-1;setMode('move');list()}};
$('reset').onclick=()=>{if(confirm('Reset this module to the draft geometry?')){snapshot();data[index]=copy(base[index]);kind='ground';lineIndex=0;vertex=-1;setMode('move');list()}};
$('save').onclick=persist;$('test').onclick=()=>{if(persist())window.open('index.html?testModule='+(index+1),'_blank')};
$('export').onclick=()=>{if(!persist())return;const a=document.createElement('a'),url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));a.href=url;a.download='golden-terrain.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
$('import').onclick=()=>$('file').click();$('file').onchange=async()=>{try{const v=JSON.parse(await $('file').files[0].text());if(!valid(v))throw Error('Invalid terrain JSON');snapshot();data=v.map((m,i)=>({...base[i],ground:m.ground,platforms:m.platforms,walls:m.walls,hazards:m.hazards}));kind='ground';lineIndex=0;vertex=-1;setMode('move');list();persist()}catch(e){status(e.message)}$('file').value=''};
$('zoom').onchange=()=>{cv.style.width=(+$('zoom').value*100)+'%';draw()};window.addEventListener('resize',draw);
base.forEach((m,i)=>{const o=document.createElement('option');o.value=i;o.textContent=String(i+1).padStart(2,'0')+' · '+m.file;$('module').append(o)});choose(0);
})();