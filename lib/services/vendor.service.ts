import { supabase } from '@/lib/supabase'
import { Vendor } from '@/lib/models/inventory.model'

export class VendorService {
  static async getAll(): Promise<Vendor[]> {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        console.error('Error fetching vendors:', error)
        throw new Error(error.message || 'Failed to fetch vendors')
      }

      return data ?? []
    } catch (error) {
      console.error('Error fetching vendors:', error)
      throw error instanceof Error ? error : new Error('Failed to fetch vendors')
    }
  }

  static async create(input: {
    name: string
    contact_name?: string
    phone?: string
    email?: string
    address?: string
    notes?: string
  }): Promise<Vendor> {
    try {
      const trimmedName = input.name.trim()
      if (!trimmedName) {
        throw new Error('Vendor name is required')
      }

      const payload: Record<string, unknown> = {
        name: trimmedName,
        is_active: true,
      }

      if (input.contact_name?.trim()) {
        payload.contact_name = input.contact_name.trim()
      }
      if (input.phone?.trim()) {
        payload.phone = input.phone.trim()
      }
      if (input.email?.trim()) {
        payload.email = input.email.trim()
      }
      if (input.address?.trim()) {
        payload.address = input.address.trim()
      }
      if (input.notes?.trim()) {
        payload.notes = input.notes.trim()
      }

      const { data, error } = await supabase
        .from('vendors')
        .insert(payload)
        .select()
        .single()

      if (error) {
        console.error('Error creating vendor:', error)
        throw new Error(error.message || error.details || 'Failed to create vendor')
      }

      return data
    } catch (error) {
      if (error instanceof Error) throw error
      throw new Error('Failed to create vendor')
    }
  }

  static async update(
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
  ): Promise<Vendor> {
    try {
      if (!id) {
        throw new Error('Vendor ID is required')
      }

      const trimmedName = input.name.trim()
      if (!trimmedName) {
        throw new Error('Vendor name is required')
      }

      const payload: Record<string, unknown> = {
        name: trimmedName,
      }

      if (input.contact_name !== undefined) {
        payload.contact_name = input.contact_name?.trim() || null
      }
      if (input.phone !== undefined) {
        payload.phone = input.phone?.trim() || null
      }
      if (input.email !== undefined) {
        payload.email = input.email?.trim() || null
      }
      if (input.address !== undefined) {
        payload.address = input.address?.trim() || null
      }
      if (input.notes !== undefined) {
        payload.notes = input.notes?.trim() || null
      }
      if (input.is_active !== undefined) {
        payload.is_active = input.is_active
      }

      const { data, error } = await supabase
        .from('vendors')
        .update(payload)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating vendor:', error)
        throw new Error(error.message || error.details || 'Failed to update vendor')
      }

      return data
    } catch (error) {
      if (error instanceof Error) throw error
      throw new Error('Failed to update vendor')
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      if (!id) {
        throw new Error('Vendor ID is required')
      }

      const { error } = await supabase.from('vendors').delete().eq('id', id)

      if (error) {
        console.error('Error deleting vendor:', error)
        throw new Error(error.message || error.details || 'Failed to delete vendor')
      }

      return true
    } catch (error) {
      if (error instanceof Error) throw error
      throw new Error('Failed to delete vendor')
    }
  }
}
