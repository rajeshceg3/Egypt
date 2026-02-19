'use client'

import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerspectiveCamera, Sky, Stars, ContactShadows, Sparkles, Environment } from '@react-three/drei'
import { EffectComposer, Bloom, Noise, Vignette, ToneMapping } from '@react-three/postprocessing'
import { Pyramid } from './Pyramid'
import { Terrain } from './Terrain'
import { HeatHaze } from './HeatHaze'
import { Navigation } from './Navigation'
import { ToneMappingMode } from 'postprocessing'
import { GuidedTour } from './GuidedTour'

export function Experience() {
  return (
    <div className="fixed inset-0 bg-[#E6C288]">
      <Canvas shadows dpr={[1, 2]}>
        {/* Fallback background color matching the fog/sky */}
        <color attach="background" args={['#E6C288']} />

        <Suspense fallback={null}>
          {/* Camera is now managed by Navigation, but we need a default one initially */}
          <PerspectiveCamera makeDefault position={[20, 6, 20]} fov={45} />

          <Navigation />

          {/* Environment - Sunset preset for warm, golden hour reflections */}
          <Environment preset="sunset" />

          {/* Dynamic Sky for background gradient */}
          <Sky
            distance={450000}
            sunPosition={[100, 10, 100]} // Lower sun for golden hour
            inclination={0.1}
            azimuth={0.25}
            mieCoefficient={0.005}
            mieDirectionalG={0.7}
            rayleigh={3}
          />

          <Stars
            radius={100}
            depth={50}
            count={5000}
            factor={4}
            saturation={0}
            fade
            speed={0.5}
          />

          {/* Atmospheric Dust - Ultrathink: Directional Wind Flow */}
          {/* We rotate the volume to make particles flow along the wind vector (tilted up/right) */}
          <group rotation={[0, 0, -Math.PI / 6]}>
            {/* Layer 1: Background (Distant Haze) */}
            <Sparkles
              count={2000}
              scale={[120, 40, 120]} // Extended to cover rotation
              size={2}
              speed={0.4} // Faster for wind
              opacity={0.3}
              color="#FFD700"
              position={[0, 20, 0]}
            />

            {/* Layer 2: Midground (Drifting Sand) */}
            <Sparkles
              count={500}
              scale={[50, 20, 50]}
              size={5}
              speed={0.8}
              opacity={0.5}
              color="#FFD700"
              position={[0, 10, 0]}
            />

            {/* Layer 3: Foreground (High Velocity Gusts) */}
            <Sparkles
              count={150}
              scale={[30, 10, 30]}
              size={8}
              speed={1.5} // High speed for "in your face" tactile feel
              opacity={0.8}
              color="#FFF"
              position={[0, 5, 0]}
            />
          </group>

          {/* Exponential fog for realistic depth fade */}
          <fogExp2 attach="fog" args={['#E6C288', 0.02]} />

          {/* Lighting */}
          <ambientLight intensity={0.2} />
          {/* ULTRATHINK: Hemisphere Light for Ground Bounce (Golden Hour + Sand Reflection) */}
          {/* Simulates light bouncing off the warm sand into the shadows */}
          <hemisphereLight args={['#FFD700', '#E6C288', 0.3]} />

          <directionalLight
            position={[50, 20, 10]} // Matching sun position roughly
            intensity={2.5}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-bias={-0.0001}
            color="#FFD700"
          />

          <Pyramid />
          <Terrain />

          {/* Shadows for groundedness */}
          <ContactShadows
            position={[0, 0, 0]} // Just above terrain
            opacity={0.4}
            scale={80}
            blur={3}
            far={10}
            color="#3d2a15"
          />

          {/* Post Processing */}
          <EffectComposer enableNormalPass={false}>
            <Bloom
              luminanceThreshold={0.5}
              luminanceSmoothing={0.9}
              height={300}
              intensity={0.5}
              mipmapBlur
            />
            <HeatHaze strength={0.002} />
            <Noise opacity={0.03} />
            <Vignette eskil={false} offset={0.2} darkness={0.9} />
            <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
          </EffectComposer>
        </Suspense>
      </Canvas>
      <GuidedTour />
    </div>
  )
}
