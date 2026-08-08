import { supabase } from '@/lib/supabase'
import { MaterialCategory } from '@/lib/models/inventory.model'

export class MaterialCategoryService {
  static async getAll(): Promise<MaterialCategory[]> {
    try {
      const { data, error } = await supabase
        .from('material_categories')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        console.error('Error fetching material categories:', error)
        throw new Error(error.message || 'Failed to fetch categories')
      }

      return data ?? []
    } catch (error) {
      console.error('Error fetching material categories:', error)
      throw error instanceof Error ? error : new Error('Failed to fetch categories')
    }
  }

  static async create(input: {
    name: string
    description?: string
  }): Promise<MaterialCategory> {
    try {
      const trimmedName = input.name.trim()
      if (!trimmedName) {
        throw new Error('Category name is required')
      }

      const payload: Record<string, unknown> = {
        name: trimmedName,
        is_active: true,
      }

      if (input.description?.trim()) {
        payload.description = input.description.trim()
      }

      const { data, error } = await supabase
        .from('material_categories')
        .insert(payload)
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          throw new Error('A category with this name already exists')
        }
        throw new Error(error.message || error.details || 'Failed to create category')
      }

      return data
    } catch (error) {
      if (error instanceof Error) throw error
      throw new Error('Failed to create category')
    }
  }

  static async update(
    id: string,
    input: {
      name: string
      description?: string | null
      is_active?: boolean
    }
  ): Promise<MaterialCategory> {
    try {
      if (!id) throw new Error('Category ID is required')

      const trimmedName = input.name.trim()
      if (!trimmedName) throw new Error('Category name is required')

      const payload: Record<string, unknown> = {
        name: trimmedName,
      }

      if (input.description !== undefined) {
        payload.description = input.description?.trim() || null
      }
      if (input.is_active !== undefined) {
        payload.is_active = input.is_active
      }

      const { data, error } = await supabase
        .from('material_categories')
        .update(payload)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          throw new Error('A category with this name already exists')
        }
        throw new Error(error.message || error.details || 'Failed to update category')
      }

      return data
    } catch (error) {
      if (error instanceof Error) throw error
      throw new Error('Failed to update category')
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      if (!id) throw new Error('Category ID is required')

      const { error } = await supabase.from('material_categories').delete().eq('id', id)

      if (error) {
        throw new Error(error.message || error.details || 'Failed to delete category')
      }

      return true
    } catch (error) {
      if (error instanceof Error) throw error
      throw new Error('Failed to delete category')
    }
  }
}
