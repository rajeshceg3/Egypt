'use client'

import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { Volume2, VolumeX } from 'lucide-react'

export interface AudioAmbienceHandle {
  startAudio: () => void
  stopAudio: () => void
}

export const AudioAmbience = forwardRef<AudioAmbienceHandle, React.HTMLAttributes<HTMLButtonElement>>((props, ref) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const filterRef = useRef<BiquadFilterNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)

  useImperativeHandle(ref, () => ({
    startAudio: () => startWind(),
    stopAudio: () => stopWind()
  }))

  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close()
        audioCtxRef.current = null
      }
    }
  }, [])

  const startWind = () => {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      audioCtxRef.current = new AudioContextClass()

      // Create white noise
      const bufferSize = 2 * audioCtxRef.current.sampleRate
      const noiseBuffer = audioCtxRef.current.createBuffer(1, bufferSize, audioCtxRef.current.sampleRate)
      const output = noiseBuffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1
      }

      const whiteNoise = audioCtxRef.current.createBufferSource()
      whiteNoise.buffer = noiseBuffer
      whiteNoise.loop = true

      // Filter noise to sound like wind (low pass with modulation)
      filterRef.current = audioCtxRef.current.createBiquadFilter()
      filterRef.current.type = 'lowpass'
      filterRef.current.frequency.value = 400
      filterRef.current.Q.value = 0.5

      gainRef.current = audioCtxRef.current.createGain()
      gainRef.current.gain.value = 0.1

      whiteNoise.connect(filterRef.current)
      filterRef.current.connect(gainRef.current)
      gainRef.current.connect(audioCtxRef.current.destination)

      whiteNoise.start()

      // Modulate filter frequency to simulate wind gusts
      const animateWind = () => {
        if (!filterRef.current || !audioCtxRef.current) return
        const time = audioCtxRef.current.currentTime
        filterRef.current.frequency.value = 400 + Math.sin(time * 0.2) * 200 + Math.sin(time * 0.7) * 100
        requestAnimationFrame(animateWind)
      }
      animateWind()
    }

    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume()
    }
    setIsPlaying(true)
  }

  const stopWind = () => {
    if (audioCtxRef.current && audioCtxRef.current.state === 'running') {
      audioCtxRef.current.suspend()
    }
    setIsPlaying(false)
  }

  const toggleAudio = () => {
    if (isPlaying) {
      stopWind()
    } else {
      startWind()
    }
  }

  return (
    <button
      {...props}
      onClick={toggleAudio}
      className={`fixed bottom-8 right-8 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all hover:bg-white/20 active:scale-95 ${props.className || ''}`}
      aria-label={isPlaying ? "Mute" : "Unmute"}
    >
      {isPlaying ? <Volume2 size={20} /> : <VolumeX size={20} />}
    </button>
  )
})

AudioAmbience.displayName = 'AudioAmbience'
