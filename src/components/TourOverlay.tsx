'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, X } from 'lucide-react'

export interface TourStep {
  id: string
  title: string
  description: string
  cameraPosition: [number, number, number]
  lookAtPosition: [number, number, number]
}

interface TourOverlayProps {
  steps: TourStep[]
  currentIndex: number
  isActive: boolean
  onNext: () => void
  onPrev: () => void
  onExit: () => void
  onStart: () => void
}

export function TourOverlay({
  steps,
  currentIndex,
  isActive,
  onNext,
  onPrev,
  onExit,
  onStart
}: TourOverlayProps) {
  const currentStep = steps[currentIndex]

  // Progressive Disclosure: Reset animations when step changes
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    if (isActive) {
      setShowContent(false)
      // Delay content reveal to allow camera to start moving
      const timer = setTimeout(() => setShowContent(true), 800)
      return () => clearTimeout(timer)
    }
  }, [currentIndex, isActive])

  if (!isActive) {
    return (
      <div className="absolute top-8 left-8 z-40">
        <button
          onClick={onStart}
          className="group flex items-center gap-3 text-white/60 transition-colors hover:text-white"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 transition-all group-hover:bg-white/10">
            <ChevronRight size={16} />
          </div>
          <span className="text-xs font-medium tracking-[0.2em] uppercase">
            Start Tour
          </span>
        </button>
      </div>
    )
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-40 flex flex-col justify-end p-8 pb-24 md:pb-12 md:pl-12">
      <AnimatePresence mode="wait">
        {showContent && (
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-auto flex w-full max-w-md flex-col gap-8"
          >
            {/* Step Counter */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-white/40 font-mono">
                {String(currentIndex + 1).padStart(2, '0')}
              </span>
              <div className="h-[1px] w-12 bg-white/20" />
              <span className="text-xs font-medium text-white/40 font-mono">
                {String(steps.length).padStart(2, '0')}
              </span>
            </div>

            {/* Content */}
            <div className="flex flex-col gap-4">
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 1.0, ease: "easeOut" }}
                className="text-4xl font-light tracking-tight text-white drop-shadow-lg"
              >
                {currentStep.title}
              </motion.h2>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 1.0 }}
                className="relative pl-4 border-l border-white/10"
              >
                  <p className="text-sm leading-relaxed text-white/70 tracking-wide font-light max-w-xs">
                    {currentStep.description}
                  </p>
              </motion.div>
            </div>

            {/* Controls */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 1.0 }}
              className="flex items-center gap-6 pt-2"
            >
              <button
                onClick={onPrev}
                disabled={currentIndex === 0}
                className="group flex h-12 w-12 items-center justify-center rounded-full border border-white/10 text-white/60 transition-all hover:bg-white/10 hover:border-white/30 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                aria-label="Previous Step"
              >
                <ChevronLeft size={18} className="transition-transform group-hover:-translate-x-0.5" />
              </button>

              <button
                onClick={currentIndex === steps.length - 1 ? onExit : onNext}
                className="group flex h-12 w-12 items-center justify-center rounded-full border border-white/10 text-white/80 transition-all hover:bg-white/10 hover:border-white/30"
                aria-label={currentIndex === steps.length - 1 ? "Finish Tour" : "Next Step"}
              >
                {currentIndex === steps.length - 1 ? (
                  <X size={18} />
                ) : (
                  <ChevronRight size={18} className="transition-transform group-hover:translate-x-0.5" />
                )}
              </button>

              <button
                onClick={onExit}
                className="ml-auto text-[10px] font-medium tracking-[0.2em] text-white/30 transition-colors hover:text-white/60 uppercase"
              >
                Exit Tour
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
