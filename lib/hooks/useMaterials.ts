import { useState, useEffect, useCallback } from 'react'
import { MaterialService } from '@/lib/services/material.service'
import { Material } from '@/lib/models/inventory.model'

export function useMaterials() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchMaterials = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await MaterialService.getAll()
      setMaterials(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch materials'))
      setMaterials([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMaterials()
  }, [fetchMaterials])

  const createMaterial = useCallback(
    async (input: {
      name: string
      unit?: string
      description?: string
      category_id?: string | null
      photoFile?: File | null
    }) => {
      const created = await MaterialService.create(input)
      await fetchMaterials()
      return created
    },
    [fetchMaterials]
  )

  const updateMaterial = useCallback(
    async (
      id: string,
      input: {
        name: string
        unit?: string | null
        description?: string | null
        category_id?: string | null
        is_active?: boolean
        photoFile?: File | null
        removePhoto?: boolean
      }
    ) => {
      const updated = await MaterialService.update(id, input)
      await fetchMaterials()
      return updated
    },
    [fetchMaterials]
  )

  const deleteMaterial = useCallback(
    async (id: string) => {
      await MaterialService.delete(id)
      await fetchMaterials()
      return true
    },
    [fetchMaterials]
  )

  return {
    materials,
    loading,
    error,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    refetch: fetchMaterials,
  }
}
