export function getBreathPhase(time: number): number {
  // 12s total cycle: 4s Inhale, 2s Hold, 6s Exhale
  const cycle = (time % 12.0) / 12.0

  if (cycle < 0.3333) {
      // Inhale: 0s - 4s (0 - 0.3333) -> Map to 0 - 1 (PI/2)
      return Math.sin((cycle / 0.3333) * Math.PI * 0.5)
  } else if (cycle < 0.5) {
      // Hold: 4s - 6s (0.3333 - 0.5) -> 1.0
      return 1.0
  } else {
      // Exhale: 6s - 12s (0.5 - 1.0) -> Map to 1 - 0
      // (cycle - 0.5) / 0.5 goes from 0 to 1
      // cos(0 to PI/2) goes from 1 to 0
      return Math.cos(((cycle - 0.5) / 0.5) * Math.PI * 0.5)
  }
}
