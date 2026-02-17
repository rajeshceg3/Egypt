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
  const sandSourceRef = useRef<AudioBufferSourceNode | null>(null)

  // Gust Logic Refs
  const lastGustTimeRef = useRef<number>(0)
  const nextGustIntervalRef = useRef<number>(15) // First gust after 15s
  const isGustingRef = useRef<boolean>(false)
  const gustDurationRef = useRef<number>(0)

  // Granular Cluster Refs (Micro-Avalanches)
  const clusterRef = useRef<{ active: boolean, endTime: number }>({ active: false, endTime: 0 })

  const requestRef = useRef<number | null>(null)
  const stopTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const buffersRef = useRef<{ white: AudioBuffer | null, brown: AudioBuffer | null, reverb: AudioBuffer | null }>({ white: null, brown: null, reverb: null })

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
    const duration = 2.5; // ULTRATHINK: Extended to 2.5s for expansive vastness
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
    // ULTRATHINK: Use performance.now() for global synchronization with Camera Rig
    const globalTime = performance.now() / 1000;

    // --- GUST LOGIC ---
    if (time - lastGustTimeRef.current > nextGustIntervalRef.current) {
        isGustingRef.current = true
        lastGustTimeRef.current = time
        gustDurationRef.current = 4.0 + Math.random() * 4.0 // 4-8s duration
        nextGustIntervalRef.current = 20.0 + Math.random() * 40.0 // 20-60s wait
    }

    let gustStrength = 0;
    if (isGustingRef.current) {
        const gustTime = time - lastGustTimeRef.current;
        if (gustTime < gustDurationRef.current) {
             // Simple sine envelope (0 -> 1 -> 0)
             gustStrength = Math.sin((gustTime / gustDurationRef.current) * Math.PI);
             // Make it peaky
             gustStrength = Math.pow(gustStrength, 2);
        } else {
            isGustingRef.current = false;
        }
    }

    // 1. Deep Rumble (Pyramid Presence) - Synchronized Breathing
    if (rumbleGainRef.current) {
      // ULTRATHINK: Synced with Camera Rig (12s cycle)
      // Inhale (4s) -> Hold (2s) -> Exhale (4s) -> Pause (2s)
      const cycle = (globalTime % 12.0) / 12.0;
      let breathPhase = 0;
      if (cycle < 0.3333) { // Inhale (4s) - Smooth sine rise
          breathPhase = Math.sin((cycle / 0.3333) * Math.PI * 0.5);
      } else if (cycle < 0.5) { // Hold (2s) - Stay at peak
          breathPhase = 1.0;
      } else if (cycle < 0.8333) { // Exhale (4s) - Cosine fall
          breathPhase = Math.cos(((cycle - 0.5) / 0.3333) * Math.PI * 0.5);
      } else { // Pause (2s) - Stay at bottom
          breathPhase = 0.0;
      }

      // Ultrathink: Natural Amplitude Modulation (Matches Camera Rig)
      // Real breathing depth varies over time (calm vs deep).
      const breathAmp = 0.15 + Math.sin(globalTime * 0.05) * 0.05;

      // Base rumble + Breath modulation + Gusts
      // We map the visual breath amplitude (0.1-0.2) to audio gain modulation (approx 0.05-0.15)
      const rumble = 0.15 + breathPhase * (breathAmp * 0.5) + gustStrength * 0.1;
      rumbleGainRef.current.gain.setTargetAtTime(rumble, time, 0.1)
    }

    // 2. Main Wind (Mid-Low) - Omnidirectional, constant
    if (windFilterRef.current && windGainRef.current && windPannerRef.current) {
      // Filter sweep
      const baseFreq = 300 + Math.sin(time * 0.1) * 100 + Math.sin(time * 0.05) * 50
      windFilterRef.current.frequency.setTargetAtTime(baseFreq + gustStrength * 400, time, 0.2)

      // Gusts
      const baseGain = 0.1 + Math.max(0, Math.sin(time * 0.15) * 0.1)
      windGainRef.current.gain.setTargetAtTime(baseGain + gustStrength * 0.3, time, 0.2)

      // Slow Panning - Swirling effect
      const pan = Math.sin(time * 0.05) * 0.4
      windPannerRef.current.pan.setTargetAtTime(pan, time, 0.1)
    }

    // 3. High Whistle (Sand moving) - Directional, sharp
    if (highWindFilterRef.current && highWindGainRef.current && highWindPannerRef.current) {
      // Whistling frequency
      const whistleFreq = 800 + Math.sin(time * 0.2) * 400 + Math.sin(time * 1.5) * 100
      highWindFilterRef.current.frequency.setTargetAtTime(whistleFreq + gustStrength * 200, time, 0.05)

      // Sharp Gusts
      const sharpGust = Math.max(0, Math.sin(time * 0.3) * Math.sin(time * 1.1)) * 0.15
      highWindGainRef.current.gain.setTargetAtTime(sharpGust + gustStrength * 0.2, time, 0.05)

      // Fast Panning (whipping around)
      const fastPan = Math.sin(time * 0.4) * 0.8
      highWindPannerRef.current.pan.setTargetAtTime(fastPan, time, 0.1)
    }

    // 4. Granular Sand (Texture) - Intermittent swishes
    if (sandGainRef.current && sandPannerRef.current && sandSourceRef.current) {
      // Complex wave for unpredictability
      const wave = Math.sin(time * 0.7) + Math.sin(time * 0.35) + Math.cos(time * 1.1);

      // ULTRATHINK: Granular Synthesis (Crunch)
      // We simulate individual sand grains colliding.
      // Instead of a smooth hiss, we use high-probability chaotic modulation.

      // 1. Base wind force (carrier)
      const windForce = Math.max(0, (wave - 1.0) * 0.4);

      // 2. Grain Impact Logic (Ultrathink: Granular Clusters)
      // Instead of single random impacts, we simulate "micro-avalanches"
      // A primary trigger starts a cluster, during which multiple impacts occur.

      // Check for Cluster Trigger (Very rare, high impact)
      if (!clusterRef.current.active && Math.random() > 0.995) {
          clusterRef.current.active = true;
          clusterRef.current.endTime = time + 0.1 + Math.random() * 0.2; // 100-300ms burst
      }

      // Check if cluster is active
      if (clusterRef.current.active && time > clusterRef.current.endTime) {
          clusterRef.current.active = false;
      }

      // Probability density: High during cluster, Low otherwise
      const impactThreshold = clusterRef.current.active ? 0.3 : 0.98;
      const grainRand = Math.random();

      // Calculate impact amplitude
      let grainImpact = 0;
      if (grainRand > impactThreshold) {
          // During cluster, impacts are varied. Outside, they are rare peaks.
          grainImpact = Math.random() * 5.0;
      }

      // Combined Gain: Wind drives the density, Impact drives the transient
      // Cluster adds a "hiss" floor as well
      const clusterFloor = clusterRef.current.active ? 0.2 : 0.0;
      const totalSand = windForce * 0.15 + (grainImpact * 0.15 * windForce) + gustStrength * 0.1 + clusterFloor * 0.1;

      // Apply with very fast time constant for crispness
      // Ultrathink: Reduced from 0.002 to 0.001 for hyper-real tactile crunch
      sandGainRef.current.gain.setTargetAtTime(totalSand, time, 0.001);

      // Wide Panning
      const pan = Math.cos(time * 0.15) * 0.9;
      sandPannerRef.current.pan.setTargetAtTime(pan, time, 0.1);

      // Granular variation: Modulate playback rate chaotically
      // When an impact happens, we jump the pitch to simulate different grain sizes
      if (grainImpact > 0.5 || clusterRef.current.active) {
          const rateVar = 0.6 + Math.random() * 1.4; // 0.6x to 2.0x speed
          sandSourceRef.current.playbackRate.setValueAtTime(rateVar, time);

          // Randomize filter to simulate different material interactions (stone vs sand)
          if (sandFilterRef.current) {
              // Ultrathink: Expanded range (200Hz - 12k) for fuller spectrum texture
              const freqVar = 200 + Math.random() * 11800;
              sandFilterRef.current.frequency.setValueAtTime(freqVar, time);
          }
      }
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
    if (stopTimeoutRef.current) {
      clearTimeout(stopTimeoutRef.current)
      stopTimeoutRef.current = null
    }

    if (!audioCtxRef.current) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      audioCtxRef.current = new AudioContextClass()
      const ctx = audioCtxRef.current

      // Generate buffers only if they don't exist
      if (!buffersRef.current.white) {
          buffersRef.current.white = createNoiseBuffer(ctx, 'white')
          buffersRef.current.brown = createNoiseBuffer(ctx, 'brown')
          buffersRef.current.reverb = createReverbImpulse(ctx)
      }

      // --- REVERB: Spatial Vastness ---
      const reverbNode = ctx.createConvolver();
      reverbNode.buffer = buffersRef.current.reverb;
      const reverbGain = ctx.createGain();
      reverbGain.gain.value = 0.6; // Increased to 60% Wet signal for vaster landscape
      reverbNode.connect(reverbGain);
      reverbGain.connect(ctx.destination);


      // --- LAYER 1: DEEP RUMBLE (Brown Noise) ---
      const rumbleSource = ctx.createBufferSource()
      rumbleSource.buffer = buffersRef.current.brown
      rumbleSource.loop = true

      const rumbleFilter = ctx.createBiquadFilter()
      rumbleFilter.type = 'lowpass'
      // Ultrathink: Lowered to 80Hz for sub-bass "felt in chest" sensation
      rumbleFilter.frequency.value = 80

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
      windSource.buffer = buffersRef.current.white
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
      highWindSource.buffer = buffersRef.current.white
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
      highWindSource.start()

      // --- LAYER 4: GRANULAR SAND (White Noise -> Highpass) ---
      const sandSource = ctx.createBufferSource()
      sandSourceRef.current = sandSource
      sandSource.buffer = buffersRef.current.white
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
      const now = audioCtxRef.current.currentTime

      // Cancel any scheduled values to ensure clean ramp
      rumbleGainRef.current?.gain.cancelScheduledValues(now)
      windGainRef.current?.gain.cancelScheduledValues(now)
      highWindGainRef.current?.gain.cancelScheduledValues(now)
      sandGainRef.current?.gain.cancelScheduledValues(now)

      // Set current value explicitly before ramping to avoid jumps
      rumbleGainRef.current?.gain.setValueAtTime(rumbleGainRef.current.gain.value, now)
      windGainRef.current?.gain.setValueAtTime(windGainRef.current.gain.value, now)
      highWindGainRef.current?.gain.setValueAtTime(highWindGainRef.current.gain.value, now)
      sandGainRef.current?.gain.setValueAtTime(sandGainRef.current.gain.value, now)

      rumbleGainRef.current?.gain.exponentialRampToValueAtTime(0.001, now + 1)
      windGainRef.current?.gain.exponentialRampToValueAtTime(0.001, now + 1)
      highWindGainRef.current?.gain.exponentialRampToValueAtTime(0.001, now + 1)
      sandGainRef.current?.gain.exponentialRampToValueAtTime(0.001, now + 1)

      stopTimeoutRef.current = setTimeout(() => {
        audioCtxRef.current?.suspend()
      }, 1000)
    }
    setIsPlaying(false)
  }

  const toggleAudio = () => {
    if (isPlaying) stopAmbience()
    else startAmbience()
  }

  // Jony Ive aesthetic: Minimalist, high contrast, perfect circles
  return (
    <button
      {...props}
      onClick={toggleAudio}
      className={`fixed bottom-8 right-8 z-50 flex h-14 w-14 items-center justify-center rounded-full text-white/90 transition-all duration-700 ease-out active:scale-95 ${
        isPlaying ? 'bg-white/5 hover:bg-white/10' : 'bg-transparent hover:bg-white/5'
      } ${props.className || ''}`}
      aria-label={isPlaying ? "Mute" : "Unmute"}
    >
        {/* Subtle ring indicator */}
        <div className={`absolute inset-0 rounded-full border border-white/20 transition-all duration-700 ${isPlaying ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`} />
      {isPlaying ? <Volume2 strokeWidth={1} size={24} /> : <VolumeX strokeWidth={1} size={24} />}
    </button>
  )
})

AudioAmbience.displayName = 'AudioAmbience'
