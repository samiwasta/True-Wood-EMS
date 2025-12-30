import { useState, useEffect, useCallback } from 'react'
import { SettingsService } from '@/lib/services/settings.service'
import { Department } from '@/lib/models/settings.model'

export function useDepartments() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchDepartments = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await SettingsService.getDepartments()
      setDepartments(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch departments'))
      setDepartments([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDepartments()
  }, [fetchDepartments])

  const createDepartment = useCallback(async (name: string, description?: string) => {
    try {
      const newDepartment = await SettingsService.createDepartment(name, description)
      await fetchDepartments() // Refetch to get updated list
      return newDepartment
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to create department')
    }
  }, [fetchDepartments])

  const updateDepartment = useCallback(async (id: string, name: string, description?: string) => {
    try {
      const updatedDepartment = await SettingsService.updateDepartment(id, name, description)
      await fetchDepartments() // Refetch to get updated list
      return updatedDepartment
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to update department')
    }
  }, [fetchDepartments])

  const deleteDepartment = useCallback(async (id: string) => {
    try {
      await SettingsService.deleteDepartment(id)
      await fetchDepartments() // Refetch to get updated list
      return true
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to delete department')
    }
  }, [fetchDepartments])

  return { 
    departments, 
    loading, 
    error,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    refetch: fetchDepartments
  }
}

