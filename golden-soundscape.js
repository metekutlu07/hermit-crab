/* Golden Shores — original procedural ambient sketch, no external recordings.
   Four-minute repeating harmonic progression; continuous independent ocean texture. */
(function(){
'use strict';
const hz=n=>440*Math.pow(2,(n-69)/12);
const harmony=[[50,57,64,69],[53,60,65,69],[48,55,62,67],[55,62,69,71],[52,59,64,67],[50,57,65,69],[48,55,64,69],[55,62,64,69]];
class GoldenSoundscape{
 constructor(ctx){
  this.ctx=ctx;this.active=false;this.nextChord=0;this.nextShell=0;this.chord=0;this.event=0;
  this.master=ctx.createGain();this.master.gain.value=0;this.master.connect(ctx.destination);
  this.ocean=ctx.createGain();this.ocean.gain.value=.10;this.ocean.connect(this.master);
  const len=ctx.sampleRate*6,buf=ctx.createBuffer(1,len,ctx.sampleRate),d=buf.getChannelData(0);
  let seed=126391,sm=0;for(let i=0;i<len;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const x=seed/4294967296*2-1;sm=.92*sm+.08*x;d[i]=sm*.9+x*.13}
  for(let i=0;i<128;i++){const k=i/128;d[i]=d[i]*k+d[len-1]*(1-k)}
  this.surf=ctx.createBufferSource();this.surf.buffer=buf;this.surf.loop=true;
  const low=ctx.createBiquadFilter();low.type='lowpass';low.frequency.value=620;low.Q.value=.5;
  const high=ctx.createBiquadFilter();high.type='highpass';high.frequency.value=95;high.Q.value=.5;
  this.surf.connect(low);low.connect(high);high.connect(this.ocean);this.surf.start();
  this.tides=[];for(const [freq,amp] of [[.086,.065],[.127,.023]]){const o=ctx.createOscillator(),g=ctx.createGain();o.frequency.value=freq;g.gain.value=amp;o.connect(g);g.connect(this.ocean.gain);o.start();this.tides.push(o,g)}
 }
 voice(n,t,length,volume,kind){
  const c=this.ctx,o=c.createOscillator(),g=c.createGain();o.type=kind==='pad'?'sine':'triangle';o.frequency.value=hz(n);
  const attack=kind==='pad'?4.5:.14,release=kind==='pad'?7:3;
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+attack);
  g.gain.setValueAtTime(volume*.8,t+Math.max(attack+.05,length-release));
  g.gain.linearRampToValueAtTime(0,t+length);
  o.connect(g);g.connect(this.master);o.start(t);o.stop(t+length+.02);
  o.onended=()=>{try{o.disconnect();g.disconnect()}catch{}};
 }
 update(active){
  const c=this.ctx,t=c.currentTime;
  if(active!==this.active){this.active=active;this.master.gain.cancelScheduledValues(t);this.master.gain.setTargetAtTime(active?.68:0,t,active?1.1:.16);
   if(active){if(this.nextChord<t)this.nextChord=t+.15;if(this.nextShell<t)this.nextShell=t+6}
  }
  if(!active||c.state!=='running')return;
  if(t+.5>=this.nextChord){
   const start=Math.max(t+.04,this.nextChord),notes=harmony[this.chord%harmony.length];this.currentNotes=notes;
   notes.forEach((n,i)=>this.voice(n,start+i*.16,34,i===0?.028:.016,'pad'));
   this.chord=(this.chord+1)%harmony.length;this.nextChord=start+30;
  }
  if(t+.3>=this.nextShell){
   const start=Math.max(t+.04,this.nextShell),notes=this.currentNotes||harmony[0],i=this.event++;
   const n=notes[(i*3+2)%notes.length]+12;this.voice(n,start,4.6,.021,'shell');
   this.voice(n+12,start+.02,2.3,.0045,'shell');
   if(i%4===2)this.voice(notes[(i+1)%notes.length]+12,start+1.4,4,.012,'shell');
   this.nextShell=start+[10,13,8,15,11][i%5];
  }
 }
}
window.GoldenSoundscape=GoldenSoundscape;
})();