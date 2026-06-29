import { format } from 'date-fns'
import { Holiday, WeeklyOff, LeaveType } from '@/lib/models/settings.model'
import { WorkSite } from '@/lib/hooks/useWorkSites'

export const getDayName = (date: Date): string => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return days[date.getDay()]
}

export const isHoliday = (date: Date, holidays: Holiday[]): Holiday | null => {
  const dateStr = format(date, 'yyyy-MM-dd')
  return holidays.find((h) => dateStr >= h.start_date && dateStr <= h.end_date) || null
}

export type NonWorkingDayInfo = {
  isNonWorkingDay: boolean
  type: 'holiday' | 'weekoff' | null
  label: string
}

/** Days when all worked hours count as holiday/week-off overtime (no regular working hours). */
export function getNonWorkingDayInfo(
  date: Date | string,
  holidays: Holiday[],
  weeklyOff: WeeklyOff[] = []
): NonWorkingDayInfo {
  const dateObj = typeof date === 'string' ? new Date(date + 'T12:00:00') : date
  const holiday = isHoliday(dateObj, holidays)
  if (holiday) {
    return {
      isNonWorkingDay: true,
      type: 'holiday',
      label: holiday.name || holiday.title || 'Holiday',
    }
  }
  if (isWeeklyOff(dateObj, weeklyOff)) {
    return {
      isNonWorkingDay: true,
      type: 'weekoff',
      label: 'Week Off',
    }
  }
  return { isNonWorkingDay: false, type: null, label: '' }
}

export const isWeeklyOff = (date: Date, weeklyOff: WeeklyOff[]): boolean => {
  const dayOfWeek = date.getDay()
  const activeWeeklyOff = weeklyOff.find(wo => wo.is_active && wo.day_order === dayOfWeek)
  return !!activeWeeklyOff
}

export const getLeaveTypeAbbreviation = (leaveTypeName: string): string => {
  const words = leaveTypeName.trim().split(' ')
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase()
  }
  return leaveTypeName.substring(0, 2).toUpperCase()
}

export const getWorkSiteInitials = (workSiteName: string): string => {
  const words = workSiteName.trim().split(' ')
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase()
  }
  return workSiteName.substring(0, 2).toUpperCase()
}

export const getStatusLabel = (
  status?: string,
  dayStatus?: { type: 'holiday' | 'weekoff' } | null,
  workSiteId?: string | null,
  leaveTypeId?: string | null,
  leaveTypes?: LeaveType[],
  workSites?: WorkSite[]
): string => {
  if (workSiteId && workSites) {
    const workSite = workSites.find(ws => ws.id === workSiteId)
    if (workSite?.name) {
      return workSite.short_hand || getWorkSiteInitials(workSite.name)
    }
  }

  if (status) {
    switch (status) {
      case 'present':
        return 'P'
      case 'absent':
        return 'A'
      case 'leave': {
        if (leaveTypeId && leaveTypes) {
          const leaveType = leaveTypes.find(lt => lt.id === leaveTypeId)
          if (leaveType?.name) {
            return getLeaveTypeAbbreviation(leaveType.name)
          }
        }
        return 'L'
      }
    }
  }

  if (dayStatus?.type === 'holiday') return 'H'
  if (dayStatus?.type === 'weekoff') return 'W'
  
  return '-'
}

export const getStatusColor = (
  status?: string,
  dayStatus?: { type: 'holiday' | 'weekoff' } | null,
  workSiteId?: string | null,
  leaveTypeId?: string | null,
  leaveTypes?: LeaveType[],
  workSites?: WorkSite[]
): string => {
  if (workSiteId && workSites) {
    const index = workSites.findIndex(ws => ws.id === workSiteId)
    if (index >= 0) {
      const colors = [
        'bg-purple-100 text-purple-800',
        'bg-violet-100 text-violet-800',
        'bg-fuchsia-100 text-fuchsia-800',
        'bg-indigo-100 text-indigo-800',
        'bg-blue-100 text-blue-800',
        'bg-sky-100 text-sky-800',
        'bg-cyan-100 text-cyan-800',
        'bg-teal-100 text-teal-800',
      ]
      return colors[index % colors.length]
    }
  } else if (workSiteId) {
    return 'bg-purple-100 text-purple-800'
  }

  if (status) {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800'
      case 'absent':
        return 'bg-red-100 text-red-800'
      case 'leave':
        if (leaveTypeId && leaveTypes) {
          const index = leaveTypes.findIndex(lt => lt.id === leaveTypeId)
          if (index >= 0) {
            const colors = [
              'bg-yellow-100 text-yellow-800',
              'bg-orange-100 text-orange-800',
              'bg-pink-100 text-pink-800',
              'bg-indigo-100 text-indigo-800',
              'bg-teal-100 text-teal-800',
              'bg-cyan-100 text-cyan-800',
              'bg-lime-100 text-lime-800',
              'bg-fuchsia-100 text-fuchsia-800',
            ]
            return colors[index % colors.length]
          }
        }
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  if (dayStatus?.type === 'holiday') return 'bg-blue-100 text-blue-800'
  if (dayStatus?.type === 'weekoff') return 'bg-gray-100 text-gray-600'
  
  return 'bg-gray-50 text-gray-500'
}

