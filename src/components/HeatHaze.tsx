'use client'

import React, { forwardRef } from 'react'
import { Effect } from 'postprocessing'
import { wrapEffect } from '@react-three/postprocessing'
import { Uniform } from 'three'

// Fragment Shader
const fragmentShader = `
uniform float time;
uniform float strength;

// Pseudo-random noise
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

// 2D Noise
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

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    // 1. Create a rising heat pattern (vertical flow) with Noise
    // Scale UVs for noise frequency
    vec2 noiseUV = uv * vec2(20.0, 50.0);

    // Animate noise upwards (rising heat)
    noiseUV.y -= time * 5.0;

    // Add some horizontal drift
    noiseUV.x += sin(time * 0.5) * 2.0;

    // Sample noise
    float n = noise(noiseUV);

    // 2. Masking: Haze is stronger near the horizon/ground (lower UV.y)
    // Fade out at the top of the screen
    float mask = smoothstep(0.8, 0.2, uv.y);

    // 3. Calculate distortion
    // Distort mostly in X to simulate refraction, slightly in Y
    vec2 distortion = vec2((n - 0.5) * 0.02, (n - 0.5) * 0.01) * strength * mask;

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
