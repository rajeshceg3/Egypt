'use client'
import React,{useState,useEffect,useRef,forwardRef,useImperativeHandle,useCallback} from 'react'
import {Volume2,VolumeX} from 'lucide-react'
import {makeRng,renderWindLoop} from '../sound/wind-dsp.mjs'
import {GIZA_WIND} from '../sound/giza-places.mjs'
export interface AudioAmbienceHandle {startAudio:()=>void;stopAudio:()=>void}
type Props=React.HTMLAttributes<HTMLButtonElement>&{view?:number}
type Bed={source:AudioBufferSourceNode;gain:GainNode}
export const AudioAmbience=forwardRef<AudioAmbienceHandle,Props>(({view=0,...props},ref)=>{
 const [isPlaying,setPlaying]=useState(false)
 const ctx=useRef<AudioContext|null>(null),master=useRef<GainNode|null>(null),beds=useRef<Bed[]>([]),playing=useRef(false),generation=useRef(0)
 const setView=useCallback((index:number)=>{
  const c=ctx.current,m=master.current;if(!c||!m)return
  const place=GIZA_WIND[index]||GIZA_WIND[0],t=c.currentTime
  for(const old of beds.current){old.gain.gain.cancelScheduledValues(t);old.gain.gain.setValueAtTime(old.gain.gain.value,t);old.gain.gain.linearRampToValueAtTime(0,t+1.5);old.source.stop(t+1.6)}
  const data=renderWindLoop(c.sampleRate,place.params,makeRng(901+index)),b=c.createBuffer(2,data.left.length,c.sampleRate)
  b.getChannelData(0).set(data.left);b.getChannelData(1).set(data.right)
  const source=c.createBufferSource(),gain=c.createGain();source.buffer=b;source.loop=true
  gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(place.gain,t+1.5)
  source.connect(gain).connect(m);source.onended=()=>{source.disconnect();gain.disconnect()};source.start();beds.current=[{source,gain}]
 },[])
 const start=useCallback(async()=>{
  const token=++generation.current
  if(!ctx.current){ctx.current=new AudioContext();master.current=ctx.current.createGain();master.current.gain.value=.9;master.current.connect(ctx.current.destination)}
  const c=ctx.current;await c.resume();if(token!==generation.current||ctx.current!==c)return
  playing.current=true;setPlaying(true);setView(view)
 },[setView,view])
 const stop=useCallback(()=>{
  generation.current++;playing.current=false;setPlaying(false)
  const c=ctx.current;ctx.current=null;master.current=null;beds.current=[]
  if(c&&c.state!=='closed')void c.close()
 },[])
 useEffect(()=>{if(playing.current)setView(view)},[view,setView])
 useEffect(()=>()=>{generation.current++;playing.current=false;const c=ctx.current;ctx.current=null;if(c&&c.state!=='closed')void c.close()},[])
 useImperativeHandle(ref,()=>({startAudio:()=>{void start()},stopAudio:stop}),[start,stop])
 return <button {...props} onClick={()=>{if(playing.current)stop();else void start()}} className="sound-control" aria-pressed={isPlaying} aria-label={isPlaying?'Mute':'Unmute'}>{isPlaying?<Volume2 strokeWidth={1} size={24}/>:<VolumeX strokeWidth={1} size={24}/>}</button>
})
AudioAmbience.displayName='AudioAmbience'
