'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function GuidedTour() {
  const [stage, setStage] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 1000) // Location/Vibe info removed from here, now in HUD
    const t2 = setTimeout(() => setStage(2), 3000) // Title
    const t3 = setTimeout(() => setStage(3), 6000) // Controls

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [])

  useEffect(() => {
    const handleInteract = () => {
        if (stage >= 3) setVisible(false)
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
      {/* Title */}
      <AnimatePresence>
        {stage >= 2 && visible && (
          <motion.h1
            initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)", transition: { duration: 1.5 } }}
            transition={{ duration: 2.5, ease: "easeInOut" }}
            className="absolute top-1/4 sm:top-1/3 text-3xl sm:text-5xl font-thin tracking-[0.4em] text-[#FFD700] drop-shadow-2xl text-center px-4 mix-blend-screen"
          >
            ETERNAL SANDS
          </motion.h1>
        )}
      </AnimatePresence>

      {/* Controls Overlay (Final State) */}
      <AnimatePresence>
        {stage >= 3 && visible && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 0.6, y: 0 }}
            exit={{ opacity: 0, y: 10, transition: { duration: 1.0 } }}
            transition={{ duration: 2.0 }}
            className="absolute bottom-32 sm:bottom-24 flex flex-col items-center gap-2 text-white/50"
          >
            <span className="text-[10px] uppercase tracking-[0.4em] hidden sm:block">Explore The Geometry</span>
            <span className="text-[10px] uppercase tracking-[0.4em] sm:hidden">Swipe to Discover</span>
            <div className="w-[1px] h-12 bg-white/20 mt-4" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
