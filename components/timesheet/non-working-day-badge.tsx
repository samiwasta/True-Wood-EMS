import { cn } from '@/lib/utils'
import type { NonWorkingDayInfo } from '@/lib/utils/reports.utils'

interface NonWorkingDayBadgeProps {
  info: NonWorkingDayInfo
  className?: string
  compact?: boolean
}

export function NonWorkingDayBadge({ info, className, compact }: NonWorkingDayBadgeProps) {
  if (!info.isNonWorkingDay) return null

  const isHoliday = info.type === 'holiday'

  return (
    <span
      title={isHoliday ? `Holiday: ${info.label}` : 'Weekly off'}
      className={cn(
        'inline-flex max-w-full items-center gap-1 rounded-full font-semibold',
        compact ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs',
        isHoliday ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800',
        className
      )}
    >
      {isHoliday ? (
        <>
          <span className="shrink-0 opacity-80">Holiday:</span>
          <span className="min-w-0 truncate">{info.label}</span>
        </>
      ) : (
        'Week Off'
      )}
    </span>
  )
}
