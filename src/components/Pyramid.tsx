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

        // Simplex Noise (more organic than value noise) - Renamed to avoid collision
        vec3 mod289_custom(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec2 mod289_custom(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec3 permute_custom(vec3 x) { return mod289_custom(((x*34.0)+1.0)*x); }

        float snoise_custom(vec2 v) {
            const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                     -0.577350269189626, 0.024390243902439);
            vec2 i  = floor(v + dot(v, C.yy) );
            vec2 x0 = v -   i + dot(i, C.xx);
            vec2 i1;
            i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
            vec4 x12 = x0.xyxy + C.xxzz;
            x12.xy -= i1;
            i = mod(i, 289.0);
            vec3 p = permute_custom( permute_custom( i.y + vec3(0.0, i1.y, 1.0 ))
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

        // Fractal Brownian Motion (FBM) for "Ultrathink" Complexity
        float fbm_custom(vec2 st) {
            float value = 0.0;
            float amplitude = 0.5;
            for (int i = 0; i < 5; i++) {
                value += amplitude * snoise_custom(st);
                st *= 2.0;
                amplitude *= 0.5;
            }
            return value;
        }

        // Keep basic noise for simple logic if needed (Remap [-1, 1] to [0, 1])
        float noise_custom(vec2 st) {
            return snoise_custom(st) * 0.5 + 0.5;
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

      // INJECT LOGIC AT START OF MAIN
      // This ensures variables are available globally within main()
      shader.fragmentShader = shader.fragmentShader.replace(
        'void main() {',
        `
        void main() {
            // --- SAND ACCUMULATION LOGIC (Shared) ---
            // Ultrathink: Directional Wind Bias
            // Sand accumulates more on the windward side (assuming wind from X)
            float windBias = smoothstep(-20.0, 20.0, vWorldPos.x) * 1.5;

            float sandNoiseShared = noise_custom(vWorldPos.xz * 0.5);
            float sandThresholdShared = 1.0 + sandNoiseShared * 1.5 - windBias;
            float sandMix = smoothstep(sandThresholdShared, 0.0, vWorldPos.y);

            // --- VIEW DEPENDENT SPARKLES (Ultrathink: Infinite Resolution) ---
            vec3 viewDir = normalize(-vViewPosition);
            // Increased frequency from *50.0 (100 effective) to *400.0 (800 effective) for mm-scale grains
            vec2 sparkleUv = vWorldPos.xz * 2.0 + viewDir.xy * 0.1;
            float sparkleNoise = random(sparkleUv * 400.0);
            float sparkle = step(0.998, sparkleNoise) * step(0.5, sandMix); // Higher threshold for rarer, brighter glints

            // --- PROCEDURAL STONE & MORTAR (Ultrathink: FBM) ---
            float noiseGrain = fbm_custom(vPos.xy * 20.0); // Fractal complexity

            // Ultrathink: Micro-Erosion (Porous Limestone)
            float microErosion = noise_custom(vWorldPos.xy * 60.0);

            // Layers
            float layerHeight = 0.15;
            vec3 warpOffset = vec3(fbm_custom(vPos.yz * 1.5), fbm_custom(vPos.xz * 1.5), fbm_custom(vPos.xy * 1.5)) * 0.1;
            float layerPos = vPos.y + warpOffset.y;
            float layerIndex = floor(layerPos / layerHeight);
            float layerProgress = fract(layerPos / layerHeight);

            // Edges
            float edgeNoise = noise_custom(vPos.xy * 20.0) * 0.1;
            float hGap = smoothstep(0.90 - edgeNoise, 1.0, layerProgress) + smoothstep(0.1 + edgeNoise, 0.0, layerProgress);

            // Verticals
            float faceCoord = vPos.x + vPos.z;
            float verticalWarp = noise_custom(vPos.yz * 5.0) * 0.05;
            float blockWidth = 0.4 + noise_custom(vec2(layerIndex, 0.0)) * 0.15;
            float blockPhase = (faceCoord + verticalWarp + layerIndex * 12.34) / blockWidth;
            float vGap = smoothstep(0.90 - edgeNoise, 1.0, fract(blockPhase));

            // Mortar (Ultrathink: Broken Edges)
            // Instead of a smooth gradient, we use a noise threshold to create "chipped" edges
            float gapRaw = max(hGap, vGap);
            float mortarNoise = noise_custom(vPos.xy * 30.0);
            float mortar = smoothstep(0.3, 0.7, gapRaw + mortarNoise * 0.3);

            // Ledge Sand
            float ledgeSand = smoothstep(0.25, 0.0, layerProgress) * step(0.35, noise_custom(vPos.xz * 10.0 + uTime * 0.05));
            float totalSand = clamp(sandMix + ledgeSand * 0.5, 0.0, 1.0);
        `
      )

      // Inject Color Modification
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <map_fragment>',
        `
        #include <map_fragment>
        vec3 baseColor = diffuseColor.rgb;
        vec3 mortarColor = baseColor * 0.25;
        float stoneGrain = 0.9 + 0.2 * noiseGrain;
        vec3 finalStoneColor = mix(baseColor * stoneGrain, mortarColor, mortar * 0.7);

        // Weathering
        float heightGradient = smoothstep(0.0, 6.0, vWorldPos.y);
        vec3 weatherFactor = mix(vec3(0.7, 0.65, 0.6), vec3(1.1, 1.1, 1.05), heightGradient);
        finalStoneColor *= weatherFactor;

        diffuseColor.rgb = finalStoneColor;
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.90, 0.76, 0.53), totalSand * 0.9);
        `
      )

      // Inject Roughness
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <roughnessmap_fragment>',
        `
        #include <roughnessmap_fragment>
        roughnessFactor = 0.7 + 0.3 * mortar;
        roughnessFactor = mix(roughnessFactor, 1.0, totalSand);
        if (sparkle > 0.5 && totalSand > 0.1) roughnessFactor = 0.0;
        `
      )

      // Inject Normal Perturbation
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <normal_fragment_maps>',
        `
        #include <normal_fragment_maps>
        // Mortar depth
        float mortarDepth = mortar * 0.5;
        vec3 mortarBump = vec3(dFdx(mortarDepth), dFdy(mortarDepth), 0.0);

        // Micro-Erosion Normal Perturbation
        // Simulate the rough surface of limestone
        float erosionDepth = microErosion * 0.05;
        vec3 erosionBump = vec3(dFdx(erosionDepth), dFdy(erosionDepth), 0.0);

        if (totalSand < 0.8) {
             // Combine mortar bump (large features) and erosion (micro features)
             normal = normalize(normal + mortarBump * 20.0 + erosionBump * 5.0);
        }
        `
      )

      // Inject Emissive
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
