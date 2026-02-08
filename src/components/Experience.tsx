'use client'

import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Sky, Stars, ContactShadows, Sparkles } from '@react-three/drei'
import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing'
import { Pyramid } from './Pyramid'

export function Experience() {
  return (
    <div className="fixed inset-0 bg-[#E6C288]">
      <Canvas shadows dpr={[1, 2]}>
        {/* Fallback background color matching the fog/sky */}
        <color attach="background" args={['#E6C288']} />

        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[20, 5, 20]} fov={45} />
          <OrbitControls
            enablePan={false}
            minDistance={10}
            maxDistance={50}
            maxPolarAngle={Math.PI / 2.1}
            autoRotate
            autoRotateSpeed={0.5}
          />

          {/* Environment - Using Sky instead of HDRI for reliability/performance */}
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
            count={800}
            scale={[40, 40, 40]}
            size={4}
            speed={0.4}
            opacity={0.6}
            color="#FFF"
          />
          <fog attach="fog" args={['#E6C288', 8, 60]} />

          {/* Lighting */}
          <ambientLight intensity={0.6} />
          <directionalLight
            position={[10, 20, 10]}
            intensity={2}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-bias={-0.0001}
          />

          <Pyramid />

          <ContactShadows
            position={[0, 0, 0]}
            opacity={0.6}
            scale={60}
            blur={2.5}
            far={10}
            color="#8B5E3C"
          />

          {/* Post Processing */}
          <EffectComposer enableNormalPass={false}>
            <Bloom luminanceThreshold={0.6} luminanceSmoothing={0.9} height={300} intensity={0.4} />
            <Noise opacity={0.02} />
            <Vignette eskil={false} offset={0.1} darkness={1.1} />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  )
}
