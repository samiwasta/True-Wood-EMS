'use client'

import { useHolidays } from '@/lib/hooks/useHolidays'
import { Skeleton } from '@/components/ui/skeleton'
import { CalendarDays } from 'lucide-react'
import { Holiday } from '@/lib/models/settings.model'
import { format } from 'date-fns'

export function UpcomingHolidays() {
  const { holidays, loading } = useHolidays()

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return format(date, 'MMM dd')
  }

  const formatDateRange = (startDateString: string, endDateString: string) => {
    if (startDateString === endDateString) {
      return formatDate(startDateString)
    }

    return `${formatDate(startDateString)} - ${formatDate(endDateString)}`
  }

  const isUpcoming = (startDateString: string) => {
    const date = new Date(startDateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date >= today
  }

  const upcomingHolidays = holidays
    .filter((holiday: Holiday) => isUpcoming(holiday.start_date))
    .sort((a: Holiday, b: Holiday) => {
      const dateA = new Date(a.start_date)
      const dateB = new Date(b.start_date)
      return dateA.getTime() - dateB.getTime()
    })
    .slice(0, 5)

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <CalendarDays className="h-5 w-5 text-[#23887C]" />
        <h2 className="text-lg font-semibold text-gray-900">Upcoming Holidays</h2>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : upcomingHolidays.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No upcoming holidays</p>
        </div>
      ) : (
        <div className="space-y-3">
          {upcomingHolidays.map((holiday: Holiday, index: number) => (
            <div
              key={holiday.id || index}
              className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors border-l-4 border-[#23887C]"
            >
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-lg bg-[#23887C]/10 flex items-center justify-center">
                  <CalendarDays className="h-6 w-6 text-[#23887C]" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {holiday.name || holiday.title || 'Holiday'}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDateRange(holiday.start_date, holiday.end_date)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

