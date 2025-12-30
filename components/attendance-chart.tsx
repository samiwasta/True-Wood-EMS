'use client'

import { useWeeklyAttendance } from '@/lib/hooks/useWeeklyAttendance'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar } from 'lucide-react'
import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

interface AttendanceRecord {
  date: string
  status: string
}

export function AttendanceChart() {
  const { attendance, loading } = useWeeklyAttendance()

  const chartData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const today = new Date()

    // Generate the last 7 days (rolling)
    const rolling7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today)
      date.setDate(today.getDate() - (6 - i))
      const dayIndex = date.getDay()
      return {
        day: days[dayIndex],
        date: date.toISOString().split('T')[0],
        present: 0,
        absent: 0,
        leave: 0,
      }
    })

    attendance.forEach((record: AttendanceRecord) => {
      const dayData = rolling7Days.find(d => d.date === record.date)
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

    return rolling7Days
  }, [attendance])

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 h-auto flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="h-5 w-5 text-[#23887C]" />
        <h2 className="text-lg font-semibold text-gray-900">Weekly Attendance</h2>
      </div>

      {loading ? (
        <div className="h-[180px] flex items-center">
          <Skeleton className="h-full w-full rounded-lg" />
        </div>
      ) : (
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 12 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 12 }}
              />
              <Tooltip
                cursor={{ stroke: '#f0f0f0', strokeWidth: 2 }}
                contentStyle={{
                  borderRadius: '12px',
                  border: 'none',
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                iconType="circle"
                wrapperStyle={{ paddingTop: '20px' }}
              />
              <Line
                type="monotone"
                dataKey="present"
                name="Present"
                stroke="#22c55e"
                strokeWidth={3}
                dot={{ r: 4, fill: '#22c55e', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey="absent"
                name="Absent"
                stroke="#ef4444"
                strokeWidth={3}
                dot={{ r: 4, fill: '#ef4444', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey="leave"
                name="Leave"
                stroke="#f97316"
                strokeWidth={3}
                dot={{ r: 4, fill: '#f97316', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
