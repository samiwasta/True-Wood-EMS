import { useState, useEffect, useCallback } from 'react'
import { SettingsService } from '@/lib/services/settings.service'
import { Category } from '@/lib/models/settings.model'

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await SettingsService.getCategories()
      setCategories(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch categories'))
      setCategories([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const createCategory = useCallback(async (name: string, description?: string) => {
    try {
      const newCategory = await SettingsService.createCategory(name, description)
      await fetchCategories() // Refetch to get updated list
      return newCategory
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to create category')
    }
  }, [fetchCategories])

  const updateCategory = useCallback(async (id: string, name: string, description?: string) => {
    try {
      const updatedCategory = await SettingsService.updateCategory(id, name, description)
      await fetchCategories() // Refetch to get updated list
      return updatedCategory
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to update category')
    }
  }, [fetchCategories])

  const deleteCategory = useCallback(async (id: string) => {
    try {
      await SettingsService.deleteCategory(id)
      await fetchCategories() // Refetch to get updated list
      return true
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to delete category')
    }
  }, [fetchCategories])

  return { 
    categories, 
    loading, 
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    refetch: fetchCategories
  }
}

