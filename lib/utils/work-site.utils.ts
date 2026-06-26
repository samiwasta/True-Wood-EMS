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

export const WAREHOUSE_CHIP_CLASSES = 'bg-amber-500 text-white'
export const OFFICE_CHIP_CLASSES = 'bg-slate-600 text-white'
