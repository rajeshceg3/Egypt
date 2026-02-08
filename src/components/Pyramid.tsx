'use client'

import React from 'react'

export function Pyramid() {
  // Accurate Giza Proportions (Scaled)

  // Khufu (Great Pyramid)
  // Base ~230m, Height ~146m
  // Scale: 1 unit = ~30m
  // Base Side: 8 units
  // Radius (Corner to Center): 8 / sqrt(2) ≈ 5.66
  // Height: 146/30 ≈ 4.87

  // Khafre
  // Base ~215m, Height ~143m
  // Base Side: 7.2 units
  // Radius: 5.1
  // Height: 4.77

  // Menkaure
  // Base ~103m, Height ~65m
  // Base Side: 3.4 units
  // Radius: 2.4
  // Height: 2.17

  return (
    <group>
      {/* Khufu (Center) */}
      <mesh position={[0, 4.87 / 2, 0]} rotation={[0, Math.PI / 4, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0, 5.66, 4.87, 4, 1]} />
        <meshStandardMaterial
          color="#E8C690"
          roughness={0.9}
          metalness={0.1}
          flatShading
        />
      </mesh>

      {/* Khafre (Back Left) - Often looks taller due to higher ground, but we keep flat ground for now */}
      <mesh position={[-12, 4.77 / 2, -12]} rotation={[0, Math.PI / 4, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0, 5.1, 4.77, 4, 1]} />
        <meshStandardMaterial
          color="#E6C288"
          roughness={0.9}
          metalness={0.1}
          flatShading
        />
      </mesh>

      {/* Menkaure (Front Right) */}
      <mesh position={[10, 2.17 / 2, 8]} rotation={[0, Math.PI / 4, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0, 2.4, 2.17, 4, 1]} />
        <meshStandardMaterial
          color="#DAB878"
          roughness={0.9}
          metalness={0.1}
          flatShading
        />
      </mesh>

      {/* Infinite Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial color="#E6C288" roughness={1} metalness={0} />
      </mesh>
    </group>
  )
}
