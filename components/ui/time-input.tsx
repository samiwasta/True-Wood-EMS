'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { hhmmTo12hParts, parts12hToHhmm } from '@/lib/utils/time.utils'

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1))
const MINUTES = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'))

interface TimeInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
  compact?: boolean
  grouped?: boolean
}

export function TimeInput({ value, onChange, disabled, className, compact, grouped }: TimeInputProps) {
  const { hour, minute, period } = hhmmTo12hParts(value)

  const update = (h: string, m: string, p: 'AM' | 'PM') => {
    onChange(parts12hToHhmm(h, m, p))
  }

  const triggerClass = compact
    ? 'h-9 px-2'
    : grouped
      ? 'h-9 flex-1 min-w-0 border-0 shadow-none bg-transparent px-1 focus:ring-0'
      : 'h-9'

  const triggerWidth = grouped ? undefined : compact ? 'w-[58px]' : 'w-[58px]'
  const minuteWidth = grouped ? undefined : compact ? 'w-[62px]' : 'w-[62px]'
  const periodWidth = grouped ? undefined : compact ? 'w-[72px]' : 'w-[72px]'

  return (
    <div
      className={cn(
        grouped
          ? 'flex w-full items-center gap-1 rounded-md border border-gray-300 bg-white px-2 h-11 focus-within:border-[#23887C] focus-within:ring-1 focus-within:ring-[#23887C]'
          : 'flex items-center gap-1',
        className
      )}
    >
      <Select
        value={hour}
        onValueChange={(h) => update(h, minute, period)}
        disabled={disabled}
      >
        <SelectTrigger className={cn(triggerClass, triggerWidth)} size="sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {HOURS.map((h) => (
            <SelectItem key={h} value={h}>
              {h}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="text-gray-400">:</span>
      <Select
        value={minute}
        onValueChange={(m) => update(hour, m, period)}
        disabled={disabled}
      >
        <SelectTrigger className={cn(triggerClass, minuteWidth)} size="sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MINUTES.map((m) => (
            <SelectItem key={m} value={m}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={period}
        onValueChange={(p) => update(hour, minute, p as 'AM' | 'PM')}
        disabled={disabled}
      >
        <SelectTrigger className={cn(triggerClass, periodWidth)} size="sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="AM">AM</SelectItem>
          <SelectItem value="PM">PM</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
