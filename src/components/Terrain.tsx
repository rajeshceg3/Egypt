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
      varying vec2 vCustomUv;
      varying vec3 vWorldPos;

      // Simplex 2D noise
      vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

      float snoise(vec2 v){
        const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                 -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod(i, 289.0);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
        + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m ;
        m = m*m ;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      // FBM for Organic Dunes
      float fbm(vec2 x) {
          float v = 0.0;
          float a = 0.5;
          vec2 shift = vec2(100.0);
          mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
          for (int i = 0; i < 5; ++i) { // 5 Octaves for richness
              v += a * snoise(x);
              x = rot * x * 2.0 + shift;
              a *= 0.5;
          }
          return v;
      }

      ${shader.vertexShader}
    `

    // Replace the begin_vertex chunk to add displacement
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      vCustomUv = uv;
      vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;

      // 1. Large rolling dunes (Low frequency)
      float largeDunes = snoise(position.xy * 0.005) * 3.0;

      // 2. Medium details (FBM)
      float details = fbm(position.xy * 0.02) * 1.0;

      // 3. Wind ripples (High frequency, directional)
      // ANIMATION: Move ripples with time
      float rippleSpeed = 0.2;
      vec2 ripplePos = position.xy + vec2(uTime * rippleSpeed, uTime * rippleSpeed * 0.5);
      float ripples = sin((ripplePos.x * 0.8 + ripplePos.y * 0.2) * 2.0) * 0.2;

      // 4. Heat Haze (Vertex Wiggle) - Reduced intensity as we now use Post-Processing
      float heat = sin(position.x * 10.0 + uTime * 5.0) * sin(position.y * 10.0 + uTime * 3.0) * 0.005;

      // Combine
      float elevation = largeDunes + details + ripples + heat;

      // Apply to Z (Up)
      transformed.z += elevation;
      `
    )

    // FRAGMENT SHADER: Sand Sparkles
    shader.fragmentShader = `
      uniform float uTime;
      varying vec2 vCustomUv;
      varying vec3 vWorldPos;

      // Psuedo-random function
      float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
      }

      ${shader.fragmentShader}
    `

    // Define sparkle logic early so it's scoped for the whole main()
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <begin_fragment>',
      `
      #include <begin_fragment>

      // --- VIEW DEPENDENT SPARKLES ---
      // 1. Get View Direction (in view space)
      // vViewPosition is standard in MeshStandardMaterial
      vec3 viewDir = normalize(-vViewPosition);

      // 2. Add view-dependent noise
      // We offset the texture coordinate slightly based on view angle
      // This simulates micro-facets changing with perspective
      vec2 sparkleUv = vCustomUv * 1200.0 + viewDir.xy * 2.5;
      float sparkleNoise = random(sparkleUv);

      // 3. Threshold: Only a tiny fraction of grains (0.5%) align perfectly
      float sparkle = step(0.995, sparkleNoise);
      `
    )

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <roughnessmap_fragment>',
      `
      #include <roughnessmap_fragment>

      // Base grain texture
      float grain = random(vCustomUv * 500.0);

      // Mix grain into roughness
      roughnessFactor = 0.8 + grain * 0.2;

      // Apply Sparkle to Roughness (0.0 = perfect mirror)
      if (sparkle > 0.5) {
        roughnessFactor = 0.0;
      }
      `
    )

    // Inject sparkle color into emissive
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      `
      #include <emissivemap_fragment>

      // Add slight emissive glint for strong sparkles
      // This ensures they pop even if the PBR specular is subtle
      if (sparkle > 0.5) {
        // Gold/White glint
        totalEmissiveRadiance += vec3(1.0, 0.9, 0.6) * 2.0;
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
