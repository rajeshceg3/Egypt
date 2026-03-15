'use client'

import React, { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getBreathPhase } from '../utils/breathCycle'
import { useStore } from '../utils/store'

export function TelemetryHUD() {
  const { isLookingAtPyramid, distanceToPyramid } = useStore()

  // Refs for direct DOM updates to avoid React re-renders every frame
  const timeRef = useRef<HTMLSpanElement>(null)
  const windRef = useRef<HTMLSpanElement>(null)
  const tempRef = useRef<HTMLSpanElement>(null)
  const presRef = useRef<HTMLSpanElement>(null)
  const compassRef = useRef<HTMLDivElement>(null)
  const statusRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let animationFrameId: number

    // Maintain local state without triggering React renders
    let currentWind = 14.2
    let currentTemp = 38.4
    let currentPres = 1012.1

    const updateTelemetry = () => {
      const t = performance.now() / 1000

      const breath = getBreathPhase(t)

      // Only update values occasionally to simulate "ticking" mechanical telemetry
      // Wind speed tied slightly to the breath cycle to feel "organic"
      const targetWind = 14.2 + Math.sin(t * 0.5) * 4.0 + breath * 2.0
      const nextWind = currentWind + (targetWind - currentWind) * 0.05
      if (Math.abs(nextWind - currentWind) > 0.1) currentWind = nextWind

      // Temperature slowly rising/fluctuating
      const targetTemp = 38.4 + Math.sin(t * 0.1) * 0.5
      const nextTemp = currentTemp + (targetTemp - currentTemp) * 0.01
      if (Math.abs(nextTemp - currentTemp) > 0.05) currentTemp = nextTemp

      // Pressure slowly drifting
      const targetPressure = 1012.1 + Math.cos(t * 0.05) * 1.5
      const nextPres = currentPres + (targetPressure - currentPres) * 0.02
      if (Math.abs(nextPres - currentPres) > 0.1) currentPres = nextPres

      // Direct DOM Updates
      if (timeRef.current) timeRef.current.innerText = t.toFixed(2)
      if (windRef.current) windRef.current.innerText = currentWind.toFixed(1)
      if (tempRef.current) tempRef.current.innerText = currentTemp.toFixed(1)
      if (presRef.current) presRef.current.innerText = currentPres.toFixed(1)

      // Compass needle rotation
      if (compassRef.current) {
        const rotation = Math.sin(t * 0.2) * 5
        compassRef.current.style.transform = `rotate(${rotation}deg)`
      }

      // Status indicator blink
      if (statusRef.current) {
        statusRef.current.className = `w-1.5 h-1.5 rounded-full ${Math.sin(t * 2) > 0 ? 'bg-green-500/50' : 'bg-green-500/20'}`
      }

      animationFrameId = requestAnimationFrame(updateTelemetry)
    }

    updateTelemetry()

    return () => cancelAnimationFrame(animationFrameId)
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-8 sm:p-12 font-mono text-[10px] sm:text-xs text-white/50 tracking-[0.3em] uppercase">
      {/* Top Bar */}
      {/* Central Reticle */}
      <div className="fixed top-1/2 left-1/2 w-[2px] h-[2px] bg-white/40 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none mix-blend-screen" />

      <div className="flex justify-between items-start">
        {/* Top Left: Coordinates & Compass */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 4.5, duration: 1.5, ease: "easeOut" }}
          className="flex flex-col gap-2"
        >
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 100 100">
                <motion.circle
                  cx="50" cy="50" r="45"
                  fill="none" stroke="#ffffff" strokeWidth="2" strokeDasharray="4 8"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, ease: "linear", repeat: Infinity }}
                />
              </svg>
              <div
                ref={compassRef}
                className="w-[1px] h-3 bg-[#FFD700] absolute top-1"
              />
              <span className="text-[9px] absolute">N</span>
            </div>
            <div className="flex flex-col">
              <span className="text-white/40">29°58′45″N</span>
              <span className="text-white/40">31°08′03″E</span>
            </div>
          </div>
          <div className="h-[1px] w-24 bg-white/20 mt-1" />
          <span className="text-[9px] text-[#FFD700]/70">GIZA PLATEAU SECURE</span>
        </motion.div>

        {/* Top Right: Environment Telemetry */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 6, duration: 1.5, ease: "easeOut" }}
          className="flex flex-col items-end gap-1 text-right"
        >
          <div className="flex gap-4">
            <span className="opacity-50">WIND</span>
            <span className="text-white/80 w-16"><span ref={windRef}>14.2</span> KTS</span>
          </div>
          <div className="flex gap-4">
            <span className="opacity-50">TEMP</span>
            <span className="text-white/80 w-16"><span ref={tempRef}>38.4</span> °C</span>
          </div>
          <div className="flex gap-4">
            <span className="opacity-50">PRES</span>
            <span className="text-white/80 w-16"><span ref={presRef}>1012.1</span> hPa</span>
          </div>
          <div className="h-[1px] w-32 bg-white/20 mt-2 mb-1" />
          <div className="flex items-center gap-2">
            <div ref={statusRef} className="w-1.5 h-1.5 rounded-full bg-green-500/50" />
            <span className="text-[9px]">SYS. NOMINAL</span>
          </div>
        </motion.div>
      </div>

      {/* Bottom Bar */}
      <div className="flex justify-between items-end">
        {/* Bottom Left: Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isLookingAtPyramid ? 1 : 0.6, y: 0 }}
          transition={{ delay: 7.5, duration: 1.5, ease: "easeOut" }}
          className="flex flex-col gap-3 max-w-sm font-sans"
        >
          <h2 className="text-2xl font-light tracking-widest text-white/90 uppercase">
            Khufu Horizon
          </h2>
          <div className="text-[10px] leading-relaxed tracking-widest text-white/40 uppercase font-mono relative h-[60px]">
            T= <span ref={timeRef}>0.00</span>s <br/>
            <AnimatePresence mode="wait">
              {(distanceToPyramid < 40 && isLookingAtPyramid) ? (
                <motion.div
                  key="micro"
                  initial={{ opacity: 0, filter: "blur(4px)" }}
                  animate={{ opacity: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, filter: "blur(4px)" }}
                  transition={{ duration: 0.5 }}
                >
                  LIMESTONE COMPOSITION: 98% CaCO3 <br/>
                  ESTIMATED WEIGHT: 5.9M TONS
                </motion.div>
              ) : (
                <motion.div
                  key="macro"
                  initial={{ opacity: 0, filter: "blur(4px)" }}
                  animate={{ opacity: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, filter: "blur(4px)" }}
                  transition={{ duration: 0.5 }}
                >
                  ELEV= 59.3m AMSL <br/>
                  EPOCH= 2560 BCE
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
