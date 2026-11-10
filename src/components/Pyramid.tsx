'use client'
import {useMemo} from 'react'
import * as THREE from 'three'
function makeStoneTexture(granite=false){
 const c=document.createElement('canvas');c.width=1024;c.height=1024;const x=c.getContext('2d')!;let seed=2187;const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296};
 x.fillStyle='#bda26f';x.fillRect(0,0,1024,1024);
 for(let row=0;row<64;row++)for(let col=-1;col<18;col++){const px=col*64+(row%2)*32,py=row*16;const v=Math.floor(rand()*26);const red=granite&&row>47;x.fillStyle=red?`rgb(${135+v},${98+v},${81+v})`:`rgb(${183+v},${158+v},${119+v})`;x.fillRect(px+1,py+1,62,14);x.fillStyle=red?'#745b4e':'#a38b67';x.fillRect(px+1,py+14,62,1);x.fillStyle='rgba(255,244,210,.24)';x.fillRect(px+2,py+1,60,1)}
 for(let i=0;i<80000;i++){x.globalAlpha=.12;x.fillStyle=rand()>.5?'#ffedbd':'#63543f';x.fillRect(rand()*1024,rand()*1024,1+rand()*2,1)}x.globalAlpha=1;
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t
}
function pyramidGeometry(size:number,height:number,rows=64){
 const g=new THREE.BufferGeometry(),v:number[]=[],uv:number[]=[];
 const add=(a:number[],b:number[],c:number[],d:number[],lo:number,hi:number)=>{v.push(...a,...d,...b,...b,...d,...c);uv.push(0,lo,1,lo,0,hi,0,hi,1,lo,1,hi)};
 for(let row=0;row<rows;row++){const lo=row/rows,hi=(row+1)/rows;const a=size/2*(1-lo),b=size/2*(1-hi)+.009;const y=lo*height,Y=hi*height;
 add([-a,y,a],[-b,Y,b],[b,Y,b],[a,y,a],lo,hi);add([a,y,a],[b,Y,b],[b,Y,-b],[a,y,-a],lo,hi);add([a,y,-a],[b,Y,-b],[-b,Y,-b],[-a,y,-a],lo,hi);add([-a,y,-a],[-b,Y,-b],[-b,Y,b],[-a,y,a],lo,hi);
 }
 g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.computeVertexNormals();return g
}
export function Pyramid(){
 const textures=useMemo(()=>[makeStoneTexture(),makeStoneTexture(true)],[]);const forms=useMemo(()=>[{p:[0,0,0],s:7.68,h:4.87},{p:[-12,0,-12],s:7.2,h:4.77},{p:[10,0,8],s:3.55,h:2.17}].map(a=>({...a,g:pyramidGeometry(a.s,a.h)})),[])
 return <group>{forms.map((a,i)=><group key={i} position={a.p as [number,number,number]}><mesh geometry={a.g} castShadow receiveShadow><meshStandardMaterial map={textures[i===2?1:0]} bumpMap={textures[i===2?1:0]} bumpScale={.055} color="#f3dfb9" roughness={.98}/></mesh>{i===1&&<mesh position={[0,a.h*.81,0]} geometry={pyramidGeometry(a.s*.19+.01,a.h*.19,1)}><meshStandardMaterial color="#f6ebd1" roughness={1} polygonOffset polygonOffsetFactor={-3} polygonOffsetUnits={-3}/></mesh>}</group>)}</group>
}
