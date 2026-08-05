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
