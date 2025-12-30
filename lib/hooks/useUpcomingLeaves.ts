import { useState, useEffect } from 'react'
import { LeaveService } from '@/lib/services/leave.service'

export function useUpcomingLeaves(limit: number = 5) {
  const [leaves, setLeaves] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchLeaves() {
      try {
        setLoading(true)
        setError(null)
        const data = await LeaveService.getUpcomingLeaves(limit)
        setLeaves(data)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch upcoming leaves'))
        setLeaves([])
      } finally {
        setLoading(false)
      }
    }

    fetchLeaves()
  }, [limit])

  return { leaves, loading, error }
}

