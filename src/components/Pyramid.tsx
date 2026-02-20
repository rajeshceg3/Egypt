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
        varying vec3 vWorldNormal;

        float random(vec2 st) {
            return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
        }

        // Simplex Noise 3D (more organic than value noise) - Renamed to avoid collision
        // Ultrathink: Using 3D noise prevents texture stretching on pyramid faces
        vec3 mod289_custom(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 mod289_custom(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 permute_custom(vec4 x) { return mod289_custom(((x*34.0)+1.0)*x); }
        vec4 taylorInvSqrt_custom(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

        float snoise_custom(vec3 v) {
            const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
            const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

            // First corner
            vec3 i  = floor(v + dot(v, C.yyy) );
            vec3 x0 = v - i + dot(i, C.xxx) ;

            // Other corners
            vec3 g = step(x0.yzx, x0.xyz);
            vec3 l = 1.0 - g;
            vec3 i1 = min( g.xyz, l.zxy );
            vec3 i2 = max( g.xyz, l.zxy );

            //   x0 = x0 - 0.0 + 0.0 * C.xxx;
            //   x1 = x0 - i1  + 1.0 * C.xxx;
            //   x2 = x0 - i2  + 2.0 * C.xxx;
            //   x3 = x0 - 1.0 + 3.0 * C.xxx;
            vec3 x1 = x0 - i1 + C.xxx;
            vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
            vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y

            // Permutations
            i = mod289_custom(i);
            vec4 p = permute_custom( permute_custom( permute_custom(
                        i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                    + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
                    + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

            // Gradients: 7x7 points over a square, mapped onto an octahedron.
            // The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
            float n_ = 0.142857142857; // 1.0/7.0
            vec3  ns = n_ * D.wyz - D.xzx;

            vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

            vec4 x_ = floor(j * ns.z);
            vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

            vec4 x = x_ *ns.x + ns.yyyy;
            vec4 y = y_ *ns.x + ns.yyyy;
            vec4 h = 1.0 - abs(x) - abs(y);

            vec4 b0 = vec4( x.xy, y.xy );
            vec4 b1 = vec4( x.zw, y.zw );

            //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;
            //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;
            vec4 s0 = floor(b0)*2.0 + 1.0;
            vec4 s1 = floor(b1)*2.0 + 1.0;
            vec4 sh = -step(h, vec4(0.0));

            vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
            vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

            vec3 p0 = vec3(a0.xy,h.x);
            vec3 p1 = vec3(a0.zw,h.y);
            vec3 p2 = vec3(a1.xy,h.z);
            vec3 p3 = vec3(a1.zw,h.w);

            //Normalise gradients
            vec4 norm = taylorInvSqrt_custom(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
            p0 *= norm.x;
            p1 *= norm.y;
            p2 *= norm.z;
            p3 *= norm.w;

            // Mix final noise value
            vec4 m = max(0.5 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
            m = m * m;
            return 105.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                            dot(p2,x2), dot(p3,x3) ) );
        }

        // Fractal Brownian Motion (FBM) for "Ultrathink" Complexity
        float fbm_custom(vec3 st) {
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
        float noise_custom(vec3 st) {
            return snoise_custom(st) * 0.5 + 0.5;
        }

        ${shader.fragmentShader}
      `

      shader.vertexShader = `
        varying vec3 vPos;
        varying vec3 vWorldPos;
        varying vec3 vWorldNormal;
        ${shader.vertexShader}
      `

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        vPos = position;
        vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        `
      )

      // INJECT LOGIC AT START OF MAIN
      // This ensures variables are available globally within main()
      shader.fragmentShader = shader.fragmentShader.replace(
        'void main() {',
        `
        void main() {
            // --- SAND ACCUMULATION LOGIC (Physics-Based) ---
            // Ultrathink: Directional Wind Bias
            float windBias = smoothstep(-15.0, 15.0, vWorldPos.x) * 1.5;

            // Ultrathink: Surface Normal Bias (Gravity)
            // Dust settles on upward facing surfaces
            vec3 up = vec3(0.0, 1.0, 0.0);
            float upwardFacing = dot(normalize(vWorldNormal), up);
            // Bias sand threshold: flatter surfaces (dot -> 1.0) get more sand
            // Slopes (dot ~ 0.7 for pyramid) get some
            // Walls/Underhangs get less
            float gravityBias = smoothstep(0.5, 1.0, upwardFacing) * 0.7;

            float sandNoiseShared = noise_custom(vWorldPos * 0.5);
            // Combine height, wind, and gravity
            float sandThresholdShared = 1.0 + sandNoiseShared * 1.5 - windBias - gravityBias;
            float sandMix = smoothstep(sandThresholdShared, 0.0, vWorldPos.y);

            // --- VIEW DEPENDENT SPARKLES (Ultrathink: Infinite Resolution) ---
            vec3 viewDir = normalize(cameraPosition - vWorldPos);
            // Increased frequency from *50.0 (100 effective) to *400.0 (800 effective) for mm-scale grains
            vec2 sparkleUv = vWorldPos.xz * 2.0 + viewDir.xy * 0.1;
            float sparkleNoise = random(sparkleUv * 400.0);
            float sparkle = step(0.998, sparkleNoise) * step(0.5, sandMix); // Higher threshold for rarer, brighter glints

            // Ultrathink: Chromatic Aberration (Prism Effect)
            vec3 sparkleTint = vec3(1.0, 0.9, 0.6); // Base Gold
            float prismNoise = random(vWorldPos.xz * 100.0 + viewDir.xy * 10.0);
            if (prismNoise > 0.6) { // Only some sparkles diffract light
                // ULTRATHINK: Enhanced saturation for jewel-like pop
                // Broadened spectrum: deep purples, cyans, magentas
                float hue = prismNoise * 6.28; // 0 to 2PI
                // Phase-shifted sine waves for rainbow palette
                sparkleTint = vec3(
                   0.5 + 0.5 * sin(hue),
                   0.5 + 0.5 * sin(hue + 2.09),
                   0.5 + 0.5 * sin(hue + 4.18)
                );
                // Boost saturation and brightness
                sparkleTint = pow(sparkleTint, vec3(0.5)); // Brighten
                sparkleTint *= 5.0; // HDR boost (High dynamic range glints)
            }

            // --- PROCEDURAL STONE & MORTAR (Ultrathink: FBM 3D) ---
            // Ultrathink: Use vWorldPos (3D) to avoid stretching on pyramid slopes
            float noiseGrain = fbm_custom(vWorldPos * 20.0); // Fractal complexity

            // Ultrathink: Micro-Erosion (Porous Limestone)
            float microErosion = fbm_custom(vWorldPos * 120.0);

            // Ultrathink: Macro-Cracks (Large scale weathering)
            float macroCracks = fbm_custom(vWorldPos * 2.0); // Low frequency
            // Threshold to create distinct cracks
            macroCracks = smoothstep(0.4, 0.6, macroCracks);

            // Layers
            float layerHeight = 0.15;
            vec3 warpOffset = vec3(fbm_custom(vWorldPos * 1.5), fbm_custom(vWorldPos.zxy * 1.5), fbm_custom(vWorldPos.yzx * 1.5)) * 0.1;
            float layerPos = vWorldPos.y + warpOffset.y;
            float layerIndex = floor(layerPos / layerHeight);
            float layerProgress = fract(layerPos / layerHeight);

            // Edges
            float edgeNoise = noise_custom(vWorldPos * 20.0) * 0.1;
            float hGap = smoothstep(0.90 - edgeNoise, 1.0, layerProgress) + smoothstep(0.1 + edgeNoise, 0.0, layerProgress);

            // Verticals
            // Using radial logic for better vertical block alignment on cylinders
            float faceCoord = atan(vWorldPos.x, vWorldPos.z) * 5.0; // Radial mapping
            float verticalWarp = noise_custom(vWorldPos * 5.0) * 0.05;
            float blockWidth = 0.4 + noise_custom(vec3(layerIndex, 0.0, 0.0)) * 0.15;
            float blockPhase = (faceCoord + verticalWarp + layerIndex * 12.34) / blockWidth;
            float vGap = smoothstep(0.90 - edgeNoise, 1.0, fract(blockPhase));

            // Mortar (Ultrathink: Broken Edges)
            // Instead of a smooth gradient, we use a noise threshold to create "chipped" edges
            float gapRaw = max(hGap, vGap);
            float mortarNoise = noise_custom(vWorldPos * 30.0);
            float mortar = smoothstep(0.3, 0.7, gapRaw + mortarNoise * 0.3);

            // Ledge Sand (Physics-Based: Only where flat)
            // 'layerProgress' near 0 is the bottom of a block (ledge of block below)
            // 'upwardFacing' ensures we don't put sand on vertical walls even if layerProgress matches
            // We use a stricter mask for "flatness" here
            float ledgeFlatness = smoothstep(0.8, 1.0, upwardFacing);
            float ledgeSand = smoothstep(0.25, 0.0, layerProgress) * step(0.35, noise_custom(vWorldPos * 10.0 + vec3(0.0, uTime * 0.05, 0.0)));
            // Modulate ledge sand by gravity
            ledgeSand *= (0.5 + 0.5 * ledgeFlatness);

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

        // Darken macro cracks (Ambient Occlusion)
        finalStoneColor *= (1.0 - macroCracks * 0.4);

        diffuseColor.rgb = finalStoneColor;

        // ULTRATHINK: Crevice Accumulation
        // Sand accumulates in the mortar joints and deep erosion pits.
        // We use the 'mortar' mask and 'microErosion' to identify these deep spots.
        // If mortar is high, it's a gap. If microErosion is low, it's a pit.
        // We invert microErosion logic slightly (high value = erosion depth).
        float creviceMask = max(mortar, smoothstep(0.2, 0.8, microErosion));

        // Mask out areas already covered by base sand to avoid double blending
        creviceMask *= (1.0 - totalSand);

        // Add random variation to crevice filling so it's not uniform (Ultrathink: FBM for complexity)
        float creviceNoise = fbm_custom(vWorldPos * 20.0 + vec3(0.0, uTime * 0.05, 0.0)) * 0.5 + 0.5;
        float creviceFill = smoothstep(0.5, 0.9, creviceMask * creviceNoise);

        vec3 sandColor = vec3(0.90, 0.76, 0.53);

        // Apply Crevice Sand first
        diffuseColor.rgb = mix(diffuseColor.rgb, sandColor, creviceFill * 0.7);

        // Apply Base Sand
        diffuseColor.rgb = mix(diffuseColor.rgb, sandColor, totalSand * 0.9);
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

        // Macro-Crack Normal Perturbation
        float crackDepth = macroCracks * 0.2;
        vec3 crackBump = vec3(dFdx(crackDepth), dFdy(crackDepth), 0.0);

        if (totalSand < 0.8) {
             // Combine mortar bump (large features), erosion (micro), and cracks (macro)
             normal = normalize(normal + mortarBump * 20.0 + erosionBump * 5.0 + crackBump * 10.0);
        }
        `
      )

      // Inject Emissive
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <emissivemap_fragment>',
        `
        #include <emissivemap_fragment>
        if (sparkle > 0.5 && totalSand > 0.1) {
            totalEmissiveRadiance += sparkleTint;
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
