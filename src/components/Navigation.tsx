'use client'

import { useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { getTerrainHeight } from '../utils/noise'
import { getBreathPhase } from '../utils/breathCycle'

// Pyramid Collision Data (World X, Z, Radius)
const OBSTACLES = [
  { x: 0, z: 0, r: 7.0 },       // Khufu (Size ~11.3)
  { x: -12, z: -12, r: 6.5 },   // Khafre (Size ~10.2)
  { x: 10, z: 8, r: 4.0 },      // Menkaure (Size ~4.8)
]

const PLAYER_HEIGHT = 1.8
const WALK_SPEED = 5.0
const RUN_SPEED = 9.0
const JUMP_FORCE = 5.0
const GRAVITY = 15.0
const DAMPING = 5.0 // Ultrathink: Reduced from 10.0 for "drifty" float feel
const MOUSE_SENSITIVITY = 0.002
const TOUCH_LOOK_SENSITIVITY = 0.005
const JOYSTICK_MAX_RADIUS = 50

export function Navigation() {
  const { gl } = useThree()

  // Mutable State
  const position = useRef(new THREE.Vector3(20, 6, 20)) // Start pos from original CameraRig
  const velocity = useRef(new THREE.Vector3(0, 0, 0))

  // Rotation (Euler angles in radians)
  // yaw (y-axis), pitch (x-axis)
  const rotation = useRef({ yaw: Math.PI * 1.25, pitch: 0 }) // Look towards center

  const inputs = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    sprint: false,
  })

  const isLocked = useRef(false)

  // Touch State
  const touchState = useRef({
    leftId: null as number | null,
    leftOrigin: { x: 0, y: 0 },
    leftCurrent: { x: 0, y: 0 }, // Joystick vector relative to origin

    rightId: null as number | null,
    rightLast: { x: 0, y: 0 },
  })

  // Setup Event Listeners
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': inputs.current.forward = true; break
        case 'KeyS': inputs.current.backward = true; break
        case 'KeyA': inputs.current.left = true; break
        case 'KeyD': inputs.current.right = true; break
        case 'Space': inputs.current.jump = true; break
        case 'ShiftLeft': inputs.current.sprint = true; break
      }
    }

    const onKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': inputs.current.forward = false; break
        case 'KeyS': inputs.current.backward = false; break
        case 'KeyA': inputs.current.left = false; break
        case 'KeyD': inputs.current.right = false; break
        case 'Space': inputs.current.jump = false; break
        case 'ShiftLeft': inputs.current.sprint = false; break
      }
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!isLocked.current) return
      rotation.current.yaw -= e.movementX * MOUSE_SENSITIVITY
      rotation.current.pitch -= e.movementY * MOUSE_SENSITIVITY

      // Clamp pitch
      rotation.current.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, rotation.current.pitch))
    }

    const onPointerLockChange = () => {
      isLocked.current = document.pointerLockElement === gl.domElement
    }

    const onClick = () => {
      // Only lock if not already locked and clicking canvas
      if (!isLocked.current) {
        gl.domElement.requestPointerLock()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('pointerlockchange', onPointerLockChange)
    gl.domElement.addEventListener('click', onClick)

    // Touch Handling
    const canvas = gl.domElement

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i]
        const halfWidth = window.innerWidth / 2

        if (t.clientX < halfWidth) {
          // Left Side: Joystick
          if (touchState.current.leftId === null) {
            touchState.current.leftId = t.identifier
            touchState.current.leftOrigin = { x: t.clientX, y: t.clientY }
            touchState.current.leftCurrent = { x: 0, y: 0 }
          }
        } else {
          // Right Side: Look
          if (touchState.current.rightId === null) {
            touchState.current.rightId = t.identifier
            touchState.current.rightLast = { x: t.clientX, y: t.clientY }
          }
        }
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i]

        if (t.identifier === touchState.current.leftId) {
          // Update Joystick
          let dx = t.clientX - touchState.current.leftOrigin.x
          let dy = t.clientY - touchState.current.leftOrigin.y

          // Clamp magnitude
          const dist = Math.sqrt(dx*dx + dy*dy)
          if (dist > JOYSTICK_MAX_RADIUS) {
            const ratio = JOYSTICK_MAX_RADIUS / dist
            dx *= ratio
            dy *= ratio
          }

          touchState.current.leftCurrent = { x: dx, y: dy }
        }

        if (t.identifier === touchState.current.rightId) {
          // Update Look
          const dx = t.clientX - touchState.current.rightLast.x
          const dy = t.clientY - touchState.current.rightLast.y

          rotation.current.yaw -= dx * TOUCH_LOOK_SENSITIVITY
          rotation.current.pitch -= dy * TOUCH_LOOK_SENSITIVITY
          rotation.current.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, rotation.current.pitch))

          touchState.current.rightLast = { x: t.clientX, y: t.clientY }
        }
      }
    }

    const onTouchEnd = (e: TouchEvent) => {
      e.preventDefault()
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i]
        if (t.identifier === touchState.current.leftId) {
          touchState.current.leftId = null
          touchState.current.leftCurrent = { x: 0, y: 0 }
        }
        if (t.identifier === touchState.current.rightId) {
          touchState.current.rightId = null
        }
      }
    }

    canvas.addEventListener('touchstart', onTouchStart, { passive: false })
    canvas.addEventListener('touchmove', onTouchMove, { passive: false })
    canvas.addEventListener('touchend', onTouchEnd)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('pointerlockchange', onPointerLockChange)
      gl.domElement.removeEventListener('click', onClick)

      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('touchend', onTouchEnd)
    }
  }, [gl.domElement])

  // Physics Loop
  useFrame((state, delta) => {
    // 1. Calculate Input Vector
    const move = new THREE.Vector3(0, 0, 0)

    // Keyboard
    if (inputs.current.forward) move.z -= 1
    if (inputs.current.backward) move.z += 1
    if (inputs.current.left) move.x -= 1
    if (inputs.current.right) move.x += 1

    // Joystick
    if (touchState.current.leftId !== null) {
      // Normalize joystick input (-1 to 1)
      const jx = touchState.current.leftCurrent.x / JOYSTICK_MAX_RADIUS
      const jy = touchState.current.leftCurrent.y / JOYSTICK_MAX_RADIUS
      move.x += jx
      move.z += jy
    }

    // Normalize if needed (limit speed)
    if (move.length() > 1) move.normalize()

    // Rotate move vector by camera yaw
    move.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotation.current.yaw)

    // 2. Physics Update
    const speed = inputs.current.sprint ? RUN_SPEED : WALK_SPEED

    // Acceleration
    // On ground: tight control. In air: loose control.
    // Simplifying to always tight control for exploration feel
    velocity.current.x += move.x * speed * DAMPING * delta
    velocity.current.z += move.z * speed * DAMPING * delta

    // Gravity
    velocity.current.y -= GRAVITY * delta

    // Jump
    // Check if on ground (simplified check against terrain height)
    const terrainHeight = getTerrainHeight(position.current.x, position.current.z)
    const groundY = terrainHeight + PLAYER_HEIGHT
    const onGround = position.current.y <= groundY + 0.1

    if (inputs.current.jump && onGround) {
       velocity.current.y = JUMP_FORCE
    }

    // Damping (Friction)
    const dampingFactor = Math.exp(-DAMPING * delta)
    velocity.current.x *= dampingFactor
    velocity.current.z *= dampingFactor

    // Apply Velocity
    position.current.x += velocity.current.x * delta
    position.current.y += velocity.current.y * delta
    position.current.z += velocity.current.z * delta

    // 3. Collision Detection

    // Terrain Collision
    // Re-check terrain height at new position
    const newTerrainHeight = getTerrainHeight(position.current.x, position.current.z)
    const newGroundY = newTerrainHeight + PLAYER_HEIGHT

    if (position.current.y < newGroundY) {
      position.current.y = newGroundY
      velocity.current.y = 0 // Stop falling
    }

    // Pyramid Collision (Circle)
    for (const obs of OBSTACLES) {
      const dx = position.current.x - obs.x
      const dz = position.current.z - obs.z
      const dist = Math.sqrt(dx*dx + dz*dz)

      if (dist < obs.r) {
        // Push out
        const angle = Math.atan2(dz, dx)
        position.current.x = obs.x + Math.cos(angle) * obs.r
        position.current.z = obs.z + Math.sin(angle) * obs.r

        // Kill velocity into the wall (dot product)
        // Normal vector
        const nx = Math.cos(angle)
        const nz = Math.sin(angle)
        const vDotN = velocity.current.x * nx + velocity.current.z * nz
        if (vDotN < 0) {
          velocity.current.x -= vDotN * nx
          velocity.current.z -= vDotN * nz
        }
      }
    }

    // 4. Update Camera

    // "Ultrathink" Sway Logic (Bio-Rhythmic)
    const t = performance.now() / 1000
    const breathPhase = getBreathPhase(t)

    const breathAmp = 0.05 + Math.sin(t * 0.05) * 0.02
    // Ultrathink: Add continuous hover sway (independent of breath) for "anti-gravity" feel
    const hoverY = Math.sin(t * 0.5) * 0.05
    const breathY = breathPhase * breathAmp + hoverY

    // Head Bob (Based on horizontal speed)
    const hSpeed = Math.sqrt(velocity.current.x**2 + velocity.current.z**2)
    const bobFreq = inputs.current.sprint ? 14 : 8
    const bobAmp = inputs.current.sprint ? 0.15 : 0.08
    const headBobY = Math.sin(t * bobFreq) * bobAmp * (Math.min(hSpeed, RUN_SPEED) / RUN_SPEED)

    // Drift/Tremor (Ultrathink: Reduced for relaxation)
    // Decreased significantly (0.2x multiplier) to avoid "caffeinated" feel
    const muscleTremor = (Math.sin(t * 0.5) * 0.0005 + Math.cos(t * 0.3) * 0.0005) * 0.2

    // Heartbeat (Removed for pure relaxation - distraction removal)
    // const beatPhase = (t % 1.0)
    // const beat = (Math.exp(-beatPhase * 10.0) + 0.6 * Math.exp(-(beatPhase - 0.2) * 10.0) * (beatPhase >= 0.2 ? 1.0 : 0.0)) * 0.0002

    // Apply position
    state.camera.position.x = position.current.x
    state.camera.position.y = position.current.y + breathY + headBobY
    state.camera.position.z = position.current.z

    // Apply rotation
    const quaternion = new THREE.Quaternion()
    quaternion.setFromEuler(new THREE.Euler(rotation.current.pitch, rotation.current.yaw, 0, 'YXZ'))
    state.camera.quaternion.copy(quaternion)

    // Apply subtle rotation sway
    state.camera.rotation.z += Math.sin(t * 0.12) * 0.002 + muscleTremor
    state.camera.rotation.x += Math.sin(t * 0.09) * 0.001
  })

  return null
}
