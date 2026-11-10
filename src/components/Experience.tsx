'use client'

import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerspectiveCamera, ContactShadows, } from '@react-three/drei'
import { Pyramid } from './Pyramid'
import { Terrain } from './Terrain'
import { Atmosphere } from './Atmosphere'
import { Dust } from './Dust'
import { Navigation } from './Navigation'

export function Experience({view,reset,paused}:{view:number,reset:number,paused:boolean}) {
  return (
    <div className="fixed inset-0 bg-[#E6C288]">
      <Canvas shadows dpr={[1, 1.5]} frameloop={paused ? "demand" : "always"} style={{width:"100%",height:"100%"}}>
        {/* Fallback background color matching the fog/sky */}
        <color attach="background" args={['#E6C288']} />

        <Suspense fallback={null}>
          {/* Camera is now managed by Navigation, but we need a default one initially */}
          <PerspectiveCamera makeDefault position={[20, 6, 20]} fov={45} />

          <Navigation view={view} reset={reset} />

          {/* Environment - Sunset preset for warm, golden hour reflections */}


          {/* Dynamic Sky for background gradient */}
          <Atmosphere />

          {/* Exponential fog for realistic depth fade */}
          <fogExp2 attach="fog" args={['#dec79f', 0.006]} />

          {/* Lighting */}
          <ambientLight intensity={0.65} />
          {/* ULTRATHINK: Hemisphere Light for Ground Bounce (Golden Hour + Sand Reflection) */}
          {/* Simulates light bouncing off the warm sand into the shadows */}
          <hemisphereLight args={['#c8e2ec', '#c3a57d', 0.7]} />

          <directionalLight
            position={[30, 24, -20]} // Matching sun position roughly
            intensity={2.2}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-bias={-0.001} shadow-normalBias={.08}
            shadow-camera-left={-35} shadow-camera-right={35} shadow-camera-top={35} shadow-camera-bottom={-35} shadow-camera-far={120}
            color="#fff0d0"
          />

          <Pyramid />
          <Terrain />
          <Dust />


          {/* Shadows for groundedness */}
          <ContactShadows
            position={[0, -.03, 0]} // Just above terrain
            opacity={0.4}
            scale={80}
            blur={3}
            far={10}
            color="#3d2a15"
            resolution={512}
            frames={1}
          />

        </Suspense>
      </Canvas>

    </div>
  )
}
