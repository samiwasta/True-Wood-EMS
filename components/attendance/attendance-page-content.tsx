'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useEmployees, Employee } from '@/lib/hooks/useEmployees'
import { useLeaveTypes } from '@/lib/hooks/useLeaveTypes'
import { useWorkSites } from '@/lib/hooks/useWorkSites'
import { AttendanceService } from '@/lib/services/attendance.service'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar, ChevronLeft, ChevronRight, Save, RotateCcw, CheckCircle2, XCircle, CalendarDays, Building2, Wrench, Search, X } from 'lucide-react'
import { format, addDays } from 'date-fns'
import { useDebounce } from '@/lib/hooks/useDebounce'

const predefinedCategoryOrder = ['Worker Staff', 'Dubai Staff', 'Daily Basis Staff', 'Office Staff']

const getCategoryOrder = (categoryName?: string): number => {
  if (!categoryName) return 999
  const index = predefinedCategoryOrder.findIndex(
    cat => cat.toLowerCase() === categoryName.toLowerCase()
  )
  return index === -1 ? 999 : index
}

interface AttendanceRecord {
  id: string
  employee_id: string
  date: string
  status: 'present' | 'absent' | 'leave'
  leave_type_id?: string | null
  work_site_id?: string | null
  employee?: {
    id: string
    employee_id?: string
    name: string
  }
}

const generateLeaveShortHand = (name: string): string => {
  const words = name.trim().split(' ')
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

const getColorForInitials = (initials: string): { bg: string; text: string } => {
  const colors = [
    { bg: 'bg-blue-500', text: 'text-white' },
    { bg: 'bg-green-500', text: 'text-white' },
    { bg: 'bg-purple-500', text: 'text-white' },
    { bg: 'bg-orange-500', text: 'text-white' },
    { bg: 'bg-pink-500', text: 'text-white' },
    { bg: 'bg-indigo-500', text: 'text-white' },
    { bg: 'bg-teal-500', text: 'text-white' },
    { bg: 'bg-red-500', text: 'text-white' },
  ]
  const index = initials.charCodeAt(0) % colors.length
  return colors[index]
}

export function AttendancePageContent() {
  const { employees, loading: employeesLoading } = useEmployees()
  const { leaveTypes, loading: leaveTypesLoading } = useLeaveTypes()
  const { workSites, loading: workSitesLoading } = useWorkSites()

  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, AttendanceRecord>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const [selectedLeaveType, setSelectedLeaveType] = useState<Record<string, string>>({})
  const [selectedWorkSite, setSelectedWorkSite] = useState<Record<string, string>>({})
  const [openPopovers, setOpenPopovers] = useState<Record<string, string>>({})

  const debouncedSearch = useDebounce(searchQuery, 300)

  const activeWorkSites = workSites.filter(site => site.status === 'active')
  const completedWorkSites = workSites.filter(site => site.status === 'completed')

  const fetchAttendance = async (date: Date) => {
    setLoading(true)
    try {
      const dateStr = format(date, 'yyyy-MM-dd')
      const records = await AttendanceService.getAttendanceByDate(dateStr)
      
      const recordsMap: Record<string, AttendanceRecord> = {}
      const leaveTypeMap: Record<string, string> = {}
      const workSiteMap: Record<string, string> = {}

      records.forEach((record: {
        id: string
        employee_id: string
        date: string
        status: 'present' | 'absent' | 'leave'
        leave_type_id?: string | null
        work_site_id?: string | null
        employee?: { id: string; employee_id?: string; name: string } | { id: string; employee_id?: string; name: string }[] | null
      }) => {
        if (record.employee_id) {
          recordsMap[record.employee_id] = {
            id: record.id,
            employee_id: record.employee_id,
            date: record.date,
            status: record.status,
            leave_type_id: record.leave_type_id,
            work_site_id: record.work_site_id,
          } as AttendanceRecord
          if (record.leave_type_id) {
            leaveTypeMap[record.employee_id] = record.leave_type_id
          }
          if (record.work_site_id) {
            workSiteMap[record.employee_id] = record.work_site_id
          }
        }
      })

      setAttendanceRecords(recordsMap)
      setSelectedLeaveType(leaveTypeMap)
      setSelectedWorkSite(workSiteMap)
    } catch (error) {
      console.error('Error fetching attendance:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAttendance(selectedDate)
  }, [selectedDate])

  const handleStatusChange = async (employeeId: string, status: 'present' | 'absent' | 'leave', leaveTypeIdOverride?: string, workSiteIdOverride?: string) => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    const leaveTypeId = status === 'leave' ? (leaveTypeIdOverride || selectedLeaveType[employeeId]) : null
    const workSiteId = workSiteIdOverride || selectedWorkSite[employeeId] || null

    try {
      const savedRecord = await AttendanceService.saveAttendance(employeeId, dateStr, status, leaveTypeId || undefined, workSiteId || undefined)
      
      // Update local state immediately for instant feedback
      setAttendanceRecords(prev => ({
        ...prev,
        [employeeId]: {
          id: savedRecord.id,
          employee_id: employeeId,
          date: dateStr,
          status,
          leave_type_id: leaveTypeId,
          work_site_id: workSiteId,
        } as AttendanceRecord,
      }))
      
      // Also update leave type and work site selections
      if (leaveTypeId) {
        setSelectedLeaveType(prev => ({
          ...prev,
          [employeeId]: leaveTypeId,
        }))
      } else if (status !== 'leave') {
        setSelectedLeaveType(prev => {
          const updated = { ...prev }
          delete updated[employeeId]
          return updated
        })
      }
      
      if (workSiteId) {
        setSelectedWorkSite(prev => ({
          ...prev,
          [employeeId]: workSiteId,
        }))
      } else {
        setSelectedWorkSite(prev => {
          const updated = { ...prev }
          delete updated[employeeId]
          return updated
        })
      }
      
      // Refetch from server to ensure consistency
      await fetchAttendance(selectedDate)
    } catch (error) {
      console.error('Error saving attendance:', error)
      alert('Failed to save attendance. Please try again.')
    }
  }

  const handleSaveAll = async () => {
    setSaving(true)
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const promises = Object.keys(attendanceRecords).map(employeeId => {
        const record = attendanceRecords[employeeId]
        const leaveTypeId = record.status === 'leave' ? selectedLeaveType[employeeId] : null
        const workSiteId = selectedWorkSite[employeeId] || null
        return AttendanceService.saveAttendance(
          employeeId,
          dateStr,
          record.status,
          leaveTypeId || undefined,
          workSiteId || undefined
        )
      })

      await Promise.all(promises)
      await fetchAttendance(selectedDate)
      alert('Attendance saved successfully!')
    } catch (error) {
      console.error('Error saving attendance:', error)
      alert('Failed to save attendance. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    const dateStr = format(selectedDate, 'PPP')
    if (!confirm(`Are you sure you want to reset all attendance for ${dateStr}? This action cannot be undone.`)) {
      return
    }

    setResetting(true)
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      await AttendanceService.resetAttendanceForDate(dateStr)
      setAttendanceRecords({})
      setSelectedLeaveType({})
      setSelectedWorkSite({})
      alert('Attendance reset successfully!')
    } catch (error) {
      console.error('Error resetting attendance:', error)
      alert('Failed to reset attendance. Please try again.')
    } finally {
      setResetting(false)
    }
  }

  const handleDateChange = (days: number) => {
    setSelectedDate(prev => {
      const newDate = addDays(prev, days)
      return newDate
    })
  }

  const handleClearAttendance = async (employeeId: string) => {
    if (!confirm('Are you sure you want to clear the attendance for this employee?')) {
      return
    }

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      await AttendanceService.deleteAttendanceRecord(employeeId, dateStr)
      
      setAttendanceRecords(prev => {
        const updated = { ...prev }
        delete updated[employeeId]
        return updated
      })
      
      setSelectedLeaveType(prev => {
        const updated = { ...prev }
        delete updated[employeeId]
        return updated
      })
      
      setSelectedWorkSite(prev => {
        const updated = { ...prev }
        delete updated[employeeId]
        return updated
      })
      
      await fetchAttendance(selectedDate)
    } catch (error) {
      console.error('Error clearing attendance:', error)
      alert('Failed to clear attendance. Please try again.')
    }
  }

  const getEmployeeStatus = (employeeId: string): 'present' | 'absent' | 'leave' | null => {
    return attendanceRecords[employeeId]?.status || null
  }

  const hasAttendanceRecord = (employeeId: string): boolean => {
    return !!attendanceRecords[employeeId]
  }

  const getLeaveTypeName = (employeeId: string): string => {
    const leaveTypeId = selectedLeaveType[employeeId]
    if (!leaveTypeId) return ''
    const leaveType = leaveTypes.find(lt => lt.id === leaveTypeId)
    return leaveType?.name || ''
  }

  const getWorkSiteShortHand = (employeeId: string): string => {
    const workSiteId = selectedWorkSite[employeeId]
    if (!workSiteId) return ''
    const workSite = workSites.find(ws => ws.id === workSiteId)
    if (!workSite) return ''
    if (workSite.short_hand) return workSite.short_hand.toUpperCase()
    const words = workSite.name.trim().split(' ')
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase()
    }
    return workSite.name.substring(0, 2).toUpperCase()
  }

  const groupedEmployees = useMemo(() => {
    const grouped: Record<string, Employee[]> = {}
    
    // Filter employees based on search query and status (only active employees)
    const filteredEmployees = employees.filter((employee: Employee) => {
      // Only show active employees
      if (employee.status !== 'active') return false
      
      // Filter by search query if provided
      if (!debouncedSearch.trim()) return true
      const searchLower = debouncedSearch.toLowerCase()
      const employeeId = (employee.employee_id || '').toLowerCase()
      const employeeName = (employee.name || '').toLowerCase()
      return employeeId.includes(searchLower) || employeeName.includes(searchLower)
    })
    
    filteredEmployees.forEach((employee: Employee) => {
      const categoryName = employee.category?.name || 'Uncategorized'
      if (!grouped[categoryName]) {
        grouped[categoryName] = []
      }
      grouped[categoryName].push(employee)
    })

    // Sort employees within each category by employee_id
    Object.keys(grouped).forEach(category => {
      grouped[category].sort((a, b) => {
        const idA = a.employee_id || ''
        const idB = b.employee_id || ''
        return idA.localeCompare(idB, undefined, { numeric: true, sensitivity: 'base' })
      })
    })

    // Sort categories: predefined order first, then others alphabetically
    const sortedCategories = Object.keys(grouped).sort((a, b) => {
      const orderA = getCategoryOrder(a)
      const orderB = getCategoryOrder(b)
      
      // If both are in predefined order, sort by their order
      if (orderA !== 999 && orderB !== 999) {
        return orderA - orderB
      }
      
      // If only A is in predefined order, A comes first
      if (orderA !== 999) {
        return -1
      }
      
      // If only B is in predefined order, B comes first
      if (orderB !== 999) {
        return 1
      }
      
      // If neither is in predefined order, sort alphabetically
      return a.localeCompare(b, undefined, { sensitivity: 'base' })
    })

    return sortedCategories.map(category => ({
      category,
      employees: grouped[category],
    }))
  }, [employees, debouncedSearch])

  if (employeesLoading || leaveTypesLoading || workSitesLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-gray-900">Mark Attendance</h1>
          <p className="text-gray-500">Mark attendance for employees</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Search employees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 h-10 w-64 border-gray-300 focus:border-[#23887C] focus:ring-[#23887C] focus:ring-1 bg-white shadow-sm transition-all duration-200"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleDateChange(-1)}
            className="h-10 w-10"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md min-w-[200px] justify-center">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-900">
              {format(selectedDate, 'PPP')}
            </span>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleDateChange(1)}
            className="h-10 w-10"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            onClick={handleSaveAll}
            disabled={saving || loading}
            className="bg-[#23887C] hover:bg-[#1f7569] text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Attendance'}
          </Button>
          <Button
            onClick={handleReset}
            disabled={resetting || loading}
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            {resetting ? 'Resetting...' : 'Reset Attendance'}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#23887C]">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white w-1/4">Employee ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-white w-1/4">Name</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-white w-2/4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {groupedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                    No employees found
                  </td>
                </tr>
              ) : (
                groupedEmployees.map(({ category, employees: categoryEmployees }) => (
                  <React.Fragment key={category}>
                    <tr className="bg-[#23887C]/10 border-t-2 border-[#23887C]">
                      <td colSpan={3} className="px-6 py-4 font-semibold text-[#23887C] text-base">
                        {category}
                      </td>
                    </tr>
                    {categoryEmployees.map((employee: Employee, index: number) => {
                  const status = getEmployeeStatus(employee.id)
                  const leaveTypeName = getLeaveTypeName(employee.id)
                  const workSiteShortHand = getWorkSiteShortHand(employee.id)

                      return (
                        <tr 
                          key={employee.id} 
                          className={`hover:bg-gray-50 transition-colors ${
                            index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                          }`}
                        >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {employee.employee_id || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {employee.name}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant={status === 'present' ? 'default' : 'outline'}
                            className={`h-9 px-3 ${
                              status === 'present'
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                            onClick={() => handleStatusChange(employee.id, 'present')}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1.5" />
                            Present
                          </Button>
                          <Button
                            size="sm"
                            variant={status === 'absent' ? 'default' : 'outline'}
                            className={`h-9 px-3 ${
                              status === 'absent'
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                            onClick={() => handleStatusChange(employee.id, 'absent')}
                          >
                            <XCircle className="h-4 w-4 mr-1.5" />
                            Absent
                          </Button>
                          <Popover
                            open={openPopovers[`leave-${employee.id}`] === 'open'}
                            onOpenChange={(open) => {
                              setOpenPopovers(prev => ({
                                ...prev,
                                [`leave-${employee.id}`]: open ? 'open' : 'closed',
                              }))
                            }}
                          >
                            <PopoverTrigger asChild>
                              <Button
                                size="sm"
                                variant={status === 'leave' ? 'default' : 'outline'}
                                className={`h-9 px-3 ${
                                  status === 'leave'
                                    ? 'bg-orange-600 hover:bg-orange-700 text-white'
                                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                                onClick={() => {
                                  if (status !== 'leave') {
                                    setOpenPopovers(prev => ({
                                      ...prev,
                                      [`leave-${employee.id}`]: 'open',
                                    }))
                                  } else {
                                    handleStatusChange(employee.id, 'present')
                                  }
                                }}
                              >
                                <CalendarDays className="h-4 w-4 mr-1.5" />
                                Leave {leaveTypeName && `(${generateLeaveShortHand(leaveTypeName)})`}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-0" align="start">
                              <div className="p-2">
                                <div className="text-sm font-semibold text-gray-900 mb-2 px-2 py-1">Select Leave Type</div>
                                <div className="max-h-64 overflow-y-auto">
                                  <button
                                    onClick={async () => {
                                      setSelectedLeaveType(prev => {
                                        const updated = { ...prev }
                                        delete updated[employee.id]
                                        return updated
                                      })
                                      if (status === 'leave') {
                                        await handleStatusChange(employee.id, 'present', undefined)
                                      }
                                      setOpenPopovers(prev => ({
                                        ...prev,
                                        [`leave-${employee.id}`]: 'closed',
                                      }))
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100 transition-colors border-b border-gray-200 mb-1"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="h-8 w-8 rounded-md flex items-center justify-center font-semibold text-xs flex-shrink-0 bg-gray-200 text-gray-600">
                                        -
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="font-medium text-gray-500">None</div>
                                      </div>
                                    </div>
                                  </button>
                                  {leaveTypes.length === 0 ? (
                                    <div className="px-2 py-4 text-center text-sm text-gray-500">No leave types found</div>
                                  ) : (
                                    leaveTypes.map((leaveType) => {
                                      const shorthand = generateLeaveShortHand(leaveType.name || '')
                                      const colorClasses = getColorForInitials(shorthand)
                                      return (
                                        <button
                                          key={leaveType.id}
                                          onClick={async () => {
                                            setSelectedLeaveType(prev => ({
                                              ...prev,
                                              [employee.id]: leaveType.id,
                                            }))
                                            await handleStatusChange(employee.id, 'leave', leaveType.id)
                                            setOpenPopovers(prev => ({
                                              ...prev,
                                              [`leave-${employee.id}`]: 'closed',
                                            }))
                                          }}
                                          className={`w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100 transition-colors ${
                                            selectedLeaveType[employee.id] === leaveType.id ? 'bg-[#23887C]/10' : ''
                                          }`}
                                        >
                                          <div className="flex items-center gap-3">
                                            <div className={`${colorClasses.bg} ${colorClasses.text} h-8 w-8 rounded-md flex items-center justify-center font-semibold text-xs flex-shrink-0`}>
                                              {shorthand}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <div className="font-medium text-gray-900 truncate">{leaveType.name}</div>
                                            </div>
                                          </div>
                                        </button>
                                      )
                                    })
                                  )}
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                          <Popover
                            open={openPopovers[`worksite-${employee.id}`] === 'open'}
                            onOpenChange={(open) => {
                              setOpenPopovers(prev => ({
                                ...prev,
                                [`worksite-${employee.id}`]: open ? 'open' : 'closed',
                              }))
                            }}
                          >
                            <PopoverTrigger asChild>
                              <Button
                                size="sm"
                                variant={selectedWorkSite[employee.id] ? 'default' : 'outline'}
                                className={`h-9 px-3 ${
                                  selectedWorkSite[employee.id]
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                <Building2 className="h-4 w-4 mr-1.5" />
                                Work Site {workSiteShortHand && `(${workSiteShortHand})`}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-72 p-0" align="start">
                              <div className="p-2">
                                <div className="text-sm font-semibold text-gray-900 mb-2 px-2 py-1">Select Active Project</div>
                                <div className="max-h-64 overflow-y-auto">
                                  <button
                                    onClick={async () => {
                                      setSelectedWorkSite(prev => {
                                        const updated = { ...prev }
                                        delete updated[employee.id]
                                        return updated
                                      })
                                      const currentStatus = getEmployeeStatus(employee.id) || 'present'
                                      await handleStatusChange(employee.id, currentStatus, undefined, undefined)
                                      setOpenPopovers(prev => ({
                                        ...prev,
                                        [`worksite-${employee.id}`]: 'closed',
                                      }))
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100 transition-colors border-b border-gray-200 mb-1"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="h-8 w-8 rounded-md flex items-center justify-center font-semibold text-xs flex-shrink-0 bg-gray-200 text-gray-600">
                                        -
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="font-medium text-gray-500">None</div>
                                      </div>
                                    </div>
                                  </button>
                                  {activeWorkSites.length === 0 ? (
                                    <div className="px-2 py-4 text-center text-sm text-gray-500">No active projects found</div>
                                  ) : (
                                    activeWorkSites.map((workSite) => {
                                      const initials = workSite.short_hand
                                        ? workSite.short_hand.toUpperCase()
                                        : (() => {
                                            const words = workSite.name.trim().split(' ')
                                            if (words.length >= 2) {
                                              return (words[0][0] + words[1][0]).toUpperCase()
                                            }
                                            return workSite.name.substring(0, 2).toUpperCase()
                                          })()
                                      const colorClasses = getColorForInitials(initials)
                                      return (
                                        <button
                                          key={workSite.id}
                                          onClick={async () => {
                                            setSelectedWorkSite(prev => ({
                                              ...prev,
                                              [employee.id]: workSite.id,
                                            }))
                                            const currentStatus = getEmployeeStatus(employee.id) || 'present'
                                            await handleStatusChange(employee.id, currentStatus, undefined, workSite.id)
                                            setOpenPopovers(prev => ({
                                              ...prev,
                                              [`worksite-${employee.id}`]: 'closed',
                                            }))
                                          }}
                                          className={`w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100 transition-colors ${
                                            selectedWorkSite[employee.id] === workSite.id ? 'bg-[#23887C]/10' : ''
                                          }`}
                                        >
                                          <div className="flex items-center gap-3">
                                            <div className={`${colorClasses.bg} ${colorClasses.text} h-8 w-8 rounded-md flex items-center justify-center font-semibold text-xs flex-shrink-0`}>
                                              {initials}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <div className="font-medium text-gray-900 truncate">{workSite.name}</div>
                                              <div className="text-xs text-gray-500 truncate">{workSite.location}</div>
                                            </div>
                                          </div>
                                        </button>
                                      )
                                    })
                                  )}
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                          <Popover
                            open={openPopovers[`maintenance-${employee.id}`] === 'open'}
                            onOpenChange={(open) => {
                              setOpenPopovers(prev => ({
                                ...prev,
                                [`maintenance-${employee.id}`]: open ? 'open' : 'closed',
                              }))
                            }}
                          >
                            <PopoverTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-9 px-3 border-gray-300 text-gray-700 hover:bg-gray-50"
                              >
                                <Wrench className="h-4 w-4 mr-1.5" />
                                Maintenance
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-72 p-0" align="start">
                              <div className="p-2">
                                <div className="text-sm font-semibold text-gray-900 mb-2 px-2 py-1">Select Completed Project</div>
                                <div className="max-h-64 overflow-y-auto">
                                  <button
                                    onClick={async () => {
                                      setSelectedWorkSite(prev => {
                                        const updated = { ...prev }
                                        delete updated[employee.id]
                                        return updated
                                      })
                                      const currentStatus = getEmployeeStatus(employee.id)
                                      if (currentStatus === 'present') {
                                        await handleStatusChange(employee.id, 'present', undefined, undefined)
                                      }
                                      setOpenPopovers(prev => ({
                                        ...prev,
                                        [`maintenance-${employee.id}`]: 'closed',
                                      }))
                                    }}
                                    className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100 transition-colors border-b border-gray-200 mb-1"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="h-8 w-8 rounded-md flex items-center justify-center font-semibold text-xs flex-shrink-0 bg-gray-200 text-gray-600">
                                        -
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="font-medium text-gray-500">None</div>
                                      </div>
                                    </div>
                                  </button>
                                  {completedWorkSites.length === 0 ? (
                                    <div className="px-2 py-4 text-center text-sm text-gray-500">No completed projects found</div>
                                  ) : (
                                    completedWorkSites.map((workSite) => {
                                      const initials = workSite.short_hand
                                        ? workSite.short_hand.toUpperCase()
                                        : (() => {
                                            const words = workSite.name.trim().split(' ')
                                            if (words.length >= 2) {
                                              return (words[0][0] + words[1][0]).toUpperCase()
                                            }
                                            return workSite.name.substring(0, 2).toUpperCase()
                                          })()
                                      const colorClasses = getColorForInitials(initials)
                                      return (
                                        <button
                                          key={workSite.id}
                                          onClick={async () => {
                                            setSelectedWorkSite(prev => ({
                                              ...prev,
                                              [employee.id]: workSite.id,
                                            }))
                                            await handleStatusChange(employee.id, 'present', undefined, workSite.id)
                                            setOpenPopovers(prev => ({
                                              ...prev,
                                              [`maintenance-${employee.id}`]: 'closed',
                                            }))
                                          }}
                                          className={`w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100 transition-colors ${
                                            selectedWorkSite[employee.id] === workSite.id ? 'bg-[#23887C]/10' : ''
                                          }`}
                                        >
                                          <div className="flex items-center gap-3">
                                            <div className={`${colorClasses.bg} ${colorClasses.text} h-8 w-8 rounded-md flex items-center justify-center font-semibold text-xs flex-shrink-0`}>
                                              {initials}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <div className="font-medium text-gray-900 truncate">{workSite.name}</div>
                                              <div className="text-xs text-gray-500 truncate">{workSite.location}</div>
                                            </div>
                                          </div>
                                        </button>
                                      )
                                    })
                                  )}
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                          {hasAttendanceRecord(employee.id) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleClearAttendance(employee.id)}
                              className="h-9 px-3 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                            >
                              <X className="h-4 w-4 mr-1.5" />
                              Clear
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                      )
                    })}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

