/* eslint-disable react-hooks/immutability -- Three.js scene objects are intentionally mutable; seeded texture generation is local and deterministic. */
'use client'
import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
const VIEWS = [
 { p:[27,12,38], t:[-1,1,-2] },
 { p:[13,3.6,17], t:[0,2.1,0] },
 { p:[-24,3.6,2], t:[-12,2.2,-12] },
 { p:[18,2.8,18], t:[10,1,8] }
]
export function Navigation({view,reset}:{view:number,reset:number}) {
 const {camera,gl,invalidate,size}=useThree()
 const angle=useRef({yaw:0,pitch:0}); const drag=useRef<{x:number,y:number}|null>(null)
 useEffect(()=>{
 camera.rotation.order='YXZ';const v=VIEWS[view];const target=new THREE.Vector3(...v.t);camera.position.fromArray(v.p);if(view>0){const factor=Math.max(1,.60/(size.width/size.height));camera.position.sub(target).multiplyScalar(factor).add(target)}camera.lookAt(target);
 const e=new THREE.Euler().setFromQuaternion(camera.quaternion,'YXZ');angle.current={yaw:e.y,pitch:e.x};drag.current=null;
 const canvas=gl.domElement;canvas.dataset.entryYaw=String(e.y);canvas.dataset.entryPitch=String(e.x);
 camera.updateMatrixWorld();Object.assign(canvas.dataset,{yaw:String(camera.rotation.y),pitch:String(camera.rotation.x),view:String(view)});invalidate()
 },[view,reset,camera,gl,invalidate,size.width,size.height])
 useEffect(()=>{
 const c=gl.domElement;c.tabIndex=0;c.setAttribute('aria-label','Illustrated Giza plateau. Drag or use arrow keys to look around.');
 const apply=()=>{camera.rotation.set(angle.current.pitch,angle.current.yaw,0,'YXZ');camera.updateMatrixWorld();Object.assign(c.dataset,{yaw:String(camera.rotation.y),pitch:String(camera.rotation.x)});invalidate()};
 const down=(e:PointerEvent)=>{drag.current={x:e.clientX,y:e.clientY};c.setPointerCapture(e.pointerId)};
 const move=(e:PointerEvent)=>{if(!drag.current)return;angle.current.yaw-=(e.clientX-drag.current.x)*.004;angle.current.pitch=Math.max(-.9,Math.min(.7,angle.current.pitch-(e.clientY-drag.current.y)*.003));drag.current={x:e.clientX,y:e.clientY};apply()};
 const up=()=>{drag.current=null};
 const key=(e:KeyboardEvent)=>{if(!e.key.startsWith('Arrow'))return;e.preventDefault();angle.current.yaw+=e.key==='ArrowLeft'?.12:e.key==='ArrowRight'?-.12:0;angle.current.pitch=Math.max(-.9,Math.min(.7,angle.current.pitch+(e.key==='ArrowUp'?.08:e.key==='ArrowDown'?-.08:0)));apply()};
 c.addEventListener('pointerdown',down);c.addEventListener('pointermove',move);c.addEventListener('pointerup',up);c.addEventListener('pointercancel',up);c.addEventListener('keydown',key);
 return()=>{c.removeEventListener('pointerdown',down);c.removeEventListener('pointermove',move);c.removeEventListener('pointerup',up);c.removeEventListener('pointercancel',up);c.removeEventListener('keydown',key)}
 },[gl,invalidate,camera])

 return null
}
