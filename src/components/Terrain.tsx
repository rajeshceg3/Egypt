/* eslint-disable react-hooks/immutability -- Three.js scene objects are intentionally mutable; seeded texture generation is local and deterministic. */
'use client'
import {useMemo} from 'react'
import * as THREE from 'three'
export function Terrain(){
 const {geometry,texture,stones}=useMemo(()=>{const g=new THREE.PlaneGeometry(1000,1000,180,180);g.rotateX(-Math.PI/2);const p=g.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),r=Math.hypot(x,z);const blend=THREE.MathUtils.smoothstep(r,28,80);p.setY(i,-.035+blend*(Math.sin(x*.035+z*.018)*1.7+Math.sin(z*.055)*.5))}g.computeVertexNormals();
 const c=document.createElement('canvas');c.width=c.height=1024;const ctx=c.getContext('2d')!;let seed=256;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};ctx.fillStyle='#c9af86';ctx.fillRect(0,0,1024,1024);
 for(let i=0;i<1600;i++){ctx.beginPath();ctx.ellipse(rand()*1024,rand()*1024,10+rand()*90,2+rand()*12,rand()*.3,0,Math.PI*2);ctx.fillStyle=rand()>.5?'rgba(246,222,173,.045)':'rgba(117,96,67,.035)';ctx.fill()}
 for(let i=0;i<180000;i++){ctx.fillStyle=rand()>.5?'rgba(255,236,190,.13)':'rgba(112,90,61,.1)';ctx.fillRect(rand()*1024,rand()*1024,1,1)}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(65,65);t.anisotropy=8;
 const rocks=[];for(let i=0;i<190;i++){const x=(rand()-.5)*85,z=(rand()-.5)*85;if(Math.hypot(x,z)<6||Math.hypot(x+12,z+12)<5||Math.hypot(x-10,z-8)<3)continue;rocks.push({x,z,s:.04+rand()*.16,r:rand()*6})}
 return {geometry:g,texture:t,stones:rocks}},[])
 return <group><mesh geometry={geometry} receiveShadow><meshStandardMaterial color="#e5cda7" map={texture} bumpMap={texture} bumpScale={.035} roughness={1}/></mesh>{stones.map((a,i)=><mesh key={i} position={[a.x,a.s*.28-.015,a.z]} rotation={[0,a.r,.1]} scale={[a.s*2.3,a.s*.65,a.s]} castShadow><dodecahedronGeometry args={[1,0]}/><meshStandardMaterial color={i%2?'#baa17c':'#d6c39e'} roughness={1}/></mesh>)}</group>
}
