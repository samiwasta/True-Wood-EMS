import { supabase } from '@/lib/supabase'
import {
  VendorMaterial,
  VendorMaterialInput,
  VendorPriceBreakdown,
  VendorPriceSearchOptions,
  VendorPriceSortBy,
} from '@/lib/models/inventory.model'

function toNumber(value: unknown, fallback = 0): number {
  const num = typeof value === 'number' ? value : parseFloat(String(value ?? ''))
  return Number.isFinite(num) ? num : fallback
}

function computeBreakdown(
  row: VendorMaterial & {
    vendor?: {
      id?: string
      name?: string
      contact_name?: string | null
      phone?: string | null
      is_active?: boolean
    } | null
    material?: {
      id?: string
      name?: string
      unit?: string | null
      photo_url?: string | null
      category_id?: string | null
      is_active?: boolean
      category?: { id?: string; name?: string } | { id?: string; name?: string }[] | null
    } | null
  },
  quantity: number
): VendorPriceBreakdown {
  const unitPrice = toNumber(row.unit_price)
  const gstPercent = toNumber(row.gst_percent)
  const transportationCost = toNumber(row.transportation_cost)
  const subtotal = unitPrice * quantity
  const gstAmount = subtotal * (gstPercent / 100)
  const total = subtotal + gstAmount + transportationCost

  const vendor = Array.isArray(row.vendor) ? row.vendor[0] : row.vendor
  const material = Array.isArray(row.material) ? row.material[0] : row.material
  const category = material?.category
    ? Array.isArray(material.category)
      ? material.category[0]
      : material.category
    : null

  return {
    vendor_material_id: row.id,
    vendor_id: row.vendor_id,
    vendor_name: vendor?.name || 'Unknown Vendor',
    vendor_contact_name: vendor?.contact_name ?? null,
    vendor_phone: vendor?.phone ?? null,
    material_id: row.material_id,
    material_name: material?.name || 'Unknown Material',
    material_unit: material?.unit ?? null,
    material_photo_url: material?.photo_url ?? null,
    material_category_name: category?.name ?? null,
    quantity,
    unit_price: unitPrice,
    gst_percent: gstPercent,
    transportation_cost: transportationCost,
    subtotal,
    gst_amount: gstAmount,
    total,
    effective_unit_price: quantity > 0 ? total / quantity : total,
  }
}

function sortBreakdowns(
  rows: VendorPriceBreakdown[],
  sortBy: VendorPriceSortBy = 'total_asc'
): VendorPriceBreakdown[] {
  const sorted = [...rows]
  switch (sortBy) {
    case 'total_desc':
      return sorted.sort((a, b) => b.total - a.total || a.vendor_name.localeCompare(b.vendor_name))
    case 'unit_price_asc':
      return sorted.sort(
        (a, b) => a.unit_price - b.unit_price || a.total - b.total || a.vendor_name.localeCompare(b.vendor_name)
      )
    case 'transport_asc':
      return sorted.sort(
        (a, b) =>
          a.transportation_cost - b.transportation_cost ||
          a.total - b.total ||
          a.vendor_name.localeCompare(b.vendor_name)
      )
    case 'vendor_asc':
      return sorted.sort((a, b) => a.vendor_name.localeCompare(b.vendor_name) || a.total - b.total)
    case 'total_asc':
    default:
      return sorted.sort((a, b) => a.total - b.total || a.vendor_name.localeCompare(b.vendor_name))
  }
}

export class VendorMaterialService {
  static async getAll(): Promise<VendorMaterial[]> {
    try {
      const { data, error } = await supabase
        .from('vendor_materials')
        .select(`
          *,
          vendor:vendors(id, name, contact_name, phone),
          material:materials(id, name, unit, photo_url, category_id)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching vendor materials:', error)
        throw new Error(error.message || 'Failed to fetch vendor materials')
      }

      return (data ?? []) as VendorMaterial[]
    } catch (error) {
      console.error('Error fetching vendor materials:', error)
      throw error instanceof Error ? error : new Error('Failed to fetch vendor materials')
    }
  }

  static async create(input: VendorMaterialInput): Promise<VendorMaterial> {
    try {
      if (!input.vendor_id) {
        throw new Error('Vendor is required')
      }
      if (!input.material_id) {
        throw new Error('Material is required')
      }
      if (input.unit_price === undefined || input.unit_price === null || Number.isNaN(input.unit_price)) {
        throw new Error('Unit price is required')
      }
      if (input.unit_price < 0) {
        throw new Error('Unit price cannot be negative')
      }

      const payload: Record<string, unknown> = {
        vendor_id: input.vendor_id,
        material_id: input.material_id,
        unit_price: input.unit_price,
        gst_percent: input.gst_percent ?? 0,
        transportation_cost: input.transportation_cost ?? 0,
        is_active: input.is_active ?? true,
      }

      if (input.notes?.trim()) {
        payload.notes = input.notes.trim()
      }

      const { data, error } = await supabase
        .from('vendor_materials')
        .insert(payload)
        .select(`
          *,
          vendor:vendors(id, name, contact_name, phone),
          material:materials(id, name, unit, photo_url, category_id)
        `)
        .single()

      if (error) {
        console.error('Error creating vendor material:', error)
        if (error.code === '23505') {
          throw new Error('This vendor already has pricing for this material')
        }
        throw new Error(error.message || error.details || 'Failed to create vendor material mapping')
      }

      return data as VendorMaterial
    } catch (error) {
      if (error instanceof Error) throw error
      throw new Error('Failed to create vendor material mapping')
    }
  }

  static async update(
    id: string,
    input: Partial<VendorMaterialInput>
  ): Promise<VendorMaterial> {
    try {
      if (!id) {
        throw new Error('Vendor material ID is required')
      }

      const payload: Record<string, unknown> = {}

      if (input.vendor_id !== undefined) {
        payload.vendor_id = input.vendor_id
      }
      if (input.material_id !== undefined) {
        payload.material_id = input.material_id
      }
      if (input.unit_price !== undefined) {
        if (Number.isNaN(input.unit_price) || input.unit_price < 0) {
          throw new Error('Unit price must be a non-negative number')
        }
        payload.unit_price = input.unit_price
      }
      if (input.gst_percent !== undefined) {
        if (Number.isNaN(input.gst_percent) || input.gst_percent < 0) {
          throw new Error('GST percent must be a non-negative number')
        }
        payload.gst_percent = input.gst_percent
      }
      if (input.transportation_cost !== undefined) {
        if (Number.isNaN(input.transportation_cost) || input.transportation_cost < 0) {
          throw new Error('Transportation cost must be a non-negative number')
        }
        payload.transportation_cost = input.transportation_cost
      }
      if (input.notes !== undefined) {
        payload.notes = input.notes?.trim() || null
      }
      if (input.is_active !== undefined) {
        payload.is_active = input.is_active
      }

      const { data, error } = await supabase
        .from('vendor_materials')
        .update(payload)
        .eq('id', id)
        .select(`
          *,
          vendor:vendors(id, name, contact_name, phone),
          material:materials(id, name, unit, photo_url, category_id)
        `)
        .single()

      if (error) {
        console.error('Error updating vendor material:', error)
        if (error.code === '23505') {
          throw new Error('This vendor already has pricing for this material')
        }
        throw new Error(error.message || error.details || 'Failed to update vendor material mapping')
      }

      return data as VendorMaterial
    } catch (error) {
      if (error instanceof Error) throw error
      throw new Error('Failed to update vendor material mapping')
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      if (!id) {
        throw new Error('Vendor material ID is required')
      }

      const { error } = await supabase.from('vendor_materials').delete().eq('id', id)

      if (error) {
        console.error('Error deleting vendor material:', error)
        throw new Error(error.message || error.details || 'Failed to delete vendor material mapping')
      }

      return true
    } catch (error) {
      if (error instanceof Error) throw error
      throw new Error('Failed to delete vendor material mapping')
    }
  }

  static async searchByMaterial(
    materialNameOrOptions: string | VendorPriceSearchOptions,
    quantityArg?: number
  ): Promise<VendorPriceBreakdown[]> {
    try {
      const options: VendorPriceSearchOptions =
        typeof materialNameOrOptions === 'string'
          ? {
              materialName: materialNameOrOptions,
              quantity: quantityArg ?? 0,
              sortBy: 'total_asc',
            }
          : materialNameOrOptions

      const quantity = options.quantity
      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new Error('Quantity must be greater than zero')
      }

      if (!options.materialId && !options.materialName?.trim() && !options.categoryId) {
        throw new Error('Select a material, category, or enter a material name')
      }

      let materialQuery = supabase
        .from('materials')
        .select('id')
        .eq('is_active', true)

      if (options.materialId) {
        materialQuery = materialQuery.eq('id', options.materialId)
      } else {
        if (options.materialName?.trim()) {
          materialQuery = materialQuery.ilike('name', `%${options.materialName.trim()}%`)
        }
        if (options.categoryId) {
          materialQuery = materialQuery.eq('category_id', options.categoryId)
        }
      }

      const { data: materials, error: materialsError } = await materialQuery

      if (materialsError) {
        console.error('Error searching materials:', materialsError)
        throw new Error(materialsError.message || 'Failed to search materials')
      }

      if (!materials || materials.length === 0) {
        return []
      }

      const materialIds = materials.map((m) => m.id)

      const { data, error } = await supabase
        .from('vendor_materials')
        .select(`
          *,
          vendor:vendors(id, name, contact_name, phone, is_active),
          material:materials(
            id,
            name,
            unit,
            photo_url,
            category_id,
            is_active,
            category:material_categories(id, name)
          )
        `)
        .in('material_id', materialIds)
        .eq('is_active', true)

      if (error) {
        console.error('Error searching vendor materials:', error)
        throw new Error(error.message || 'Failed to search vendor prices')
      }

      const rows = (data ?? []) as VendorMaterial[]

      const breakdowns = rows
        .filter((row) => {
          const vendor = (Array.isArray(row.vendor) ? row.vendor[0] : row.vendor) as
            | { is_active?: boolean }
            | null
            | undefined
          const material = (Array.isArray(row.material) ? row.material[0] : row.material) as
            | { is_active?: boolean }
            | null
            | undefined
          return vendor?.is_active !== false && material?.is_active !== false
        })
        .map((row) => computeBreakdown(row, quantity))

      return sortBreakdowns(breakdowns, options.sortBy || 'total_asc')
    } catch (error) {
      if (error instanceof Error) throw error
      throw new Error('Failed to search vendor prices')
    }
  }
}
