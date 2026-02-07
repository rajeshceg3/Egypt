'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Experience } from '@/components/Experience'
import { AudioAmbience } from '@/components/AudioAmbience'

export default function Home() {
  const [showEnter, setShowEnter] = useState(true)

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black font-sans selection:bg-white/20">
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
                onClick={() => setShowEnter(false)}
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 3 }}
            className="h-full w-full"
          >
            <Experience />

            <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-12">
              <div className="flex justify-between">
                <div className="flex flex-col gap-1">
                  <h3 className="text-xs font-medium tracking-[0.2em] uppercase text-white/40">
                    Location
                  </h3>
                  <p className="text-sm font-light tracking-wide text-white/80">
                    29.9792° N, 31.1342° E
                  </p>
                </div>
                <div className="text-right flex flex-col gap-1">
                  <h3 className="text-xs font-medium tracking-[0.2em] uppercase text-white/40">
                    Vibe
                  </h3>
                  <p className="text-sm font-light tracking-wide text-white/80">
                    Eternal Silence
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4 max-w-sm">
                <h2 className="text-2xl font-light tracking-tight text-white/90">
                  The Great Pyramid
                </h2>
                <p className="text-xs leading-relaxed tracking-wide text-white/40 uppercase">
                  Built for the Pharaoh Khufu in the Fourth Dynasty of the Old Kingdom.
                  A testament to precision, geometry, and the enduring human spirit.
                </p>
              </div>
            </div>

            <AudioAmbience />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
