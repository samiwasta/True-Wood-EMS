import { useState, useEffect, useCallback } from 'react'
import { SettingsService } from '@/lib/services/settings.service'
import { LeaveType } from '@/lib/models/settings.model'

export function useLeaveTypes() {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchLeaveTypes = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await SettingsService.getLeaveTypes()
      setLeaveTypes(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch leave types'))
      setLeaveTypes([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLeaveTypes()
  }, [fetchLeaveTypes])

  const createLeaveType = useCallback(async (name: string, description?: string, maxDays?: number, isPaid?: boolean) => {
    try {
      const newLeaveType = await SettingsService.createLeaveType(name, description, maxDays, isPaid)
      await fetchLeaveTypes() // Refetch to get updated list
      return newLeaveType
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to create leave type')
    }
  }, [fetchLeaveTypes])

  const updateLeaveType = useCallback(async (id: string, name: string, description?: string, maxDays?: number, isPaid?: boolean) => {
    try {
      const updatedLeaveType = await SettingsService.updateLeaveType(id, name, description, maxDays, isPaid)
      await fetchLeaveTypes() // Refetch to get updated list
      return updatedLeaveType
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to update leave type')
    }
  }, [fetchLeaveTypes])

  const deleteLeaveType = useCallback(async (id: string) => {
    try {
      await SettingsService.deleteLeaveType(id)
      await fetchLeaveTypes() // Refetch to get updated list
      return true
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to delete leave type')
    }
  }, [fetchLeaveTypes])

  return { 
    leaveTypes, 
    loading, 
    error,
    createLeaveType,
    updateLeaveType,
    deleteLeaveType,
    refetch: fetchLeaveTypes
  }
}

