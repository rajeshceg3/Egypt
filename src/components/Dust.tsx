'use client'
import {useMemo,useRef} from 'react'
import {useFrame} from '@react-three/fiber'
import * as THREE from 'three'
export function Dust(){const ref=useRef<THREE.Points>(null);const positions=useMemo(()=>{const a=new Float32Array(270);for(let i=0;i<90;i++){a[i*3]=Math.sin(i*132.7)*45;a[i*3+1]=.6+((i*7)%40)/10;a[i*3+2]=Math.cos(i*42.1)*45}return a},[]);useFrame((state,delta)=>{const c=state.gl.domElement;c.dataset.frames=String(Number(c.dataset.frames||0)+1);if(ref.current)ref.current.position.x=(ref.current.position.x+Math.min(delta,.05)*.06)%5});return <points ref={ref}><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions,3]}/></bufferGeometry><pointsMaterial color="#ffefce" size={.018} transparent opacity={.22} depthWrite={false}/></points>}
