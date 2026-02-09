'use client'

import React, { useMemo } from 'react'
import * as THREE from 'three'

export function Pyramid() {
  // Accurate Giza Proportions (Scaled)
  // Scale: 1 unit = ~30m

  const pyramidMaterial = useMemo(() => {
    const material = new THREE.MeshStandardMaterial({
      color: "#E8C690",
      roughness: 0.9,
      metalness: 0.1,
      flatShading: true,
    })

    material.onBeforeCompile = (shader) => {
      // Add stone texture via noise
      shader.fragmentShader = `
        varying vec3 vPosition;
        varying vec3 vWorldPosition;

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
        varying vec3 vPosition;
        varying vec3 vWorldPosition;
        ${shader.vertexShader}
      `

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        vPosition = position;
        vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
        `
      )

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <roughnessmap_fragment>',
        `
        #include <roughnessmap_fragment>

        // Procedural stone grain
        float noiseGrain = noise(vPosition.xy * 20.0);

        // 1. Horizontal Stratification (Layers of blocks)
        float layerHeight = 0.15;
        // Perturb layers slightly for age
        float layerWarp = noise(vPosition.xz * 2.0) * 0.02;
        float layerIndex = floor((vPosition.y + layerWarp) / layerHeight);
        float layerProgress = fract((vPosition.y + layerWarp) / layerHeight);

        // Soft gap between layers (Horizontal Mortar)
        float hGap = smoothstep(0.92, 1.0, layerProgress) + smoothstep(0.08, 0.0, layerProgress);

        // 2. Vertical Cracks (Offset per layer)
        // We use a "Manhattan" distance metric mixed with noise to find block edges
        // Since pyramids are rotated 45 degrees, x+z aligns with faces
        float faceCoord = vPosition.x + vPosition.z;
        // Perturb the vertical lines so they aren't perfect
        float verticalWarp = noise(vPosition.yz * 5.0) * 0.05;

        float blockWidth = 0.4;
        // Offset blocks by layer index to stagger them (running bond pattern)
        float blockPhase = (faceCoord + verticalWarp + layerIndex * 0.2) / blockWidth;
        float vGap = smoothstep(0.95, 1.0, fract(blockPhase));

        // 3. Combined Mortar/Crack
        float mortar = max(hGap, vGap);

        // 4. Weathering/Erosion
        // Erode edges more - multiply mortar influence by noise
        float erosion = noise(vPosition.xy * 8.0);
        mortar += erosion * 0.3 * mortar; // Widen cracks with noise
        mortar = clamp(mortar, 0.0, 1.0);

        // Apply Color
        vec3 baseColor = diffuseColor.rgb;
        vec3 mortarColor = baseColor * 0.25; // Darker

        // Stone texture variation
        float stoneGrain = 0.9 + 0.2 * noiseGrain;

        // Mix Base Stone
        diffuseColor.rgb = mix(baseColor * stoneGrain, mortarColor, mortar * 0.7);

        // --- SAND ACCUMULATION ---
        // Sand piles up at the bottom (world Y < 1.5 roughly)
        // Use noise to make the pile height uneven
        float sandNoise = noise(vWorldPosition.xz * 0.5);
        float sandThreshold = 1.0 + sandNoise * 1.5; // Varies from 1.0 to 2.5 height

        // Smooth blend
        float sandMix = smoothstep(sandThreshold, 0.0, vWorldPosition.y);

        // Sand Color (Matching Terrain #E6C288)
        vec3 sandColor = vec3(0.90, 0.76, 0.53);

        // Apply sand layer
        diffuseColor.rgb = mix(diffuseColor.rgb, sandColor, sandMix * 0.9);

        // Roughness: Mortar is rougher, Stone is smoother, Sand is very rough (matte)
        roughnessFactor = 0.7 + 0.3 * mortar;
        roughnessFactor = mix(roughnessFactor, 1.0, sandMix); // Sand is matte
        `
      )
    }

    return material
  }, [])

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
