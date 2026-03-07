'use client'

import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Experience } from '@/components/Experience'
import { AudioAmbience, AudioAmbienceHandle } from '@/components/AudioAmbience'
import { TelemetryHUD } from '@/components/TelemetryHUD'

export default function Home() {
  const [showEnter, setShowEnter] = useState(true)
  const audioRef = useRef<AudioAmbienceHandle>(null)

  const handleEnter = () => {
    setShowEnter(false)
    audioRef.current?.startAudio()
  }

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black font-sans selection:bg-white/20">
      <AudioAmbience
        ref={audioRef}
        className={`transition-opacity duration-[2000ms] ${showEnter ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      />

      <AnimatePresence>
        {showEnter ? (
          <motion.div
            key="overlay"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black text-white"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 1.5 }}
              className="flex flex-col items-center gap-12"
            >
              <div className="flex flex-col items-center gap-4">
                <h1 className="text-sm font-medium tracking-[0.3em] uppercase opacity-50">
                  Immersion
                </h1>
                <h2 className="text-4xl font-light tracking-tight sm:text-6xl">
                  Giza.
                </h2>
              </div>

              <button
                onClick={handleEnter}
                className="group relative flex flex-col items-center gap-4 transition-opacity hover:opacity-80"
              >
                <div className="h-[1px] w-12 bg-white/30 transition-all group-hover:w-20" />
                <span className="text-xs font-medium tracking-widest uppercase opacity-40">
                  Begin Journey
                </span>
              </button>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, filter: "blur(20px)", scale: 1.05 }}
            animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
            transition={{ duration: 5, ease: [0.22, 1, 0.36, 1] }}
            className="h-full w-full"
          >
            <Experience />
            <TelemetryHUD />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
