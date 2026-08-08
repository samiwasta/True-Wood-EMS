export interface MaterialCategory {
  id: string
  name: string
  description?: string | null
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export interface Material {
  id: string
  name: string
  unit?: string | null
  description?: string | null
  photo_url?: string | null
  category_id?: string | null
  is_active?: boolean
  created_at?: string
  updated_at?: string
  category?: Pick<MaterialCategory, 'id' | 'name'> | null
}

export interface Vendor {
  id: string
  name: string
  contact_name?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  notes?: string | null
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export interface VendorMaterial {
  id: string
  vendor_id: string
  material_id: string
  unit_price: number
  gst_percent: number
  transportation_cost: number
  notes?: string | null
  is_active?: boolean
  created_at?: string
  updated_at?: string
  vendor?: Pick<Vendor, 'id' | 'name' | 'contact_name' | 'phone'> | null
  material?: Pick<Material, 'id' | 'name' | 'unit' | 'photo_url' | 'category_id'> | null
}

export interface VendorMaterialInput {
  vendor_id: string
  material_id: string
  unit_price: number
  gst_percent?: number
  transportation_cost?: number
  notes?: string | null
  is_active?: boolean
}

export type VendorPriceSortBy =
  | 'total_asc'
  | 'total_desc'
  | 'unit_price_asc'
  | 'transport_asc'
  | 'vendor_asc'

export interface VendorPriceSearchOptions {
  materialName?: string
  materialId?: string
  categoryId?: string
  quantity: number
  sortBy?: VendorPriceSortBy
}

export interface VendorPriceBreakdown {
  vendor_material_id: string
  vendor_id: string
  vendor_name: string
  vendor_contact_name: string | null
  vendor_phone: string | null
  material_id: string
  material_name: string
  material_unit: string | null
  material_photo_url: string | null
  material_category_name: string | null
  quantity: number
  unit_price: number
  gst_percent: number
  transportation_cost: number
  subtotal: number
  gst_amount: number
  total: number
  effective_unit_price: number
}
