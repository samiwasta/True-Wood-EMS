import { useState, useEffect, useCallback } from 'react'
import { SettingsService } from '@/lib/services/settings.service'
import { Holiday } from '@/lib/models/settings.model'

export function useHolidays() {
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchHolidays = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await SettingsService.getHolidays()
      setHolidays(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch holidays'))
      setHolidays([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHolidays()
  }, [fetchHolidays])

  const createHoliday = useCallback(async (name: string, startDate: string, endDate: string) => {
    try {
      const data = await SettingsService.createHoliday(name, startDate, endDate)
      await fetchHolidays()
      return data
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to create holiday')
    }
  }, [fetchHolidays])

  const updateHoliday = useCallback(async (id: string, name: string, startDate: string, endDate: string) => {
    try {
      const data = await SettingsService.updateHoliday(id, name, startDate, endDate)
      await fetchHolidays()
      return data
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to update holiday')
    }
  }, [fetchHolidays])

  const deleteHoliday = useCallback(async (id: string) => {
    try {
      await SettingsService.deleteHoliday(id)
      await fetchHolidays()
      return true
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to delete holiday')
    }
  }, [fetchHolidays])

  return { 
    holidays, 
    loading, 
    error,
    createHoliday,
    updateHoliday,
    deleteHoliday,
    refetch: fetchHolidays
  }
}

