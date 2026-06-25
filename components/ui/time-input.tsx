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
}

export function TimeInput({ value, onChange, disabled, className, compact }: TimeInputProps) {
  const { hour, minute, period } = hhmmTo12hParts(value)

  const update = (h: string, m: string, p: 'AM' | 'PM') => {
    onChange(parts12hToHhmm(h, m, p))
  }

  const triggerClass = compact ? 'h-9 px-2' : 'h-9'

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Select
        value={hour}
        onValueChange={(h) => update(h, minute, period)}
        disabled={disabled}
      >
        <SelectTrigger className={cn(triggerClass, 'w-[58px]')} size="sm">
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
        <SelectTrigger className={cn(triggerClass, 'w-[62px]')} size="sm">
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
        <SelectTrigger className={cn(triggerClass, 'w-[72px]')} size="sm">
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
