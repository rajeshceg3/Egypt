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

  // Nodes
  const rumbleGainRef = useRef<GainNode | null>(null)
  const windGainRef = useRef<GainNode | null>(null)
  const windFilterRef = useRef<BiquadFilterNode | null>(null)
  const windPannerRef = useRef<StereoPannerNode | null>(null)

  const highWindGainRef = useRef<GainNode | null>(null)
  const highWindFilterRef = useRef<BiquadFilterNode | null>(null)
  const highWindPannerRef = useRef<StereoPannerNode | null>(null)

  // Granular Sand Layer
  const sandGainRef = useRef<GainNode | null>(null)
  const sandFilterRef = useRef<BiquadFilterNode | null>(null)
  const sandPannerRef = useRef<StereoPannerNode | null>(null)

  const requestRef = useRef<number | null>(null)

  useImperativeHandle(ref, () => ({
    startAudio: () => startAmbience(),
    stopAudio: () => stopAmbience()
  }))

  const createNoiseBuffer = (ctx: AudioContext, type: 'white' | 'brown') => {
    const bufferSize = 2 * ctx.sampleRate
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const output = buffer.getChannelData(0)

    if (type === 'white') {
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1
      }
    } else {
      // Brown noise: integrate white noise
      let lastOut = 0
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1
        output[i] = (lastOut + (0.02 * white)) / 1.02
        lastOut = output[i]
        output[i] *= 3.5 // Compensate for gain loss
      }
    }
    return buffer
  }

  // Create an impulse response for a vast, open desert (diffuse reverb)
  const createReverbImpulse = (ctx: AudioContext) => {
    const duration = 2.5; // Seconds
    const decay = 2.0;
    const rate = ctx.sampleRate;
    const length = rate * duration;
    const impulse = ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
        const n = i / rate;
        // Exponential decay
        const envelope = Math.pow(1 - n / duration, decay);

        // White noise
        left[i] = (Math.random() * 2 - 1) * envelope;
        right[i] = (Math.random() * 2 - 1) * envelope;
    }
    return impulse;
  }

  const animateAmbience = () => {
    if (!audioCtxRef.current) return
    const time = audioCtxRef.current.currentTime

    // 1. Deep Rumble (Pyramid Presence) - Slow, heavy breathing
    if (rumbleGainRef.current) {
      // Subtle oscillation to feel like "earth breathing"
      const rumble = 0.15 + Math.sin(time * 0.2) * 0.05
      rumbleGainRef.current.gain.setTargetAtTime(rumble, time, 0.1)
    }

    // 2. Main Wind (Mid-Low) - Omnidirectional, constant
    if (windFilterRef.current && windGainRef.current && windPannerRef.current) {
      // Filter sweep
      const freq = 300 + Math.sin(time * 0.1) * 100 + Math.sin(time * 0.05) * 50
      windFilterRef.current.frequency.setTargetAtTime(freq, time, 0.1)

      // Gusts
      const gust = 0.1 + Math.max(0, Math.sin(time * 0.15) * 0.1)
      windGainRef.current.gain.setTargetAtTime(gust, time, 0.1)

      // Slow Panning - Swirling effect
      const pan = Math.sin(time * 0.05) * 0.4
      windPannerRef.current.pan.setTargetAtTime(pan, time, 0.1)
    }

    // 3. High Whistle (Sand moving) - Directional, sharp
    if (highWindFilterRef.current && highWindGainRef.current && highWindPannerRef.current) {
      // Whistling frequency
      const whistleFreq = 800 + Math.sin(time * 0.2) * 400 + Math.sin(time * 1.5) * 100
      highWindFilterRef.current.frequency.setTargetAtTime(whistleFreq, time, 0.05)

      // Sharp Gusts
      const sharpGust = Math.max(0, Math.sin(time * 0.3) * Math.sin(time * 1.1)) * 0.15
      highWindGainRef.current.gain.setTargetAtTime(sharpGust, time, 0.05)

      // Fast Panning (whipping around)
      const fastPan = Math.sin(time * 0.4) * 0.8
      highWindPannerRef.current.pan.setTargetAtTime(fastPan, time, 0.1)
    }

    // 4. Granular Sand (Texture) - Intermittent swishes
    if (sandGainRef.current && sandPannerRef.current) {
      // Complex wave for unpredictability
      const wave = Math.sin(time * 0.7) + Math.sin(time * 0.35) + Math.cos(time * 1.1);
      // Only play when waves overlap significantly (sparse)
      const sandVol = Math.max(0, (wave - 1.2) * 0.08);

      // Add randomness for "grains" hitting
      const jitter = Math.random() * 0.005;
      sandGainRef.current.gain.setTargetAtTime(sandVol + jitter, time, 0.05);

      // Wide Panning
      const pan = Math.cos(time * 0.15) * 0.9;
      sandPannerRef.current.pan.setTargetAtTime(pan, time, 0.1);
    }

    requestRef.current = requestAnimationFrame(animateAmbience)
  }

  useEffect(() => {
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
      if (audioCtxRef.current) audioCtxRef.current.close()
    }
  }, [])

  const startAmbience = () => {
    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      audioCtxRef.current = new AudioContextClass()
      const ctx = audioCtxRef.current

      // Buffers
      const whiteBuffer = createNoiseBuffer(ctx, 'white')
      const brownBuffer = createNoiseBuffer(ctx, 'brown')

      // --- REVERB: Spatial Vastness ---
      const reverbNode = ctx.createConvolver();
      reverbNode.buffer = createReverbImpulse(ctx);
      const reverbGain = ctx.createGain();
      reverbGain.gain.value = 0.4; // 40% Wet signal for that "big" sound
      reverbNode.connect(reverbGain);
      reverbGain.connect(ctx.destination);


      // --- LAYER 1: DEEP RUMBLE (Brown Noise) ---
      const rumbleSource = ctx.createBufferSource()
      rumbleSource.buffer = brownBuffer
      rumbleSource.loop = true

      const rumbleFilter = ctx.createBiquadFilter()
      rumbleFilter.type = 'lowpass'
      rumbleFilter.frequency.value = 120

      rumbleGainRef.current = ctx.createGain()
      rumbleGainRef.current.gain.value = 0.0 // Start silent, ramp up in animate

      rumbleSource.connect(rumbleFilter)
      rumbleFilter.connect(rumbleGainRef.current)
      rumbleGainRef.current.connect(ctx.destination)
      // Send rumble to reverb for "distant thunder" feel
      rumbleGainRef.current.connect(reverbNode);

      rumbleSource.start()

      // --- LAYER 2: DESERT WIND (White Noise -> Lowpass) ---
      const windSource = ctx.createBufferSource()
      windSource.buffer = whiteBuffer
      windSource.loop = true

      windFilterRef.current = ctx.createBiquadFilter()
      windFilterRef.current.type = 'lowpass'
      windFilterRef.current.Q.value = 0.5

      windPannerRef.current = ctx.createStereoPanner()

      windGainRef.current = ctx.createGain()
      windGainRef.current.gain.value = 0.0

      windSource.connect(windFilterRef.current)
      windFilterRef.current.connect(windPannerRef.current)
      windPannerRef.current.connect(windGainRef.current)
      windGainRef.current.connect(ctx.destination)
      // Send wind to reverb for "airiness"
      windGainRef.current.connect(reverbNode);

      windSource.start()

      // --- LAYER 3: HIGH WHISTLE (White Noise -> Bandpass) ---
      const highWindSource = ctx.createBufferSource()
      highWindSource.buffer = whiteBuffer
      highWindSource.loop = true

      highWindFilterRef.current = ctx.createBiquadFilter()
      highWindFilterRef.current.type = 'bandpass'
      highWindFilterRef.current.Q.value = 4.0 // High Q for whistling

      highWindPannerRef.current = ctx.createStereoPanner()

      highWindGainRef.current = ctx.createGain()
      highWindGainRef.current.gain.value = 0.0

      highWindSource.connect(highWindFilterRef.current)
      highWindFilterRef.current.connect(highWindPannerRef.current)
      highWindPannerRef.current.connect(highWindGainRef.current)
      highWindGainRef.current.connect(ctx.destination)
      // Whistle is directional, maybe less reverb or same?
      // Let's keep it dry/direct for clarity, or just a touch.
      // Let's leave it dry to contrast with the "vast" wind.
      highWindSource.start()

      // --- LAYER 4: GRANULAR SAND (White Noise -> Highpass) ---
      const sandSource = ctx.createBufferSource()
      sandSource.buffer = whiteBuffer
      sandSource.loop = true

      sandFilterRef.current = ctx.createBiquadFilter()
      sandFilterRef.current.type = 'highpass'
      sandFilterRef.current.frequency.value = 3000 // Only high hiss
      sandFilterRef.current.Q.value = 1.0

      sandPannerRef.current = ctx.createStereoPanner()

      sandGainRef.current = ctx.createGain()
      sandGainRef.current.gain.value = 0.0

      sandSource.connect(sandFilterRef.current)
      sandFilterRef.current.connect(sandPannerRef.current)
      sandPannerRef.current.connect(sandGainRef.current)
      sandGainRef.current.connect(ctx.destination)
      // Sand is very close (ASMR), keep it dry!
      sandSource.start()
    }

    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume()
    }

    if (!requestRef.current) {
      animateAmbience()
    }

    setIsPlaying(true)
  }

  const stopAmbience = () => {
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current)
      requestRef.current = null
    }

    if (audioCtxRef.current?.state === 'running') {
      // Ramp down gains before suspending to avoid clicks
      const now = audioCtxRef.current.currentTime

      // Cancel any scheduled scheduled values to ensure clean ramp
      rumbleGainRef.current?.gain.cancelScheduledValues(now)
      windGainRef.current?.gain.cancelScheduledValues(now)
      highWindGainRef.current?.gain.cancelScheduledValues(now)
      sandGainRef.current?.gain.cancelScheduledValues(now)

      rumbleGainRef.current?.gain.exponentialRampToValueAtTime(0.001, now + 1)
      windGainRef.current?.gain.exponentialRampToValueAtTime(0.001, now + 1)
      highWindGainRef.current?.gain.exponentialRampToValueAtTime(0.001, now + 1)
      sandGainRef.current?.gain.exponentialRampToValueAtTime(0.001, now + 1)

      setTimeout(() => {
        audioCtxRef.current?.suspend()
      }, 1000)
    }
    setIsPlaying(false)
  }

  const toggleAudio = () => {
    if (isPlaying) stopAmbience()
    else startAmbience()
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
