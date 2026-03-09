import { useState, useEffect } from 'react'

type StoreState = {
  isLookingAtPyramid: boolean
  distanceToPyramid: number
}

// Simple external state
let globalState: StoreState = {
  isLookingAtPyramid: false,
  distanceToPyramid: 100,
}

// Listeners
const listeners = new Set<(state: StoreState) => void>()

export const setStoreState = (newState: Partial<StoreState>) => {
  globalState = { ...globalState, ...newState }
  listeners.forEach((listener) => listener(globalState))
}

export const getStoreState = () => globalState

// Custom React hook to subscribe to the store
export function useStore() {
  const [state, setState] = useState(globalState)

  useEffect(() => {
    const listener = (newState: StoreState) => {
      setState(newState)
    }
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  return state
}
