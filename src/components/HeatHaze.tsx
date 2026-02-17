'use client'

import React, { forwardRef, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Effect } from 'postprocessing'
import { wrapEffect } from '@react-three/postprocessing'
import { Uniform } from 'three'

// Fragment Shader
const fragmentShader = `
uniform float time;
uniform float strength;

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

// FBM for Fluid Haze (Organic Turbulence)
float fbm(vec2 x) {
    float v = 0.0;
    float a = 0.5;
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
    for (int i = 0; i < 3; ++i) {
        v += a * snoise(x);
        x = rot * x * 2.0;
        a *= 0.5;
    }
    return v;
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    // ULTRATHINK: Organic Heat Haze
    // Mimic the refractive index changes of rising hot air

    // Rising Flow
    vec2 flowUv = uv * vec2(10.0, 20.0);
    flowUv.y -= time * 3.0;

    // Add side-to-side drift (Sine wave)
    flowUv.x += sin(uv.y * 5.0 + time * 0.5) * 1.5;

    // FBM Noise
    float n = fbm(flowUv);

    // Masking - Strongest at horizon (0.4-0.5), fades up
    float mask = smoothstep(0.6, 0.0, uv.y);
    mask = pow(mask, 1.8);

    // Distortion - Horizontal shimmer > Vertical
    vec2 distortion = vec2(n * 0.02, n * 0.04) * mask * strength * 5.0;

    // Sample with Chromatic Aberration (Ultrathink: Prism Effect)
    float aberration = length(distortion) * 4.0;

    vec2 uvR = clamp(uv + distortion * (1.0 + aberration), 0.0, 1.0);
    vec2 uvG = clamp(uv + distortion, 0.0, 1.0);
    vec2 uvB = clamp(uv + distortion * (1.0 - aberration), 0.0, 1.0);

    float r = texture2D(inputBuffer, uvR).r;
    float g = texture2D(inputBuffer, uvG).g;
    float b = texture2D(inputBuffer, uvB).b;

    outputColor = vec4(r, g, b, 1.0);
}
`

// Effect Class
class HeatHazeEffectImpl extends Effect {
  constructor({ strength = 1.0 } = {}) {
    super('HeatHazeEffect', fragmentShader, {
      uniforms: new Map([
        ['time', new Uniform(0)],
        ['strength', new Uniform(strength)]
      ])
    })
  }

  update(renderer: unknown, inputBuffer: unknown, deltaTime: number) {
    const time = this.uniforms.get('time')
    if (time) {
        time.value += deltaTime
    }
  }
}

// Wrap for R3F
const HeatHazeEffect = wrapEffect(HeatHazeEffectImpl)

export const HeatHaze = forwardRef((props: Record<string, unknown>, ref) => {
  const localRef = useRef<Effect>(null)

  useFrame((state, delta) => {
    // ULTRATHINK: Explicitly update time uniform to ensure smooth animation
    const effect = localRef.current
    if (effect) {
      const timeUniform = effect.uniforms.get('time')
      if (timeUniform) {
        timeUniform.value += delta
      }
    }
  })

  // Merge refs (simple version)
  const setRef = (node: unknown) => {
      localRef.current = node as Effect
      if (typeof ref === 'function') {
        ref(node)
      } else if (ref) {
        (ref as React.MutableRefObject<unknown>).current = node
      }
  }

  // Pass a higher default strength if not provided
  return <HeatHazeEffect ref={setRef} strength={1.0} {...props} />
})

HeatHaze.displayName = 'HeatHaze'
