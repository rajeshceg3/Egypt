'use client'

import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function Pyramid() {
  const meshRef = useRef<THREE.Mesh>(null)

  // Subtle rotation for some life
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.05
    }
  })

  return (
    <group>
      {/* Main Pyramid */}
      <mesh ref={meshRef} position={[0, 2.5, 0]} castShadow receiveShadow>
        <coneGeometry args={[5, 5, 4]} />
        <meshStandardMaterial
          color="#d4af37"
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>

      {/* Distant Pyramid 1 */}
      <mesh position={[-15, 1.5, -10]} castShadow receiveShadow>
        <coneGeometry args={[3, 3, 4]} />
        <meshStandardMaterial color="#c5a028" roughness={0.9} />
      </mesh>

      {/* Distant Pyramid 2 */}
      <mesh position={[20, 1, -15]} castShadow receiveShadow>
        <coneGeometry args={[2, 2, 4]} />
        <meshStandardMaterial color="#b89524" roughness={0.9} />
      </mesh>

      {/* Ground/Sand */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#c2b280" roughness={1} />
      </mesh>
    </group>
  )
}
