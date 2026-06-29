const FIELD_STAFF_CATEGORIES = ['worker staff', 'daily basis staff']

export function isFieldStaffCategory(categoryName?: string | null): boolean {
  if (!categoryName) return false
  return FIELD_STAFF_CATEGORIES.includes(categoryName.toLowerCase())
}

export function isOfficeStaffCategory(categoryName?: string | null): boolean {
  if (!categoryName) return false
  return categoryName.toLowerCase() === 'office staff'
}
