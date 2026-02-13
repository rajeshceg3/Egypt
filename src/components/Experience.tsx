'use client'

import React, { Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PerspectiveCamera, Sky, Stars, ContactShadows, Sparkles, Environment } from '@react-three/drei'
import { EffectComposer, Bloom, Noise, Vignette, ToneMapping } from '@react-three/postprocessing'
import { Pyramid } from './Pyramid'
import { Terrain } from './Terrain'
import { HeatHaze } from './HeatHaze'
import * as THREE from 'three'
import { ToneMappingMode } from 'postprocessing'

function CameraRig() {
  useFrame((state) => {
    const t = state.clock.elapsedTime
    const mouse = state.pointer

    // Gentle orbital sway with heavier damping ("Ultrathink" weight)
    // Base position: [20, 6, 20]
    // We use a very low lerp factor to simulate the mass of a physical camera

    // Target position based on mouse (Parallax)
    const targetX = 20 + mouse.x * 2.5
    const targetZ = 20 + mouse.y * 2.5

    // ULTRATHINK: Organic Breathing & Handheld Drift
    // Instead of a perfect sine wave, we use a compound wave to simulate
    // the complex, non-linear nature of human breathing (Inhale-Pause-Exhale)
    // exp(sin(t)) gives a sharper rise (inhale) and slower fall (exhale)
    // Frequency: 0.1 Hz (6 breaths/min) = 2PI * 0.1 ~= 0.628 rad/s
    const breathY = (Math.exp(Math.sin(t * 0.628)) - 2.0) * 0.15;

    // Add subtle low-frequency drift (handheld sensation)
    const driftX = Math.sin(t * 0.05) * 0.5 + Math.sin(t * 0.12) * 0.2;
    const driftZ = Math.cos(t * 0.07) * 0.5 + Math.cos(t * 0.15) * 0.2;

    // Apply smooth dampening
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetX + driftX, 0.01)
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, targetZ + driftZ, 0.01)
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, 6 + breathY, 0.01)

    // Ensure camera always focuses on the majesty of the pyramids
    state.camera.lookAt(0, 2.5, 0)
  })
  return null
}

export function Experience() {
  return (
    <div className="fixed inset-0 bg-[#E6C288]">
      <Canvas shadows dpr={[1, 2]}>
        {/* Fallback background color matching the fog/sky */}
        <color attach="background" args={['#E6C288']} />

        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[20, 6, 20]} fov={45} />

          <CameraRig />

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

          {/* Atmospheric Dust - Layer 1: Background (Distant Haze) */}
          <Sparkles
            count={2000}
            scale={[100, 40, 100]}
            size={2}
            speed={0.2}
            opacity={0.3}
            color="#FFD700"
            position={[0, 20, 0]}
          />

          {/* Atmospheric Dust - Layer 2: Midground (Drifting Sand) */}
          <Sparkles
            count={500}
            scale={[40, 20, 40]}
            size={5}
            speed={0.4}
            opacity={0.5}
            color="#FFD700"
            position={[0, 10, 0]}
          />

          {/* Atmospheric Dust - Layer 3: Foreground (Near Camera Details) */}
          <Sparkles
            count={100}
            scale={[20, 10, 20]}
            size={8}
            speed={0.8}
            opacity={0.8}
            color="#FFF" // Slightly brighter for near particles
            position={[0, 5, 0]}
          />

          {/* Exponential fog for realistic depth fade */}
          <fogExp2 attach="fog" args={['#E6C288', 0.02]} />

          {/* Lighting */}
          <ambientLight intensity={0.2} />
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
    </div>
  )
}
