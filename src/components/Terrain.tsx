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

      float fbm(vec2 x) {
          float v = 0.0;
          float a = 0.5;
          vec2 shift = vec2(100.0);
          mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
          for (int i = 0; i < 5; ++i) {
              v += a * snoise(x);
              x = rot * x * 2.0 + shift;
              a *= 0.5;
          }
          return v;
      }

      float getElevation(vec2 pos, float t) {
          float noiseVal = snoise(pos * 0.005);
          float largeDunes = pow(1.0 - abs(noiseVal), 3.0) * 4.5;
          float details = fbm(pos * 0.02) * 0.8;
          float rippleSpeed = 0.2;
          vec2 ripplePos = pos + vec2(t * rippleSpeed, t * rippleSpeed * 0.5);
          float ripples = sin((ripplePos.x * 0.8 + ripplePos.y * 0.2) * 3.0) * 0.15;
          float heat = sin(pos.x * 10.0 + t * 5.0) * sin(pos.y * 10.0 + t * 3.0) * 0.005;
          return largeDunes + details + ripples + heat;
      }

      ${shader.vertexShader}
    `

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      vCustomUv = uv;
      vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;

      float elevation = getElevation(position.xy, uTime);
      transformed.z += elevation;

      float offset = 0.1;
      float eX = getElevation(position.xy + vec2(offset, 0.0), uTime);
      float eY = getElevation(position.xy + vec2(0.0, offset), uTime);

      vec3 vA = vec3(offset, 0.0, eX - elevation);
      vec3 vB = vec3(0.0, offset, eY - elevation);

      vec3 newNormal = normalize(cross(vA, vB));
      vNormal = normalize(normalMatrix * newNormal);
      `
    )

    // FRAGMENT SHADER
    shader.fragmentShader = `
      uniform float uTime;
      varying vec2 vCustomUv;
      varying vec3 vWorldPos;

      float random(vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
      }

      ${shader.fragmentShader}
    `

    // DEFINE SHARED VARIABLES AT START OF MAIN
    shader.fragmentShader = shader.fragmentShader.replace(
      'void main() {',
      `
      void main() {
      // --- SPARKLES ---
      vec3 viewDir = normalize(-vViewPosition);
      vec2 sparkleUv = vCustomUv * 1200.0 + viewDir.xy * 2.5;
      float sparkleNoise = random(sparkleUv);
      float sparkle = step(0.995, sparkleNoise);

      // --- GRAIN ---
      float grain = random(vCustomUv * 500.0);
      float sandH = random(vWorldPos.xz * 600.0);
      `
    )

    // APPLY ROUGHNESS
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <roughnessmap_fragment>',
      `
      #include <roughnessmap_fragment>
      roughnessFactor = 0.8 + grain * 0.2;
      if (sparkle > 0.5) {
        roughnessFactor = 0.0;
      }
      `
    )

    // APPLY NORMAL PERTURBATION
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <normal_fragment_maps>',
      `
      #include <normal_fragment_maps>

      vec3 sandBump = vec3(dFdx(sandH), dFdy(sandH), 0.0);
      normal = normalize(normal + sandBump * 2.0);
      `
    )

    // APPLY EMISSIVE
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      `
      #include <emissivemap_fragment>
      if (sparkle > 0.5) {
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
