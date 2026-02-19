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
    // ULTRATHINK: Use performance.now() for global synchronization with Audio
    const t = performance.now() / 1000
    const mouse = state.pointer

    // Gentle orbital sway with heavier damping ("Ultrathink" weight)
    // Base position: [20, 6, 20]
    // We use a very low lerp factor to simulate the mass of a physical camera

    // Target position based on mouse (Parallax)
    const targetX = 20 + mouse.x * 2.5
    const targetZ = 20 + mouse.y * 2.5

    // ULTRATHINK: Bio-Rhythmic Breathing (4-2-6-0 Cycle)
    // Shifted to Exhale-Focused Rhythm for Parasympathetic Activation
    // Inhale (4s) -> Hold (2s) -> Exhale (6s) -> Pause (0s)
    // Total Cycle: 12s (0.083 Hz)
    // SYNC: Must match AudioAmbience.tsx (12s cycle)
    const cycle = (t % 12.0) / 12.0;
    let breathPhase = 0;

    if (cycle < 0.3333) {
        // Inhale (0s - 4s) [33% of cycle]
        // Smooth sine rise (0 -> 1)
        breathPhase = Math.sin((cycle / 0.3333) * Math.PI * 0.5);
    } else if (cycle < 0.5) {
        // Hold (4s - 6s) [17% of cycle]
        // Stay at peak (1)
        breathPhase = 1.0;
    } else {
        // Exhale (6s - 12s) [50% of cycle]
        // Cosine fall (1 -> 0) - Long, slow release for relaxation
        breathPhase = Math.cos(((cycle - 0.5) / 0.5) * Math.PI * 0.5);
    }

    // Ultrathink: Natural Amplitude Modulation
    // Real breathing depth varies over time (calm vs deep).
    // Modulate between 0.1 and 0.2 units
    const breathAmp = 0.15 + Math.sin(t * 0.05) * 0.05;
    const breathY = breathPhase * breathAmp;

    // Add subtle low-frequency drift (handheld sensation)
    const driftX = Math.sin(t * 0.05) * 0.5 + Math.sin(t * 0.12) * 0.2;
    const driftZ = Math.cos(t * 0.07) * 0.5 + Math.cos(t * 0.15) * 0.2;

    // Apply smooth dampening
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetX + driftX, 0.01)
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, targetZ + driftZ, 0.01)
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, 6 + breathY, 0.01)

    // Ensure camera always focuses on the majesty of the pyramids
    state.camera.lookAt(0, 2.5, 0)

    // Ultrathink: Micro-Rotational Drift (Handheld feel)
    // Applied AFTER lookAt to layer a subtle imperfection on top of the perfect focus.
    // This creates a subconscious sense that the camera is "held" by a living being.
    // Increased slightly to feel more organic.

    // Added "Muscle Tremor" - slightly faster, very low amplitude noise
    const muscleTremor = Math.sin(t * 0.5) * 0.0005 + Math.cos(t * 0.3) * 0.0005;

    // ULTRATHINK: Subtle Heartbeat (1Hz - Lub-Dub)
    // "Lub-Dub" pattern: Double peak for biological realism
    const beatPhase = (t % 1.0); // 1 beat per second
    // Primary beat (Lub) + Secondary beat (Dub) delayed by 0.2s
    const beat = (Math.exp(-beatPhase * 10.0) + 0.6 * Math.exp(-(beatPhase - 0.2) * 10.0) * (beatPhase >= 0.2 ? 1.0 : 0.0)) * 0.0002;

    state.camera.rotation.z += Math.sin(t * 0.12) * 0.002 + Math.cos(t * 0.04) * 0.001 + muscleTremor + beat; // Roll
    state.camera.rotation.x += Math.sin(t * 0.09) * 0.001 + muscleTremor * 0.5; // Pitch
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
    </div>
  )
}
