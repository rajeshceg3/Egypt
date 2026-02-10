'use client'

import React, { forwardRef } from 'react'
import { Effect } from 'postprocessing'
import { wrapEffect } from '@react-three/postprocessing'
import * as THREE from 'three'

// Fragment Shader
const fragmentShader = `
uniform float time;
uniform float strength;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    // 1. Create a rising heat pattern (vertical flow)
    // Use sine waves for simplicity and performance, mimicking turbulent air
    float wave1 = sin(uv.y * 20.0 - time * 8.0 + uv.x * 10.0);
    float wave2 = sin(uv.y * 35.0 - time * 12.0 + uv.x * 25.0);

    // 2. Combine waves
    float noise = (wave1 + wave2) * 0.5;

    // 3. Masking: Haze is stronger near the horizon/ground (lower UV.y)
    // Assume horizon is around y=0.4 - 0.5 depending on camera
    // We'll just make it fade out at the top of the screen
    float mask = smoothstep(0.8, 0.2, uv.y);

    // 4. Calculate distortion
    vec2 distortion = vec2(noise * 0.01, noise * 0.02) * strength * mask;

    // 5. Sample the input buffer with distorted UVs
    // Clamp UVs to avoid edge artifacts
    vec2 distortedUV = clamp(uv + distortion, 0.0, 1.0);

    outputColor = texture2D(inputBuffer, distortedUV);
}
`

// Effect Class
class HeatHazeEffectImpl extends Effect {
  constructor({ strength = 0.005 } = {}) {
    super('HeatHazeEffect', fragmentShader, {
      uniforms: new Map([
        ['time', { value: 0 }],
        ['strength', { value: strength }]
      ])
    })
  }

  update(renderer, inputBuffer, deltaTime) {
    const time = this.uniforms.get('time')
    if (time) {
        time.value += deltaTime
    }
  }
}

// Wrap for R3F
const HeatHazeEffect = wrapEffect(HeatHazeEffectImpl)

export const HeatHaze = forwardRef((props: any, ref) => {
  return <HeatHazeEffect ref={ref} strength={0.002} {...props} />
})
