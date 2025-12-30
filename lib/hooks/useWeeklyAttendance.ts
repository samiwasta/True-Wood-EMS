import { useState, useEffect } from 'react'
import { AttendanceService } from '@/lib/services/attendance.service'

export function useWeeklyAttendance() {
  const [attendance, setAttendance] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchAttendance() {
      try {
        setLoading(true)
        setError(null)
        const data = await AttendanceService.getWeeklyAttendance()
        setAttendance(data)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch weekly attendance'))
        setAttendance([])
      } finally {
        setLoading(false)
      }
    }

    fetchAttendance()
  }, [])

  return { attendance, loading, error }
}

