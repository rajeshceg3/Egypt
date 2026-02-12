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
    // ULTRATHINK: Organic Heat Haze
    // We want a "liquid" rising effect that mimics turbulent air density changes.

    // 1. Primary Flow (Large scale)
    vec2 uv1 = uv * vec2(15.0, 40.0);
    uv1.y -= time * 6.0; // Fast rising
    uv1.x += sin(uv.y * 10.0 + time) * 0.5; // Sine wave drift

    // 2. Secondary Flow (Detail)
    vec2 uv2 = uv * vec2(40.0, 80.0);
    uv2.y -= time * 9.0;

    // Combine noise layers
    float n1 = noise(uv1);
    float n2 = noise(uv2);

    // Final noise (-0.5 to 0.5 center)
    float n = mix(n1, n2, 0.4) - 0.5;

    // 3. Masking
    // The heat is strongest at the ground (bottom of screen) and fades up.
    // We use a power curve to keep the top of the sky clean.
    float mask = smoothstep(0.6, 0.0, uv.y);
    mask = pow(mask, 1.5);

    // 4. Distortion
    // Heat haze distorts horizontally more than vertically (shimmer)
    // We boost the base multiplier so 'strength' uniform is effective
    vec2 distortion = vec2(n * 0.03, n * 0.01) * mask * strength * 10.0;

    // 5. Sample
    vec2 distortedUV = clamp(uv + distortion, 0.0, 1.0);
    outputColor = texture2D(inputBuffer, distortedUV);
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
  // Pass a higher default strength if not provided
  return <HeatHazeEffect ref={ref} strength={1.0} {...props} />
})

HeatHaze.displayName = 'HeatHaze'
