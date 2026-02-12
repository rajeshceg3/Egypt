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
        ${shader.vertexShader}
      `

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        vPos = position;
        vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
        `
      )

      // Inject shared logic (Sparkles & SandMix)
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <begin_fragment>',
        `
        #include <begin_fragment>

        // --- SAND ACCUMULATION LOGIC (Shared) ---
        // Sand piles up at the bottom (world Y < 1.5 roughly)
        float sandNoiseShared = noise(vWorldPos.xz * 0.5);
        float sandThresholdShared = 1.0 + sandNoiseShared * 1.5;
        float sandMix = smoothstep(sandThresholdShared, 0.0, vWorldPos.y);

        // --- VIEW DEPENDENT SPARKLES ---
        vec3 viewDir = normalize(-vViewPosition);
        // Use vWorldPos for sparkles to match terrain world space density
        vec2 sparkleUv = vWorldPos.xz * 2.0 + viewDir.xy * 0.1; // Slower movement on pyramid?
        float sparkleNoise = random(sparkleUv * 50.0); // Higher frequency
        float sparkle = step(0.995, sparkleNoise);

        // Mask sparkle by sand
        sparkle *= step(0.5, sandMix);
        `
      )

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <roughnessmap_fragment>',
        `
        #include <roughnessmap_fragment>

        // Procedural stone grain
        float noiseGrain = noise(vPos.xy * 20.0);

        // --- 1. Horizontal Stratification (Organic Layers) ---
        float layerHeight = 0.15;

        // ULTRATHINK: Domain Warping for ancient settling
        // We warp the coordinate space itself to simulate sagging heavy stones
        vec3 warpOffset = vec3(
            noise(vPos.yz * 1.5),
            noise(vPos.xz * 1.5),
            noise(vPos.xy * 1.5)
        ) * 0.1;

        float layerPos = vPos.y + warpOffset.y;
        float layerIndex = floor(layerPos / layerHeight);
        float layerProgress = fract(layerPos / layerHeight);

        // Edge Wear: Make the gap irregular
        float edgeNoise = noise(vPos.xy * 20.0) * 0.1;
        float hGap = smoothstep(0.90 - edgeNoise, 1.0, layerProgress) + smoothstep(0.1 + edgeNoise, 0.0, layerProgress);

        // --- 2. Vertical Cracks (Variable Width) ---
        float faceCoord = vPos.x + vPos.z; // Simple mapping
        float verticalWarp = noise(vPos.yz * 5.0) * 0.05;
        // Randomize block width per layer
        float blockWidth = 0.4 + noise(vec2(layerIndex, 0.0)) * 0.15;
        // Offset blocks per layer
        float blockPhase = (faceCoord + verticalWarp + layerIndex * 12.34) / blockWidth;
        float vGap = smoothstep(0.90 - edgeNoise, 1.0, fract(blockPhase));

        // --- 3. Combined Mortar/Erosion ---
        float mortar = max(hGap, vGap);
        float erosion = noise(vPos.xy * 15.0);
        mortar += erosion * 0.4 * mortar; // Widen cracks with erosion
        mortar = clamp(mortar, 0.0, 1.0);

        // --- LEDGE SAND ACCUMULATION ---
        // Sand accumulates on the "step" of the block below (layerProgress near 0.0)
        float ledgeSand = smoothstep(0.25, 0.0, layerProgress);
        // Break up the ledge sand so it's not a perfect line
        ledgeSand *= step(0.35, noise(vPos.xz * 10.0 + uTime * 0.05));

        // Combined Sand
        float totalSand = clamp(sandMix + ledgeSand * 0.5, 0.0, 1.0);

        // Apply Color
        vec3 baseColor = diffuseColor.rgb;
        vec3 mortarColor = baseColor * 0.25;
        float stoneGrain = 0.9 + 0.2 * noiseGrain;
        vec3 finalStoneColor = mix(baseColor * stoneGrain, mortarColor, mortar * 0.7);

        // --- WEATHERING GRADIENT (Ultrathink) ---
        // Ancient structures are darker at the base (moisture/shadows) and bleached at the top
        float heightGradient = smoothstep(0.0, 6.0, vWorldPos.y);
        vec3 sunBleach = vec3(1.1, 1.1, 1.05); // Top
        vec3 dampBase = vec3(0.7, 0.65, 0.6);  // Bottom

        vec3 weatherFactor = mix(dampBase, sunBleach, heightGradient);
        finalStoneColor *= weatherFactor;

        diffuseColor.rgb = finalStoneColor;

        // --- APPLY TOTAL SAND ---
        vec3 sandColor = vec3(0.90, 0.76, 0.53);
        diffuseColor.rgb = mix(diffuseColor.rgb, sandColor, totalSand * 0.9);

        // Roughness
        roughnessFactor = 0.7 + 0.3 * mortar;
        roughnessFactor = mix(roughnessFactor, 1.0, totalSand); // Sand is matte

        // Apply Sparkle
        if (sparkle > 0.5 && totalSand > 0.1) {
            roughnessFactor = 0.0;
        }
        `
      )

      // Emissive Sparkles
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <emissivemap_fragment>',
        `
        #include <emissivemap_fragment>
        if (sparkle > 0.5 && totalSand > 0.1) {
            totalEmissiveRadiance += vec3(1.0, 0.9, 0.6) * 2.0;
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
