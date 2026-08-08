import { useState, useEffect, useCallback } from 'react'
import { MaterialCategoryService } from '@/lib/services/material-category.service'
import { MaterialCategory } from '@/lib/models/inventory.model'

export function useMaterialCategories() {
  const [categories, setCategories] = useState<MaterialCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await MaterialCategoryService.getAll()
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

  const createCategory = useCallback(
    async (input: { name: string; description?: string }) => {
      const created = await MaterialCategoryService.create(input)
      await fetchCategories()
      return created
    },
    [fetchCategories]
  )

  const updateCategory = useCallback(
    async (
      id: string,
      input: { name: string; description?: string | null; is_active?: boolean }
    ) => {
      const updated = await MaterialCategoryService.update(id, input)
      await fetchCategories()
      return updated
    },
    [fetchCategories]
  )

  const deleteCategory = useCallback(
    async (id: string) => {
      await MaterialCategoryService.delete(id)
      await fetchCategories()
      return true
    },
    [fetchCategories]
  )

  return {
    categories,
    loading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    refetch: fetchCategories,
  }
}
