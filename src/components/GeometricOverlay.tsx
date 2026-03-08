'use client'

import React, { useState } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

export function GeometricOverlay() {
  const { camera } = useThree()
  const [opacity, setOpacity] = useState(0)

  // Khufu's position based on Pyramid.tsx
  const pyramidPos = new THREE.Vector3(0, 4.87 / 2, 0)

  useFrame(() => {
    // Calculate if user is looking generally at the pyramid
    const viewDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion)
    const toPyramid = pyramidPos.clone().sub(camera.position).normalize()

    // Dot product gives 1 if looking exactly at it, 0 if looking 90 degrees away
    const alignment = viewDir.dot(toPyramid)

    // Distance check to ensure they aren't too far or too close
    const dist = camera.position.distanceTo(pyramidPos)

    // Only show if looking at it and within a certain range
    if (alignment > 0.95 && dist > 15 && dist < 40) {
      setOpacity((prev) => Math.min(prev + 0.05, 1))
    } else {
      setOpacity((prev) => Math.max(prev - 0.05, 0))
    }
  })

  if (opacity === 0) return null

  return (
    <Html
      position={pyramidPos}
      center
      zIndexRange={[0, 0]}
      style={{
        pointerEvents: 'none',
        opacity: opacity * 0.6, // Max opacity 0.6 for subtlety
        transition: 'opacity 0.2s ease-out'
      }}
    >
      <div className="relative w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] flex items-center justify-center">
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full overflow-visible"
        >
          {/* Base Width Line */}
          <line
            x1="10" y1="80"
            x2="90" y2="80"
            stroke="#FFD700"
            strokeWidth="0.2"
            strokeDasharray="1 1"
            className="animate-[dash_20s_linear_infinite]"
          />
          <text x="50" y="85" fill="#FFD700" fontSize="2" textAnchor="middle" opacity="0.8" className="tracking-widest font-mono">230.4m (440 CU)</text>

          {/* Height Line */}
          <line
            x1="50" y1="80"
            x2="50" y2="20"
            stroke="#FFD700"
            strokeWidth="0.2"
            strokeDasharray="1 1"
          />
          <text x="52" y="50" fill="#FFD700" fontSize="2" opacity="0.8" className="tracking-widest font-mono">146.6m (280 CU)</text>

          {/* Slope Line (Right) */}
          <line
            x1="90" y1="80"
            x2="50" y2="20"
            stroke="#FFD700"
            strokeWidth="0.5"
          />

          {/* Angle Arc & Text */}
          <path
            d="M 80 80 A 10 10 0 0 0 78 74"
            fill="none"
            stroke="#FFD700"
            strokeWidth="0.2"
          />
          <text x="82" y="78" fill="#FFD700" fontSize="2" opacity="0.8" className="tracking-widest font-mono">51°50&apos;40&quot;</text>

          {/* Golden Ratio Hint */}
          <circle cx="50" cy="50" r="30" fill="none" stroke="#ffffff" strokeWidth="0.1" opacity="0.3" />
          <line x1="20" y1="50" x2="80" y2="50" stroke="#ffffff" strokeWidth="0.1" strokeDasharray="0.5 0.5" opacity="0.3" />
          <line x1="50" y1="20" x2="50" y2="80" stroke="#ffffff" strokeWidth="0.1" strokeDasharray="0.5 0.5" opacity="0.3" />
          <text x="65" y="48" fill="#ffffff" fontSize="1.5" opacity="0.4" className="tracking-widest font-mono">φ ≈ 1.618</text>

        </svg>
      </div>
    </Html>
  )
}
