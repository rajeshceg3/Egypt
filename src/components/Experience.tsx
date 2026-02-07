'use client'

import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Sky, Stars, Environment, ContactShadows, Sparkles } from '@react-three/drei'
import { Pyramid } from './Pyramid'

export function Experience() {
  return (
    <div className="fixed inset-0 bg-zinc-950">
      <Canvas shadows>
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[15, 10, 15]} fov={45} />
          <OrbitControls
            enablePan={false}
            minDistance={10}
            maxDistance={40}
            maxPolarAngle={Math.PI / 2.1}
            autoRotate
            autoRotateSpeed={0.5}
          />

          {/* Environment */}
          <Sky
            distance={450000}
            sunPosition={[10, 5, 10]}
            inclination={0}
            azimuth={0.25}
          />
          <Stars
            radius={100}
            depth={50}
            count={5000}
            factor={4}
            saturation={0}
            fade
            speed={1}
          />
          <Sparkles
            count={500}
            scale={[30, 30, 30]}
            size={5}
            speed={0.4}
            opacity={0.5}
            color="#d4af37"
          />
          <fog attach="fog" args={['#d4af37', 10, 70]} />

          {/* Lighting */}
          <ambientLight intensity={0.4} />
          <directionalLight
            position={[10, 10, 10]}
            intensity={1.5}
            castShadow
            shadow-mapSize={[2048, 2048]}
          />

          <Pyramid />

          <ContactShadows
            position={[0, 0, 0]}
            opacity={0.4}
            scale={20}
            blur={2}
            far={4.5}
          />

          <Environment preset="sunset" />
        </Suspense>
      </Canvas>
    </div>
  )
}
