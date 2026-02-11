'use client'

import React, { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function Pyramid() {
  // Accurate Giza Proportions (Scaled)
  // Scale: 1 unit = ~30m

  const uniforms = useMemo(() => ({
    uTime: { value: 0 }
  }), [])

  useFrame((state) => {
    uniforms.uTime.value = state.clock.getElapsedTime()
  })

  const pyramidMaterial = useMemo(() => {
    const material = new THREE.MeshStandardMaterial({
      color: "#E8C690",
      roughness: 0.9,
      metalness: 0.1,
      flatShading: true,
    })

    material.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = uniforms.uTime

      // Add stone texture via noise
      shader.fragmentShader = `
        uniform float uTime;
        varying vec3 vPos;
        varying vec3 vWorldPos;
        varying vec3 vCustomNormal;

        // --- SHARED GLOBALS ---
        float gSandMix;
        float gSparkle;
        float gTotalSand;
        float gMortar;
        float gNoiseGrain;

        float random(vec2 st) {
            return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
        }

        float noise(vec2 st) {
            vec2 i = floor(st);
            vec2 f = fract(st);
            float a = random(i);
            float b = random(i + vec2(1.0, 0.0));
            float c = random(i + vec2(0.0, 1.0));
            float d = random(i + vec2(1.0, 1.0));
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        }

        ${shader.fragmentShader}
      `

      shader.vertexShader = `
        varying vec3 vPos;
        varying vec3 vWorldPos;
        varying vec3 vCustomNormal;
        ${shader.vertexShader}
      `

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        vPos = position;
        vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
        vCustomNormal = normalize(normalMatrix * normal);
        `
      )

      // Inject Normal Map Logic (Micro-Surface Detail)
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <normal_fragment_maps>',
        `
        #include <normal_fragment_maps>

        // --- ULTRATHINK: STONE SURFACE DETAIL ---
        float stoneH = noise(vPos.xy * 200.0) * 0.5 + noise(vPos.yz * 200.0) * 0.5;
        vec3 stoneBump = vec3(dFdx(stoneH), dFdy(stoneH), 0.0);
        normal = normalize(normal + stoneBump * 0.4);
        `
      )

      // --- CENTRAL CALCULATION LOGIC ---
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <clipping_planes_fragment>',
        `
        #include <clipping_planes_fragment>

        // 1. Sand Noise Shared
        float sandNoiseShared = noise(vWorldPos.xz * 0.5);
        float sandThresholdShared = 1.0 + sandNoiseShared * 1.5;
        gSandMix = smoothstep(sandThresholdShared, 0.0, vWorldPos.y);

        // 2. Sparkles
        vec3 viewDir = normalize(-vViewPosition);
        vec2 sparkleUv = vWorldPos.xz * 2.0 + viewDir.xy * 0.1;
        float sparkleNoise = random(sparkleUv * 50.0);
        gSparkle = step(0.995, sparkleNoise);
        gSparkle *= step(0.5, gSandMix);

        // Fresnel boost (Using vCustomNormal as proxy)
        // We use vCustomNormal (smooth view space normal) because 'normal' isn't ready.
        float fresnel = pow(1.0 - abs(dot(viewDir, vCustomNormal)), 3.0);
        gSparkle *= (0.5 + 2.0 * fresnel);

        // 3. Mortar Calculation
        gNoiseGrain = noise(vPos.xy * 20.0);
        float layerHeight = 0.15;
        float layerWarp = noise(vPos.xz * 1.0) * 0.05 + noise(vPos.yz * 0.5) * 0.02;
        float layerPos = vPos.y + layerWarp;
        float layerIndex = floor(layerPos / layerHeight);
        float layerProgress = fract(layerPos / layerHeight);

        float edgeNoise = noise(vPos.xy * 20.0) * 0.1;
        float hGap = smoothstep(0.90 - edgeNoise, 1.0, layerProgress) + smoothstep(0.1 + edgeNoise, 0.0, layerProgress);

        float faceCoord = vPos.x + vPos.z;
        float verticalWarp = noise(vPos.yz * 5.0) * 0.05;
        float blockWidth = 0.4 + noise(vec2(layerIndex, 0.0)) * 0.15;
        float blockPhase = (faceCoord + verticalWarp + layerIndex * 12.34) / blockWidth;
        float vGap = smoothstep(0.90 - edgeNoise, 1.0, fract(blockPhase));

        gMortar = max(hGap, vGap);
        float erosion = noise(vPos.xy * 15.0);
        gMortar += erosion * 0.4 * gMortar;
        gMortar = clamp(gMortar, 0.0, 1.0);

        // 4. Total Sand
        float ledgeSand = smoothstep(0.25, 0.0, layerProgress);
        ledgeSand *= step(0.35, noise(vPos.xz * 10.0 + uTime * 0.05));
        float creviceSand = gMortar * 0.5 * step(0.5, gSandMix + 0.5);

        gTotalSand = clamp(gSandMix + ledgeSand * 0.5 + creviceSand, 0.0, 1.0);
        `
      )

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <begin_fragment>',
        `
        #include <begin_fragment>

        vec3 baseColor = diffuseColor.rgb;
        vec3 mortarColor = baseColor * 0.25;
        float stoneGrain = 0.9 + 0.2 * gNoiseGrain;

        diffuseColor.rgb = mix(baseColor * stoneGrain, mortarColor, gMortar * 0.7);

        vec3 sandColor = vec3(0.90, 0.76, 0.53);
        diffuseColor.rgb = mix(diffuseColor.rgb, sandColor, gTotalSand * 0.9);
        `
      )

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <roughnessmap_fragment>',
        `
        #include <roughnessmap_fragment>

        roughnessFactor = 0.7 + 0.3 * gMortar;
        roughnessFactor = mix(roughnessFactor, 1.0, gTotalSand);

        if (gSparkle > 0.5 && gTotalSand > 0.1) {
            roughnessFactor = 0.0;
        }
        `
      )

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <emissivemap_fragment>',
        `
        #include <emissivemap_fragment>
        if (gSparkle > 0.5 && gTotalSand > 0.1) {
            totalEmissiveRadiance += vec3(1.0, 0.9, 0.6) * 3.0;
        }
        `
      )
    }

    return material
  }, [uniforms])

  return (
    <group>
      {/* Khufu (Center) */}
      <mesh
        position={[0, 4.87 / 2, 0]}
        rotation={[0, Math.PI / 4, 0]}
        castShadow
        receiveShadow
        material={pyramidMaterial}
      >
        <cylinderGeometry args={[0, 5.66, 4.87, 4, 1]} />
      </mesh>

      {/* Khafre (Back Left) */}
      <mesh
        position={[-12, 4.77 / 2, -12]}
        rotation={[0, Math.PI / 4, 0]}
        castShadow
        receiveShadow
        material={pyramidMaterial}
      >
        <cylinderGeometry args={[0, 5.1, 4.77, 4, 1]} />
      </mesh>

      {/* Menkaure (Front Right) */}
      <mesh
        position={[10, 2.17 / 2, 8]}
        rotation={[0, Math.PI / 4, 0]}
        castShadow
        receiveShadow
        material={pyramidMaterial}
      >
        <cylinderGeometry args={[0, 2.4, 2.17, 4, 1]} />
      </mesh>
    </group>
  )
}
