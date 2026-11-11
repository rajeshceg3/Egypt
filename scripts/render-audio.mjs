import fs from 'node:fs';
import {makeRng,renderWindLoop} from '../src/sound/wind-dsp.mjs';
import {GIZA_WIND} from '../src/sound/giza-places.mjs';
export const OUT=process.env.AUDIO_OUT||'verification/audio';
fs.mkdirSync(OUT,{recursive:true});
for(const [index,place] of GIZA_WIND.entries()){
 const sr=44100,n=sr*45,d=renderWindLoop(sr,place.params,makeRng(901+index)),buf=Buffer.alloc(44+n*4);
 buf.write('RIFF');buf.writeUInt32LE(36+n*4,4);buf.write('WAVE',8);buf.write('fmt ',12);buf.writeUInt32LE(16,16);buf.writeUInt16LE(1,20);buf.writeUInt16LE(2,22);buf.writeUInt32LE(sr,24);buf.writeUInt32LE(sr*4,28);buf.writeUInt16LE(4,32);buf.writeUInt16LE(16,34);buf.write('data',36);buf.writeUInt32LE(n*4,40);
 let sum=0,peak=0,dc=0;
 for(let i=0;i<n;i++)for(let ch=0;ch<2;ch++){
  const a=ch?d.right:d.left,x=a[i%a.length]*place.gain*.9;sum+=x*x;dc+=x;peak=Math.max(peak,Math.abs(x));buf.writeInt16LE(Math.max(-1,Math.min(1,x))*32767,44+i*4+ch*2);
 }
 const db=20*Math.log10(Math.sqrt(sum/(2*n)));if(peak>=.98||db< -40||db> -14||Math.abs(dc/(2*n))>.005)throw Error('Level check '+place.name);
 // True adjacent-sample seam comparison against the bed's own derivatives.
 for(const a of [d.left,d.right]){let max=0;for(let i=1;i<a.length;i++)max=Math.max(max,Math.abs(a[i]-a[i-1]));const jump=Math.abs(a[0]-a[a.length-1]);if(jump>max*1.5)throw Error('Loop discontinuity '+place.name)}
 fs.writeFileSync(OUT+'/giza-'+place.name+'.wav',buf);console.log('PASS',place.name,db.toFixed(1)+' dBFS',peak.toFixed(3),'peak; channel and seam checks');
}
