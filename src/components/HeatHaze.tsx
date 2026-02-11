'use client'

import React, { forwardRef } from 'react'
import { Effect } from 'postprocessing'
import { wrapEffect } from '@react-three/postprocessing'
import { Uniform } from 'three'

// Fragment Shader with Simplex Noise
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

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    // 1. Create a rising heat pattern (vertical flow) using Simplex Noise
    // Scale UVs for noise frequency
    vec2 noiseUV = uv * vec2(20.0, 5.0); // Stretch vertically for rising effect

    // Animate with time
    // Layer 1: Slow, large
    float noise1 = snoise(noiseUV + vec2(0.0, -time * 2.0));
    // Layer 2: Fast, small details
    float noise2 = snoise(noiseUV * 2.0 + vec2(time * 0.5, -time * 4.0));

    // Combine
    float noise = (noise1 + noise2 * 0.5) * 0.7;

    // 2. Masking: Haze is stronger near the horizon (lower UV.y)
    // We want it to be strongest at the bottom and fade out by mid-screen.
    float mask = smoothstep(0.6, 0.1, uv.y); // Fades from 0.1 (full) to 0.6 (zero)

    // 3. Calculate distortion
    // Distort mainly X (wobbly air) but also Y slightly
    vec2 distortion = vec2(noise * 0.01, noise * 0.005) * strength * mask;

    // 4. Sample the input buffer with distorted UVs
    vec2 distortedUV = clamp(uv + distortion, 0.0, 1.0);

    outputColor = texture2D(inputBuffer, distortedUV);
}
`

// Effect Class
class HeatHazeEffectImpl extends Effect {
  constructor({ strength = 0.005 } = {}) {
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
  return <HeatHazeEffect ref={ref} strength={0.002} {...props} />
})

HeatHaze.displayName = 'HeatHaze'
