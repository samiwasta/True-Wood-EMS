export function getWorkSiteInitials(name: string, shortHand?: string | null): string {
  if (shortHand?.trim()) return shortHand.trim().toUpperCase()
  const words = name.trim().split(' ')
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  return name.substring(0, 2).toUpperCase()
}

const WORK_SITE_COLORS = [
  { bg: 'bg-blue-500', text: 'text-white' },
  { bg: 'bg-green-500', text: 'text-white' },
  { bg: 'bg-purple-500', text: 'text-white' },
  { bg: 'bg-orange-500', text: 'text-white' },
  { bg: 'bg-pink-500', text: 'text-white' },
  { bg: 'bg-indigo-500', text: 'text-white' },
  { bg: 'bg-teal-500', text: 'text-white' },
  { bg: 'bg-red-500', text: 'text-white' },
] as const

export function getColorForWorkSiteInitials(initials: string): { bg: string; text: string } {
  if (!initials) return WORK_SITE_COLORS[0]
  const index = initials.charCodeAt(0) % WORK_SITE_COLORS.length
  return WORK_SITE_COLORS[index]
}

const WORK_SITE_CHIP_COLORS = [
  'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200',
  'bg-green-50 text-green-700 ring-1 ring-inset ring-green-200',
  'bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-200',
  'bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200',
  'bg-pink-50 text-pink-700 ring-1 ring-inset ring-pink-200',
  'bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200',
  'bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-200',
  'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200',
] as const

export function getChipColorForWorkSiteInitials(initials: string): string {
  if (!initials) return WORK_SITE_CHIP_COLORS[0]
  const index = initials.charCodeAt(0) % WORK_SITE_CHIP_COLORS.length
  return WORK_SITE_CHIP_COLORS[index]
}

export const WAREHOUSE_CHIP_CLASSES = 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200'
export const OFFICE_CHIP_CLASSES = 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-300'
