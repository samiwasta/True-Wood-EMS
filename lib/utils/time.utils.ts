export function parseTimeToMinutes(t: string | null | undefined): number | null {
  if (!t || typeof t !== 'string') return null
  const trimmed = t.trim()
  if (!trimmed) return null

  const ampmMatch = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (ampmMatch) {
    let h = parseInt(ampmMatch[1], 10)
    const m = parseInt(ampmMatch[2], 10)
    const period = ampmMatch[3].toUpperCase()
    if (Number.isNaN(h) || Number.isNaN(m) || h < 1 || h > 12 || m < 0 || m > 59) return null
    if (period === 'AM') {
      if (h === 12) h = 0
    } else if (h !== 12) {
      h += 12
    }
    return h * 60 + m
  }

  const parts = trimmed.split(':')
  if (parts.length < 2) return null
  const h = parseInt(parts[0], 10)
  const m = parseInt(parts[1], 10)
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return h * 60 + m
}

export function toHHmm(t: string | null | undefined): string {
  const mins = parseTimeToMinutes(t)
  if (mins == null) return ''
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

export function formatMinutesToDuration(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

export function hhmmTo12hParts(t: string | null | undefined): {
  hour: string
  minute: string
  period: 'AM' | 'PM'
} {
  const mins = parseTimeToMinutes(t)
  if (mins == null) return { hour: '12', minute: '00', period: 'AM' }
  const h24 = Math.floor(mins / 60)
  const m = mins % 60
  const period = h24 >= 12 ? 'PM' : 'AM'
  const h12 = h24 % 12 || 12
  return {
    hour: String(h12),
    minute: m.toString().padStart(2, '0'),
    period,
  }
}

export function parts12hToHhmm(hour: string, minute: string, period: 'AM' | 'PM'): string {
  let h = parseInt(hour, 10)
  const m = parseInt(minute, 10)
  if (Number.isNaN(h) || Number.isNaN(m)) return ''
  if (period === 'AM') {
    if (h === 12) h = 0
  } else if (h !== 12) {
    h += 12
  }
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

export function formatTime12h(t: string | null | undefined): string {
  if (!t) return ''
  const { hour, minute, period } = hhmmTo12hParts(t)
  return `${hour}:${minute} ${period}`
}

export function formatTime12hOrDash(t: string | null | undefined): string {
  const formatted = formatTime12h(t)
  return formatted || '-'
}
