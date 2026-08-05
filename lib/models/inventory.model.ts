export interface Material {
  id: string
  name: string
  unit?: string | null
  description?: string | null
  photo_url?: string | null
  is_active?: boolean
  created_at?: string
  updated_at?: string
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
  material?: Pick<Material, 'id' | 'name' | 'unit' | 'photo_url'> | null
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

export interface VendorPriceBreakdown {
  vendor_material_id: string
  vendor_id: string
  vendor_name: string
  material_id: string
  material_name: string
  material_unit: string | null
  material_photo_url: string | null
  quantity: number
  unit_price: number
  gst_percent: number
  transportation_cost: number
  subtotal: number
  gst_amount: number
  total: number
}
