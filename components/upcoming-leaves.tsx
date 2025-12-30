'use client'

import { useUpcomingLeaves } from '@/lib/hooks/useUpcomingLeaves'
import { Skeleton } from '@/components/ui/skeleton'
import { CalendarDays } from 'lucide-react'

export function UpcomingLeaves() {
  const { leaves, loading } = useUpcomingLeaves(5)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <CalendarDays className="h-5 w-5 text-gray-600" />
        <h2 className="text-lg font-semibold text-gray-900">Upcoming Leaves</h2>
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
      ) : leaves.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No upcoming leaves</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaves.map((leave: any, index: number) => (
            <div key={leave.id || index} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors border-l-4 border-orange-500">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center">
                  <CalendarDays className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {leave.employee_name || leave.employee?.name || 'Employee'}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDate(leave.start_date)} - {formatDate(leave.end_date)}
                </p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700">
                {leave.type || 'Leave'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

