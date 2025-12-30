import { useState, useEffect, useCallback } from 'react'
import { SettingsService } from '@/lib/services/settings.service'
import { WeeklyOff } from '@/lib/models/settings.model'

export function useWeeklyOff() {
  const [weeklyOff, setWeeklyOff] = useState<WeeklyOff[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchWeeklyOff = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await SettingsService.getWeeklyOff()
      setWeeklyOff(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch weekly off'))
      setWeeklyOff([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWeeklyOff()
  }, [fetchWeeklyOff])

  const saveWeeklyOff = useCallback(async (dayOrder: number) => {
    try {
      await SettingsService.saveWeeklyOff(dayOrder)
      await fetchWeeklyOff() // Refetch to get updated list
      return true
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to save weekly off')
    }
  }, [fetchWeeklyOff])

  return { 
    weeklyOff, 
    loading, 
    error,
    saveWeeklyOff,
    refetch: fetchWeeklyOff
  }
}

