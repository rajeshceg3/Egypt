'use client'
import Link from 'next/link'
import React,{useEffect,useRef,useState} from 'react'
import {Experience} from '@/components/Experience'
import {AudioAmbience} from '@/components/AudioAmbience'
const views=[['The three horizons.','The pyramids of Khufu, Khafre and Menkaure define the Giza plateau.'],['Khufu.','Local limestone, once clad in fine casing stone brought from Turah.'],['Khafre.','A second pyramid rises beyond the plateau.'],['Menkaure.','The smallest of the three, with granite used for the lower casing.']]
export default function Home(){
 const [view,setView]=useState(0),[reset,setReset]=useState(0),[paused,setPaused]=useState(true),[ready,setReady]=useState(false);const info=useRef<HTMLDialogElement>(null)
 useEffect(()=>{const id=requestAnimationFrame(()=>{setPaused(matchMedia('(prefers-reduced-motion: reduce)').matches);setReady(true)});return()=>cancelAnimationFrame(id)},[])
 useEffect(()=>{
  const PIN_KEY='egypt-chrome-pin',TOP_ZONE=96,BOTTOM_ZONE=150,RETIRE_MS=2600;
  const els=[...document.querySelectorAll('.toolbar,nav[aria-label="Giza viewpoints"]')];
  els.forEach((e:Element)=>e.classList.add('chrome','chrome-on'));
  const hint=document.createElement('button');
  hint.className='chrome-hint';hint.hidden=true;hint.setAttribute('aria-label','Show controls');
  hint.innerHTML='<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M4 17 L12 7 L20 17 M8.5 17 L12 12.4 L15.5 17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  document.body.appendChild(hint);
  const pinBtn=document.createElement('button');
  pinBtn.id='pin-controls';pinBtn.type='button';pinBtn.className='pin-btn';pinBtn.textContent='Pin';pinBtn.title='Keep controls visible';pinBtn.setAttribute('aria-pressed','false');
  const tb=document.querySelector('.toolbar');if(tb)tb.appendChild(pinBtn);
  let pinned=false;try{pinned=localStorage.getItem(PIN_KEY)==='1'}catch{}
  let chrome=true,focusWithin=false,retireTimer:ReturnType<typeof setTimeout>|undefined;
  const dialogOpen=()=>{const d=document.querySelector('dialog');return d&&d.open};
  const apply=()=>{const on=chrome||pinned;els.forEach((e:Element)=>e.classList.toggle('chrome-on',on));hint.hidden=on};
  const retireSoon=()=>{retireTimer&&clearTimeout(retireTimer);retireTimer=setTimeout(()=>{if(!focusWithin&&!dialogOpen()){chrome=false;apply()}},RETIRE_MS)};
  const wake=()=>{chrome=true;apply();retireSoon()};
  const onMove=(e:PointerEvent)=>{if(e.pointerType==='touch')return;if(e.clientY<TOP_ZONE||e.clientY>innerHeight-BOTTOM_ZONE)wake()};
  const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape'){if(dialogOpen())return;focusWithin=false;chrome=false;apply()}};
  const onFocusIn=(e:FocusEvent)=>{if(els.some((x:Element)=>x.contains(e.target as Node))){focusWithin=true;retireTimer&&clearTimeout(retireTimer);chrome=true;apply()}};
  const onFocusOut=(e:FocusEvent)=>{if(!els.some((x:Element)=>x.contains(e.relatedTarget as Node))){focusWithin=false;retireSoon()}};
  document.addEventListener('pointermove',onMove);
  document.addEventListener('keydown',onKey);
  document.addEventListener('focusin',onFocusIn);
  document.addEventListener('focusout',onFocusOut);
  hint.addEventListener('click',wake);
  const setPin=(next:boolean)=>{pinned=next;try{next?localStorage.setItem(PIN_KEY,'1'):localStorage.removeItem(PIN_KEY)}catch{}pinBtn.setAttribute('aria-pressed',String(next));pinBtn.textContent=next?'Unpin':'Pin';pinBtn.title=next?'Let controls retire':'Keep controls visible';if(next){chrome=true;apply()}else retireSoon()};
  pinBtn.addEventListener('click',()=>setPin(!pinned));
  if(pinned)setPin(true);
  retireSoon();
  return()=>{clearTimeout(retireTimer);document.removeEventListener('pointermove',onMove);document.removeEventListener('keydown',onKey);document.removeEventListener('focusin',onFocusIn);document.removeEventListener('focusout',onFocusOut);hint.remove();pinBtn.remove();els.forEach((e:Element)=>e.classList.remove('chrome','chrome-on'))};
 },[])
 return <main className="world-shell">
 {ready&&<Experience view={view} reset={reset} paused={paused}/>}
 <header><Link className="brand" href="/">Giza.</Link><div className="toolbar"><button id="reset" aria-label="Reset viewpoint" onClick={()=>setReset(x=>x+1)}>↺</button><button id="pause" aria-label={paused?'Resume ambient motion':'Pause ambient motion'} aria-pressed={paused} onClick={()=>setPaused(x=>!x)}>{paused?'▶':'Ⅱ'}</button><AudioAmbience id="sound" view={view}/><button id="about" aria-label="About this world" onClick={()=>info.current?.showModal()}>i</button></div></header>
 <p id="compass">Drag to look around</p>
 <section className="story"><p className="eyebrow">EGYPT · THE GIZA PLATEAU</p><h1>{views[view][0]}</h1><p id="line">{views[view][1]}</p></section>
 <nav aria-label="Giza viewpoints">{['Plateau','Khufu','Khafre','Menkaure'].map((n,i)=><button key={n} data-chapter={i} aria-current={i===view?'true':undefined} onClick={()=>setView(i)}>{n}</button>)}</nav>
 <dialog ref={info}><button aria-label="Close information" onClick={()=>info.current?.close()}>Close</button><h2>Light on limestone.</h2><p>An original spatial illustration, not a surveyed reconstruction, navigation guide or live weather feed. Drag or use canvas arrow keys. Reset returns to the chosen subject. Sound is off until you choose it.</p><p>Historical references: <a href="https://egymonuments.gov.eg/en/archaeological-sites/giza-plateau" target="_blank" rel="noreferrer">Egyptian Ministry of Tourism and Antiquities</a>, <a href="https://egymonuments.gov.eg/en/monuments/the-great-pyramid" target="_blank" rel="noreferrer">Khufu</a>, <a href="https://egymonuments.gov.eg/en/monuments/pyramid-complex-of-menkaure" target="_blank" rel="noreferrer">Menkaure</a>.</p></dialog>
 </main>
}
