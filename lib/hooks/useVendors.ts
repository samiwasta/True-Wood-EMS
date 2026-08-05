import { useState, useEffect, useCallback } from 'react'
import { VendorService } from '@/lib/services/vendor.service'
import { Vendor } from '@/lib/models/inventory.model'

export function useVendors() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchVendors = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await VendorService.getAll()
      setVendors(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch vendors'))
      setVendors([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchVendors()
  }, [fetchVendors])

  const createVendor = useCallback(
    async (input: {
      name: string
      contact_name?: string
      phone?: string
      email?: string
      address?: string
      notes?: string
    }) => {
      const created = await VendorService.create(input)
      await fetchVendors()
      return created
    },
    [fetchVendors]
  )

  const updateVendor = useCallback(
    async (
      id: string,
      input: {
        name: string
        contact_name?: string | null
        phone?: string | null
        email?: string | null
        address?: string | null
        notes?: string | null
        is_active?: boolean
      }
    ) => {
      const updated = await VendorService.update(id, input)
      await fetchVendors()
      return updated
    },
    [fetchVendors]
  )

  const deleteVendor = useCallback(
    async (id: string) => {
      await VendorService.delete(id)
      await fetchVendors()
      return true
    },
    [fetchVendors]
  )

  return {
    vendors,
    loading,
    error,
    createVendor,
    updateVendor,
    deleteVendor,
    refetch: fetchVendors,
  }
}
