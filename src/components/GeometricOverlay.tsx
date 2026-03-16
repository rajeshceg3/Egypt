'use client'

import React, { useRef, useState } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { motion, AnimatePresence } from 'framer-motion'
import { setStoreState, getStoreState } from '../utils/store'

export function GeometricOverlay() {
  const { camera } = useThree()
  const opacityRef = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // Only trigger a React re-render when crossing the visibility threshold
  // so Framer Motion can mount/unmount the SVG paths correctly
  const [isVisible, setIsVisible] = useState(false)

  // Khufu's position based on Pyramid.tsx
  const pyramidPos = new THREE.Vector3(0, 4.87 / 2, 0)

  // Reusable vectors for useFrame (optimization)
  const viewDir = useRef(new THREE.Vector3())
  const toPyramid = useRef(new THREE.Vector3())

  useFrame(() => {
    // Calculate if user is looking generally at the pyramid
    viewDir.current.set(0, 0, -1).applyQuaternion(camera.quaternion)
    toPyramid.current.copy(pyramidPos).sub(camera.position).normalize()

    // Dot product gives 1 if looking exactly at it, 0 if looking 90 degrees away
    const alignment = viewDir.current.dot(toPyramid.current)

    // Distance check to ensure they aren't too far or too close
    const dist = camera.position.distanceTo(pyramidPos)

    // Update global store
    const isLooking = alignment > 0.96 // Slightly tighter sweet spot
    const currentState = getStoreState()
    if (currentState.isLookingAtPyramid !== isLooking || Math.abs(currentState.distanceToPyramid - dist) > 0.1) {
      setStoreState({ isLookingAtPyramid: isLooking, distanceToPyramid: dist })
    }

    // Only show if looking at it and within a certain range
    const shouldShow = alignment > 0.96 && dist > 15 && dist < 40

    // Direct DOM mutation for smooth opacity fades (avoiding React setState)
    if (shouldShow) {
      opacityRef.current = Math.min(opacityRef.current + 0.05, 1)
    } else {
      opacityRef.current = Math.max(opacityRef.current - 0.05, 0)
    }

    // Apply opacity directly to the DOM node
    if (containerRef.current) {
      containerRef.current.style.opacity = (opacityRef.current * 0.8).toString()
    }

    // Trigger React mount/unmount for SVG animations based on threshold
    const shouldBeVisible = opacityRef.current > 0.1
    if (shouldBeVisible !== isVisible) {
      setIsVisible(shouldBeVisible)
    }
  })

  return (
    <Html
      position={pyramidPos}
      center
      zIndexRange={[0, 0]}
      style={{
        pointerEvents: 'none',
      }}
    >
      <div
        ref={containerRef}
        style={{ opacity: 0 }}
        className="relative w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] flex items-center justify-center"
      >
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full overflow-visible drop-shadow-[0_0_2px_#FFD700]"
        >
          <AnimatePresence>
            {isVisible && (
              <>
                {/* Base Width Line */}
                <motion.line
                  x1="10" y1="80" x2="90" y2="80"
                  stroke="#FFD700" strokeWidth="0.2"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 2, ease: "easeInOut" }}
                />
                <motion.text
                  x="50" y="85" fill="#FFD700" fontSize="2" textAnchor="middle" opacity="0.8" className="tracking-widest font-mono"
                  initial={{ opacity: 0 }} animate={{ opacity: 0.8 }} transition={{ delay: 1, duration: 1 }} exit={{ opacity: 0 }}
                >
                  230.4m (440 CU)
                </motion.text>

                {/* Height Line */}
                <motion.line
                  x1="50" y1="80" x2="50" y2="20"
                  stroke="#FFD700" strokeWidth="0.2"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 1.5, delay: 0.5, ease: "easeInOut" }}
                />
                <motion.text
                  x="52" y="50" fill="#FFD700" fontSize="2" opacity="0.8" className="tracking-widest font-mono"
                  initial={{ opacity: 0 }} animate={{ opacity: 0.8 }} transition={{ delay: 1.5, duration: 1 }} exit={{ opacity: 0 }}
                >
                  146.6m (280 CU)
                </motion.text>

                {/* Slope Line (Right) */}
                <motion.line
                  x1="90" y1="80" x2="50" y2="20"
                  stroke="#FFD700" strokeWidth="0.5"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 2, delay: 1, ease: "easeInOut" }}
                />

                {/* Angle Arc & Text */}
                <motion.path
                  d="M 80 80 A 10 10 0 0 0 78 74"
                  fill="none" stroke="#FFD700" strokeWidth="0.2"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 1, delay: 2, ease: "easeOut" }}
                />
                <motion.text
                  x="82" y="78" fill="#FFD700" fontSize="2" opacity="0.8" className="tracking-widest font-mono"
                  initial={{ opacity: 0 }} animate={{ opacity: 0.8 }} transition={{ delay: 2.5, duration: 1 }} exit={{ opacity: 0 }}
                >
                  51°50&apos;40&quot;
                </motion.text>

                {/* Golden Ratio Hint */}
                <motion.circle
                  cx="50" cy="50" r="30" fill="none" stroke="#ffffff" strokeWidth="0.1" opacity="0.3"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 3, delay: 1.5, ease: "easeInOut" }}
                />
                <motion.line
                  x1="20" y1="50" x2="80" y2="50" stroke="#ffffff" strokeWidth="0.1" strokeDasharray="0.5 0.5" opacity="0.3"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 2, delay: 2 }}
                />
                <motion.line
                  x1="50" y1="20" x2="50" y2="80" stroke="#ffffff" strokeWidth="0.1" strokeDasharray="0.5 0.5" opacity="0.3"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 2, delay: 2 }}
                />
                <motion.text
                  x="65" y="48" fill="#ffffff" fontSize="1.5" opacity="0.4" className="tracking-widest font-mono"
                  initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} transition={{ delay: 3, duration: 2 }} exit={{ opacity: 0 }}
                >
                  φ ≈ 1.618
                </motion.text>
              </>
            )}
          </AnimatePresence>
        </svg>
      </div>
    </Html>
  )
}
