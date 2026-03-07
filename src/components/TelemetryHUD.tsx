'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getBreathPhase } from '../utils/breathCycle'

export function TelemetryHUD() {
  const [time, setTime] = useState(0)
  const [windSpeed, setWindSpeed] = useState(14.2)
  const [temp, setTemp] = useState(38.4)
  const [pressure, setPressure] = useState(1012.1)

  useEffect(() => {
    let animationFrameId: number

    const updateTelemetry = () => {
      const t = performance.now() / 1000
      setTime(t)

      // Animate fake telemetry
      const breath = getBreathPhase(t)

      // Wind speed tied slightly to the breath cycle to feel "organic"
      const targetWind = 14.2 + Math.sin(t * 0.5) * 4.0 + breath * 2.0
      setWindSpeed((prev) => prev + (targetWind - prev) * 0.05)

      // Temperature slowly rising/fluctuating
      const targetTemp = 38.4 + Math.sin(t * 0.1) * 0.5
      setTemp((prev) => prev + (targetTemp - prev) * 0.01)

      // Pressure slowly drifting
      const targetPressure = 1012.1 + Math.cos(t * 0.05) * 1.5
      setPressure((prev) => prev + (targetPressure - prev) * 0.02)

      animationFrameId = requestAnimationFrame(updateTelemetry)
    }

    updateTelemetry()

    return () => cancelAnimationFrame(animationFrameId)
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex flex-col justify-between p-8 sm:p-12 font-mono text-[10px] sm:text-xs text-white/50 tracking-[0.2em] uppercase">
      {/* Top Bar */}
      <div className="flex justify-between items-start">
        {/* Top Left: Coordinates & Compass */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 3, duration: 1.5, ease: "easeOut" }}
          className="flex flex-col gap-2"
        >
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 flex items-center justify-center rounded-full border border-white/20">
              <motion.div
                className="w-[1px] h-3 bg-[#FFD700] absolute top-1"
                animate={{ rotate: Math.sin(time * 0.2) * 5 }}
                transition={{ duration: 0, ease: "linear" }}
              />
              <span className="text-[8px] absolute">N</span>
            </div>
            <div className="flex flex-col">
              <span className="text-white/80">29°58′45″N</span>
              <span>31°08′03″E</span>
            </div>
          </div>
          <div className="h-[1px] w-24 bg-white/20 mt-1" />
          <span className="text-[8px] text-[#FFD700]/70">GIZA PLATEAU SECURE</span>
        </motion.div>

        {/* Top Right: Environment Telemetry */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 3.5, duration: 1.5, ease: "easeOut" }}
          className="flex flex-col items-end gap-1 text-right"
        >
          <div className="flex gap-4">
            <span className="opacity-50">WIND</span>
            <span className="text-white/80 w-16">{windSpeed.toFixed(1)} KTS</span>
          </div>
          <div className="flex gap-4">
            <span className="opacity-50">TEMP</span>
            <span className="text-white/80 w-16">{temp.toFixed(1)} °C</span>
          </div>
          <div className="flex gap-4">
            <span className="opacity-50">PRES</span>
            <span className="text-white/80 w-16">{pressure.toFixed(1)} hPa</span>
          </div>
          <div className="h-[1px] w-32 bg-white/20 mt-2 mb-1" />
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${Math.sin(time * 2) > 0 ? 'bg-green-500/50' : 'bg-green-500/20'}`} />
            <span className="text-[8px]">SYS. NOMINAL</span>
          </div>
        </motion.div>
      </div>

      {/* Bottom Bar */}
      <div className="flex justify-between items-end">
        {/* Bottom Left: Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 4, duration: 1.5, ease: "easeOut" }}
          className="flex flex-col gap-3 max-w-sm font-sans"
        >
          <h2 className="text-2xl font-light tracking-widest text-white/90 uppercase">
            Khufu Horizon
          </h2>
          <p className="text-[10px] leading-relaxed tracking-widest text-white/40 uppercase font-mono">
            T= {time.toFixed(2)}s <br/>
            ELEV= 59.3m AMSL <br/>
            EPOCH= 2560 BCE
          </p>
        </motion.div>
      </div>
    </div>
  )
}
