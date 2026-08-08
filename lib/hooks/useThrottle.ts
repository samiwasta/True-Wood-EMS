import { useEffect, useRef, useState } from 'react'

export function useThrottle<T>(value: T, limitMs: number = 400): T {
  const [throttledValue, setThrottledValue] = useState<T>(value)
  const lastRanAt = useRef<number>(Date.now())

  useEffect(() => {
    const remaining = limitMs - (Date.now() - lastRanAt.current)

    if (remaining <= 0) {
      lastRanAt.current = Date.now()
      setThrottledValue(value)
      return
    }

    const timer = setTimeout(() => {
      lastRanAt.current = Date.now()
      setThrottledValue(value)
    }, remaining)

    return () => clearTimeout(timer)
  }, [value, limitMs])

  return throttledValue
}

export function throttle<T extends (...args: never[]) => unknown>(
  fn: T,
  limitMs: number
): (...args: Parameters<T>) => void {
  let lastCall = 0
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  let lastArgs: Parameters<T> | null = null

  return (...args: Parameters<T>) => {
    const now = Date.now()
    const remaining = limitMs - (now - lastCall)
    lastArgs = args

    if (remaining <= 0) {
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      lastCall = now
      fn(...args)
      return
    }

    if (timeoutId) return

    timeoutId = setTimeout(() => {
      lastCall = Date.now()
      timeoutId = null
      if (lastArgs) fn(...lastArgs)
    }, remaining)
  }
}
