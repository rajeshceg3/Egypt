'use client'
import Link from 'next/link'
import React,{useEffect,useRef,useState} from 'react'
import {Experience} from '@/components/Experience'
import {AudioAmbience} from '@/components/AudioAmbience'
const views=[['The three horizons.','The pyramids of Khufu, Khafre and Menkaure define the Giza plateau.'],['Khufu.','Local limestone, once clad in fine casing stone brought from Turah.'],['Khafre.','A second pyramid rises beyond the plateau.'],['Menkaure.','The smallest of the three, with granite used for the lower casing.']]
export default function Home(){
 const [view,setView]=useState(0),[reset,setReset]=useState(0),[paused,setPaused]=useState(true),[ready,setReady]=useState(false);const info=useRef<HTMLDialogElement>(null)
 useEffect(()=>{const id=requestAnimationFrame(()=>{setPaused(matchMedia('(prefers-reduced-motion: reduce)').matches);setReady(true)});return()=>cancelAnimationFrame(id)},[])
 return <main className="world-shell">
 {ready&&<Experience view={view} reset={reset} paused={paused}/>}
 <header><Link className="brand" href="/">Giza.</Link><div className="toolbar"><button id="reset" aria-label="Reset viewpoint" onClick={()=>setReset(x=>x+1)}>↺</button><button id="pause" aria-label={paused?'Resume ambient motion':'Pause ambient motion'} aria-pressed={paused} onClick={()=>setPaused(x=>!x)}>{paused?'▶':'Ⅱ'}</button><AudioAmbience id="sound"/><button id="about" aria-label="About this world" onClick={()=>info.current?.showModal()}>i</button></div></header>
 <p id="compass">Drag to look around</p>
 <section className="story"><p className="eyebrow">EGYPT · THE GIZA PLATEAU</p><h1>{views[view][0]}</h1><p id="line">{views[view][1]}</p></section>
 <nav aria-label="Giza viewpoints">{['Plateau','Khufu','Khafre','Menkaure'].map((n,i)=><button key={n} data-chapter={i} aria-current={i===view?'true':undefined} onClick={()=>setView(i)}>{n}</button>)}</nav>
 <dialog ref={info}><button aria-label="Close information" onClick={()=>info.current?.close()}>Close</button><h2>Light on limestone.</h2><p>An original spatial illustration, not a surveyed reconstruction, navigation guide or live weather feed. Drag or use canvas arrow keys. Reset returns to the chosen subject. Sound is off until you choose it.</p><p>Historical references: <a href="https://egymonuments.gov.eg/en/archaeological-sites/giza-plateau" target="_blank" rel="noreferrer">Egyptian Ministry of Tourism and Antiquities</a>, <a href="https://egymonuments.gov.eg/en/monuments/the-great-pyramid" target="_blank" rel="noreferrer">Khufu</a>, <a href="https://egymonuments.gov.eg/en/monuments/pyramid-complex-of-menkaure" target="_blank" rel="noreferrer">Menkaure</a>.</p></dialog>
 </main>
}
