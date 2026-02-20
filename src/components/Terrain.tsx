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
      vec3 permute_terrain(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

      float snoise_terrain(vec2 v){
        const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                 -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod(i, 289.0);
        vec3 p = permute_terrain( permute_terrain( i.y + vec3(0.0, i1.y, 1.0 ))
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
      float fbm_terrain(vec2 x) {
          float v = 0.0;
          float a = 0.5;
          vec2 shift = vec2(100.0);
          mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
          for (int i = 0; i < 5; ++i) { // 5 Octaves for richness
              v += a * snoise_terrain(x);
              x = rot * x * 2.0 + shift;
              a *= 0.5;
          }
          return v;
      }

      // Domain Warped FBM (Twisting the dunes)
      float fbm_warp_terrain(vec2 x) {
          vec2 q = vec2(fbm_terrain(x), fbm_terrain(x + vec2(5.2, 1.3)));
          return fbm_terrain(x + q * 0.5);
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

      // 1. Large twisted dunes (Organic Domain Warping)
      float largeDunes = fbm_warp_terrain(position.xy * 0.005) * 5.0;

      // 2. Medium details (FBM)
      float details = fbm_terrain(position.xy * 0.02) * 1.0;

      // Combine
      float elevation = largeDunes + details;

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
      float random_terrain(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
      }

      // Simplex 2D noise
      vec3 permute_terrain(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
      float snoise_terrain(vec2 v){
        const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                 -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod(i, 289.0);
        vec3 p = permute_terrain( permute_terrain( i.y + vec3(0.0, i1.y, 1.0 ))
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

      // FBM for Micro-Details
      float fbm_micro(vec2 x) {
          float v = 0.0;
          float a = 0.5;
          for (int i = 0; i < 3; ++i) {
              v += a * snoise_terrain(x);
              x = x * 2.0;
              a *= 0.5;
          }
          return v;
      }

      ${shader.fragmentShader}
    `

    // Inject Variables at Start of Main
    shader.fragmentShader = shader.fragmentShader.replace(
      'void main() {',
      `
      void main() {
        // --- VIEW DEPENDENT SPARKLES ---
        vec3 viewDir = normalize(cameraPosition - vWorldPos);
        vec2 sparkleUv = vCustomUv * 1200.0 + viewDir.xy * 2.5;
        float sparkleNoise = random_terrain(sparkleUv);
        float sparkle = step(0.995, sparkleNoise);

        // Chromatic Aberration
        vec3 sparkleTint = vec3(1.0, 0.9, 0.6); // Base Gold
        float prismNoise = random_terrain(vWorldPos.xz * 100.0);
        if (prismNoise > 0.6) {
            sparkleTint = vec3(
               0.5 + 0.5 * sin(prismNoise * 10.0),
               0.5 + 0.5 * sin(prismNoise * 20.0 + 2.0),
               0.5 + 0.5 * sin(prismNoise * 30.0 + 4.0)
            ) * 2.0;
            // Ultrathink: Enhanced Jewel Tones (Cyan/Magenta/Purple)
            sparkleTint += vec3(
                0.4 * sin(prismNoise * 20.0),
                0.2 * cos(prismNoise * 15.0),
                0.4 * sin(prismNoise * 10.0 + 2.0)
            );
        }
      `
    )

    // Inject Normal Map Logic (Micro-Detail)
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <normal_fragment_maps>',
      `
      #include <normal_fragment_maps>

      // --- ULTRATHINK: PROCEDURAL NORMAL MAPPING ---
      // 1. Micro-Grain (Sand Texture) - Using continuous noise for safe derivatives
      float sandH = snoise_terrain(vWorldPos.xz * 200.0);

      // 2. Wind Ripples (Fragment Shader = Infinite Resolution)
      // Directional movement
      float rippleSpeed = 0.4;
      vec2 ripplePos = vWorldPos.xz + vec2(uTime * rippleSpeed * 0.5, uTime * rippleSpeed * 0.2);

      // Organic Warping
      float rippleWarp = snoise_terrain(vWorldPos.xz * 0.2);

      // Sine wave pattern (Frequency 15.0 = ~0.4m wavelength)
      // Ultrathink: Sharper crests using power function (Asymmetric dunes)
      // Increased power from 3.0 to 4.0 for sharper crests
      float wavePhase = (ripplePos.x * 0.7 + ripplePos.y * 0.3 + rippleWarp * 0.5) * 15.0;
      float rippleBase = sin(wavePhase);
      float ripple1 = pow(rippleBase * 0.5 + 0.5, 4.0);

      // ULTRATHINK: Avalanche Physics (Slip Face)
      // Detect the leeward slope (where the wave is falling)
      // The derivative of sin(x) is cos(x). If cos(x) is negative, we are on the downslope.
      // We use smoothstep to isolate the steepest part of the lee side.
      float slopeCheck = cos(wavePhase);
      float avalancheMask = smoothstep(0.3, -0.6, slopeCheck);

      // Add high-frequency "sliding grain" noise only on the slip face
      // We animate this noise slightly downwards (uTime) to simulate gravity/flow
      // Ultrathink: Faster flow (1.5x) for fluid sand effect
      float slideNoise = snoise_terrain(vWorldPos.xz * 150.0 + vec2(uTime * 1.5, uTime * 0.8));
      float avalanche = avalancheMask * slideNoise * 0.04; // Increased intensity for visible flow

      // Secondary interference pattern (crossing waves) - Simulates changing wind
      float wavePhase2 = (ripplePos.x * 0.4 - ripplePos.y * 0.8 + rippleWarp * 0.5) * 12.0 + 2.0;
      float ripple2 = pow(sin(wavePhase2) * 0.5 + 0.5, 4.0) * 0.5;

      float rippleH = (ripple1 + ripple2) * 0.6; // Boost height slightly

      // 3. Micro-Ripples (Ultrathink: 3rd Layer of Detail)
      // Very high frequency wind patterns
      float microRipples = fbm_micro(vWorldPos.xz * 80.0 + uTime * 0.1);

      // Combine: Grain is high freq, Ripples are mid freq, Micro is in between
      // ULTRATHINK: Subtract avalanche noise to simulate grains slipping *into* the surface
      float totalH = sandH * 0.05 + rippleH + microRipples * 0.02 - avalanche;

      // 3. Calculate derivative (screen-space)
      vec3 sandBump = vec3(dFdx(totalH), dFdy(totalH), 0.0);
      float localSlope = length(sandBump.xy);

      // ULTRATHINK: Avalanche Physics
      // If slope is steep (leeward side of ripples), add chaotic noise to simulate sliding sand grains
      float slide = smoothstep(0.02, 0.06, localSlope); // Tuned for ripple scale

      // Calculate sliding grain height field
      float slideNoiseH = fbm_micro(vWorldPos.xz * 300.0 + vec2(uTime * 0.2)); // Moving texture

      // Calculate derivative for correct normal perturbation
      vec3 slideBump = vec3(dFdx(slideNoiseH), dFdy(slideNoiseH), 0.0);

      // Add slide noise to bump (disrupting the smooth ripple surface)
      // Ultrathink: Increased contrast (10.0 -> 25.0) for visible avalanche physics
      sandBump += slideBump * slide * 25.0;

      // 4. Perturb normal (strength = 5.0 for defined ripples)
      normal = normalize(normal + sandBump * 5.0);
      `
    )

    // Inject Roughness
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <roughnessmap_fragment>',
      `
      #include <roughnessmap_fragment>

      // Base grain texture
        float grain = random_terrain(vCustomUv * 500.0);
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
      if (sparkle > 0.5) {
          totalEmissiveRadiance += sparkleTint * 2.0;
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
