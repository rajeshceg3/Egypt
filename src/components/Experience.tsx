'use client'

import React, { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PerspectiveCamera, Sky, Stars, ContactShadows, Sparkles, Environment } from '@react-three/drei'
import { EffectComposer, Bloom, Noise, Vignette, ToneMapping } from '@react-three/postprocessing'
import { Pyramid } from './Pyramid'
import { Terrain } from './Terrain'
import { HeatHaze } from './HeatHaze'
import * as THREE from 'three'
import { ToneMappingMode } from 'postprocessing'

function CameraRig({
  tourTargetPosition = [20, 6, 20],
  tourTargetLookAt = [0, 2.5, 0]
}: {
  tourTargetPosition?: [number, number, number],
  tourTargetLookAt?: [number, number, number]
}) {
  const currentBasePos = useRef(new THREE.Vector3(20, 6, 20))
  const currentBaseLook = useRef(new THREE.Vector3(0, 2.5, 0))
  const targetPosVector = useRef(new THREE.Vector3())
  const targetLookVector = useRef(new THREE.Vector3())

  useFrame((state) => {
    // ULTRATHINK: Use performance.now() for global synchronization with Audio
    const t = performance.now() / 1000

    // Smoothly interpolate the base camera position/lookAt to the tour target
    // Optimization: Reuse vectors to avoid garbage collection
    targetPosVector.current.set(...tourTargetPosition)
    targetLookVector.current.set(...tourTargetLookAt)

    currentBasePos.current.lerp(targetPosVector.current, 0.02)
    currentBaseLook.current.lerp(targetLookVector.current, 0.02)

    const mouse = state.pointer

    // Gentle orbital sway with heavier damping ("Ultrathink" weight)
    // We use a very low lerp factor to simulate the mass of a physical camera

    // Target position based on mouse (Parallax) - Now relative to interpolated base
    const targetX = currentBasePos.current.x + mouse.x * 2.5
    const targetY = currentBasePos.current.y
    const targetZ = currentBasePos.current.z + mouse.y * 2.5

    // ULTRATHINK: Bio-Rhythmic Breathing (4-Phase Cycle)
    // Slower, deeper cycle for maximum relaxation
    // Inhale (4s) -> Hold (2s) -> Exhale (4s) -> Pause (2s)
    // Total Cycle: 12s (0.083 Hz)
    const cycle = (t % 12.0) / 12.0;
    let breathPhase = 0;
    if (cycle < 0.333) { // Inhale (4s) - Smooth sine rise
        breathPhase = Math.sin((cycle / 0.333) * Math.PI * 0.5);
    } else if (cycle < 0.5) { // Hold (2s) - Stay at peak
        breathPhase = 1.0;
    } else if (cycle < 0.833) { // Exhale (4s) - Cosine fall
        breathPhase = Math.cos(((cycle - 0.5) / 0.333) * Math.PI * 0.5);
    } else { // Pause (2s) - Stay at bottom
        breathPhase = 0.0;
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
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetY + breathY, 0.01)

    // Ensure camera always focuses on the majesty of the pyramids (interpolated target)
    state.camera.lookAt(currentBaseLook.current)

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

interface ExperienceProps {
  tourTargetPosition?: [number, number, number]
  tourTargetLookAt?: [number, number, number]
}

export function Experience({ tourTargetPosition, tourTargetLookAt }: ExperienceProps) {
  return (
    <div className="fixed inset-0 bg-[#E6C288]">
      <Canvas shadows dpr={[1, 2]}>
        {/* Fallback background color matching the fog/sky */}
        <color attach="background" args={['#E6C288']} />

        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[20, 6, 20]} fov={45} />

          <CameraRig tourTargetPosition={tourTargetPosition} tourTargetLookAt={tourTargetLookAt} />

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
