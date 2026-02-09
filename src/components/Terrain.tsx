'use client'

import React, { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface Shader {
  uniforms: { [key: string]: { value: unknown } }
  vertexShader: string
  fragmentShader: string
}

export function Terrain() {
  const meshRef = useRef<THREE.Mesh>(null)

  // Custom shader for the sand to include:
  // 1. Dune displacement (Vertex)
  // 2. Sparkle/Grain (Fragment)
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new THREE.Color('#E6C288') },
    }),
    []
  )

  const onBeforeCompile = (shader: Shader) => {
    shader.uniforms.uTime = uniforms.uTime
    shader.uniforms.uColor = uniforms.uColor

    // VERTEX SHADER: Dune Displacement
    shader.vertexShader = `
      uniform float uTime;
      varying vec2 vUv2;
      ${shader.vertexShader}
    `

    // Replace the begin_vertex chunk to add displacement
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      vUv2 = uv;

      // Simple procedural dunes using sine waves
      float noise = sin(position.x * 0.05) * sin(position.y * 0.05) * 2.0;
      float largeDune = sin(position.x * 0.02 + position.y * 0.01) * 5.0;
      float detail = sin(position.x * 0.5) * sin(position.y * 0.5) * 0.2;

      // Combine
      float elevation = largeDune + noise + detail;

      // Apply to Z (which is Up because of rotation)
      transformed.z += elevation;
      `
    )

    // FRAGMENT SHADER: Sand Sparkles
    shader.fragmentShader = `
      uniform float uTime;
      varying vec2 vUv2;

      // Psuedo-random function
      float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
      }

      ${shader.fragmentShader}
    `

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <roughnessmap_fragment>',
      `
      #include <roughnessmap_fragment>

      // Generate static noise for sand grain
      float grain = random(vUv2 * 500.0); // High frequency noise

      // Generate sparkles (view dependent would be better, but static is okay for now)
      float sparkle = smoothstep(0.995, 1.0, random(vUv2 * 1000.0 + uTime * 0.1));

      // Mix grain into base color (implicit via map or color)
      // We modify roughness to simulate grain: darker spots are rougher
      roughnessFactor = 0.8 + grain * 0.2;

      // Sparkles make it super smooth/metallic in tiny spots
      if (sparkle > 0.5) {
        roughnessFactor = 0.0;
      }
      `
    )

    // Inject sparkle color into emissive or just keep it specular
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      `
      #include <emissivemap_fragment>

      // Add slight emissive glint for strong sparkles
      if (sparkle > 0.5) {
        totalEmissiveRadiance += vec3(0.5, 0.4, 0.2);
      }
      `
    )
  }

  useFrame((state) => {
    if (meshRef.current) {
       uniforms.uTime.value = state.clock.getElapsedTime()
    }
  })

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -2, 0]}
      receiveShadow
    >
      <planeGeometry args={[1000, 1000, 256, 256]} />
      <meshStandardMaterial
        color="#E6C288"
        roughness={0.9}
        metalness={0.1}
        onBeforeCompile={onBeforeCompile}
      />
    </mesh>
  )
}
