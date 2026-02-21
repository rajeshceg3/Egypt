'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function GuidedTour() {
  const [stage, setStage] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 1000) // Location
    const t2 = setTimeout(() => setStage(2), 3000) // Vibe
    const t3 = setTimeout(() => setStage(3), 5500) // Title
    const t4 = setTimeout(() => setStage(4), 9500) // Controls

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
    }
  }, [])

  useEffect(() => {
    const handleInteract = () => {
        if (stage >= 4) setVisible(false)
    }
    window.addEventListener('click', handleInteract)
    window.addEventListener('touchstart', handleInteract)
    return () => {
      window.removeEventListener('click', handleInteract)
      window.removeEventListener('touchstart', handleInteract)
    }
  }, [stage])

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center font-light tracking-widest text-white/90">
      {/* Location */}
      <AnimatePresence>
        {stage >= 1 && stage < 3 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute top-10 left-8 sm:left-12 text-xs uppercase tracking-[0.2em] text-white/70"
          >
            Location: Giza Plateau
          </motion.div>
        )}
      </AnimatePresence>

      {/* Vibe */}
      <AnimatePresence>
        {stage >= 2 && stage < 3 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute top-16 left-8 sm:left-12 text-xs uppercase tracking-[0.2em] text-white/50"
          >
            Atmosphere: Ancient Calm
          </motion.div>
        )}
      </AnimatePresence>

      {/* Title */}
      <AnimatePresence>
        {stage === 3 && (
          <motion.h1
            initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
            transition={{ duration: 2.5, ease: "easeInOut" }}
            className="text-4xl sm:text-6xl font-thin tracking-[0.3em] text-[#FFD700] drop-shadow-2xl text-center px-4"
          >
            ETERNAL SANDS
          </motion.h1>
        )}
      </AnimatePresence>

      {/* Controls Overlay (Final State) */}
      <AnimatePresence>
        {stage >= 4 && visible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.0 }}
            className="absolute bottom-12 flex flex-col items-center gap-2 text-white/40"
          >
            <span className="text-[10px] uppercase tracking-[0.3em] hidden sm:block">Click or Drag to Explore</span>
            <span className="text-[10px] uppercase tracking-[0.3em] sm:hidden">Left: Move &bull; Right: Look</span>
            <div className="w-px h-8 bg-white/20 mt-2" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
