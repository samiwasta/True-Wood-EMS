export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export const MATERIAL_UNITS = [
  { value: 'pcs', label: 'Pieces (pcs)' },
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'g', label: 'Gram (g)' },
  { value: 'ton', label: 'Ton' },
  { value: 'm', label: 'Meter (m)' },
  { value: 'mm', label: 'Millimeter (mm)' },
  { value: 'ft', label: 'Feet (ft)' },
  { value: 'rft', label: 'Running Feet (rft)' },
  { value: 'sqft', label: 'Square Feet (sqft)' },
  { value: 'sqm', label: 'Square Meter (sqm)' },
  { value: 'cft', label: 'Cubic Feet (cft)' },
  { value: 'cum', label: 'Cubic Meter (cum)' },
  { value: 'sheet', label: 'Sheet' },
  { value: 'bundle', label: 'Bundle' },
  { value: 'bag', label: 'Bag' },
  { value: 'box', label: 'Box' },
  { value: 'roll', label: 'Roll' },
  { value: 'ltr', label: 'Liter (ltr)' },
] as const

export type MaterialUnit = (typeof MATERIAL_UNITS)[number]['value']

export function getMaterialUnitLabel(unit: string | null | undefined): string {
  if (!unit) return ''
  const match = MATERIAL_UNITS.find((item) => item.value === unit)
  return match?.label ?? unit
}

export function resolveRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? value[0] ?? null : value
}

export const VENDOR_PRICE_SORT_OPTIONS = [
  { value: 'total_asc', label: 'Total: Low to High' },
  { value: 'total_desc', label: 'Total: High to Low' },
  { value: 'unit_price_asc', label: 'Unit Price: Low to High' },
  { value: 'transport_asc', label: 'Transport: Low to High' },
  { value: 'vendor_asc', label: 'Vendor Name: A to Z' },
] as const
