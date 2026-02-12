import { useState, useEffect, useCallback } from 'react'
import { WorkSiteService } from '@/lib/services/work-site.service'

export interface WorkSite {
  id: string
  name: string
  location: string
  status: 'active' | 'completed' | 'on_hold' | 'cancelled' | string
  short_hand?: string
  start_date?: string
  end_date?: string
  time_in?: string
  time_out?: string
  break_hours?: number | null
  created_at: string
}

export function useWorkSites() {
  const [workSites, setWorkSites] = useState<WorkSite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchWorkSites = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await WorkSiteService.getAllWorkSites()
      setWorkSites(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch work sites'))
      setWorkSites([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWorkSites()
  }, [fetchWorkSites])

  const createWorkSite = useCallback(async (
    name: string, 
    location: string, 
    status: string = 'active', 
    shortHand?: string,
    startDate?: string,
    endDate?: string,
    timeIn?: string,
    timeOut?: string,
    breakHours?: number | string | null
  ) => {
    try {
      const data = await WorkSiteService.createWorkSite(name, location, status, shortHand, startDate, endDate, timeIn, timeOut, breakHours)
      await fetchWorkSites()
      return data
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to create work site')
    }
  }, [fetchWorkSites])

  const updateWorkSite = useCallback(async (
    id: string, 
    name: string, 
    location: string, 
    status: string, 
    shortHand?: string,
    startDate?: string,
    endDate?: string,
    timeIn?: string,
    timeOut?: string,
    breakHours?: number | string | null
  ) => {
    try {
      const data = await WorkSiteService.updateWorkSite(id, name, location, status, shortHand, startDate, endDate, timeIn, timeOut, breakHours)
      await fetchWorkSites()
      return data
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to update work site')
    }
  }, [fetchWorkSites])

  const deleteWorkSite = useCallback(async (id: string) => {
    try {
      await WorkSiteService.deleteWorkSite(id)
      await fetchWorkSites()
      return true
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to delete work site')
    }
  }, [fetchWorkSites])

  return { 
    workSites, 
    loading, 
    error,
    createWorkSite,
    updateWorkSite,
    deleteWorkSite,
    refetch: fetchWorkSites
  }
}

