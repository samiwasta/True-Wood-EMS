import { useState, useEffect } from 'react'
import { AttendanceService } from '@/lib/services/attendance.service'

export function useTodayAbsentLeave() {
  const [count, setCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchCount() {
      try {
        setLoading(true)
        setError(null)
        const absentLeaveCount = await AttendanceService.getTodayAbsentLeaveCount()
        setCount(absentLeaveCount)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch absent/leave count'))
        setCount(0)
      } finally {
        setLoading(false)
      }
    }

    fetchCount()
  }, [])

  return { count, loading, error }
}

