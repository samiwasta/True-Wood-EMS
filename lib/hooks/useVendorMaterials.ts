import { useState, useEffect, useCallback } from 'react'
import { VendorMaterialService } from '@/lib/services/vendor-material.service'
import {
  VendorMaterial,
  VendorMaterialInput,
  VendorPriceBreakdown,
} from '@/lib/models/inventory.model'

export function useVendorMaterials() {
  const [vendorMaterials, setVendorMaterials] = useState<VendorMaterial[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchVendorMaterials = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await VendorMaterialService.getAll()
      setVendorMaterials(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch vendor materials'))
      setVendorMaterials([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchVendorMaterials()
  }, [fetchVendorMaterials])

  const createVendorMaterial = useCallback(
    async (input: VendorMaterialInput) => {
      const created = await VendorMaterialService.create(input)
      await fetchVendorMaterials()
      return created
    },
    [fetchVendorMaterials]
  )

  const updateVendorMaterial = useCallback(
    async (id: string, input: Partial<VendorMaterialInput>) => {
      const updated = await VendorMaterialService.update(id, input)
      await fetchVendorMaterials()
      return updated
    },
    [fetchVendorMaterials]
  )

  const deleteVendorMaterial = useCallback(
    async (id: string) => {
      await VendorMaterialService.delete(id)
      await fetchVendorMaterials()
      return true
    },
    [fetchVendorMaterials]
  )

  const searchByMaterial = useCallback(
    async (materialName: string, quantity: number): Promise<VendorPriceBreakdown[]> => {
      return VendorMaterialService.searchByMaterial(materialName, quantity)
    },
    []
  )

  return {
    vendorMaterials,
    loading,
    error,
    createVendorMaterial,
    updateVendorMaterial,
    deleteVendorMaterial,
    searchByMaterial,
    refetch: fetchVendorMaterials,
  }
}
