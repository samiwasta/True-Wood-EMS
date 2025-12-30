import { useState, useEffect } from 'react'
import { WorkSiteService } from '@/lib/services/work-site.service'

export function useActiveWorkSites() {
  const [count, setCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchCount() {
      try {
        setLoading(true)
        setError(null)
        const workSitesCount = await WorkSiteService.getActiveWorkSitesCount()
        setCount(workSitesCount)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch work sites count'))
        setCount(0)
      } finally {
        setLoading(false)
      }
    }

    fetchCount()
  }, [])

  return { count, loading, error }
}

