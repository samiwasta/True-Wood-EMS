'use client'

import { useWeeklyAttendance } from '@/lib/hooks/useWeeklyAttendance'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar } from 'lucide-react'
import { useMemo } from 'react'

interface AttendanceRecord {
  date: string
  status: 'present' | 'absent' | 'leave'
}

export function AttendanceChart() {
  const { attendance, loading } = useWeeklyAttendance()

  const chartData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const today = new Date()
    const currentDay = today.getDay()
    
    const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1
    const monday = new Date(today)
    monday.setDate(today.getDate() - daysFromMonday)
    
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(monday)
      date.setDate(monday.getDate() + i)
      return {
        day: days[i],
        date: date.toISOString().split('T')[0],
        present: 0,
        absent: 0,
        leave: 0,
      }
    })

    attendance.forEach((record: AttendanceRecord) => {
      const dayData = last7Days.find(d => d.date === record.date)
      if (dayData) {
        if (record.status === 'present') {
          dayData.present++
        } else if (record.status === 'absent') {
          dayData.absent++
        } else if (record.status === 'leave') {
          dayData.leave++
        }
      }
    })

    return last7Days
  }, [attendance])

  const maxValue = Math.max(...chartData.map(d => d.present + d.absent + d.leave), 1)

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="h-5 w-5 text-gray-600" />
        <h2 className="text-lg font-semibold text-gray-900">Weekly Attendance</h2>
      </div>
      
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-48 w-full" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-end justify-between gap-2 h-48">
            {chartData.map((day, index) => {
              const presentHeight = maxValue > 0 ? (day.present / maxValue) * 100 : 0
              const absentHeight = maxValue > 0 ? (day.absent / maxValue) * 100 : 0
              const leaveHeight = maxValue > 0 ? (day.leave / maxValue) * 100 : 0
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full h-full flex flex-col justify-end gap-0.5">
                    <div
                      className="w-full bg-green-500 rounded-t transition-all"
                      style={{ height: `${presentHeight}%` }}
                      title={`Present: ${day.present}`}
                    />
                    <div
                      className="w-full bg-red-500 rounded-t transition-all"
                      style={{ height: `${absentHeight}%` }}
                      title={`Absent: ${day.absent}`}
                    />
                    <div
                      className="w-full bg-orange-500 rounded-t transition-all"
                      style={{ height: `${leaveHeight}%` }}
                      title={`Leave: ${day.leave}`}
                    />
                  </div>
                  <span className="text-xs text-gray-600 mt-2">{day.day}</span>
                </div>
              )
            })}
          </div>
          <div className="flex items-center justify-center gap-4 pt-2 border-t">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-xs text-gray-600">Present</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-xs text-gray-600">Absent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span className="text-xs text-gray-600">Leave</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

