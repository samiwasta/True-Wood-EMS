'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useEmployees, Employee } from '@/lib/hooks/useEmployees'
import { useCategories } from '@/lib/hooks/useCategories'
import { useWorkSites, WorkSite } from '@/lib/hooks/useWorkSites'
import { useHolidays } from '@/lib/hooks/useHolidays'
import { useWeeklyOff } from '@/lib/hooks/useWeeklyOff'
import { getNonWorkingDayInfo } from '@/lib/utils/reports.utils'
import { isOfficeStaffCategory } from '@/lib/utils/category.utils'
import { NonWorkingDayBadge } from '@/components/timesheet/non-working-day-badge'
import { AttendanceService } from '@/lib/services/attendance.service'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar } from '@/components/ui/calendar'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Eye,
  FileDown,
  Search,
  X,
} from 'lucide-react'
import { format, eachDayOfInterval } from 'date-fns'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import JSZip from 'jszip'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { TimeInput } from '@/components/ui/time-input'
import {
  parseTimeToMinutes,
  formatMinutesToDuration,
  toHHmm,
  formatTime12h,
  formatTime12hOrDash,
} from '@/lib/utils/time.utils'

// ─── Constants ───────────────────────────────────────────────────────

const predefinedCategoryOrder = ['Worker Staff', 'Dubai Staff', 'Daily Basis Staff', 'Office Staff']

const getCategoryOrder = (categoryName?: string): number => {
  if (!categoryName) return 999
  const index = predefinedCategoryOrder.findIndex(
    (cat) => cat.toLowerCase() === categoryName.toLowerCase()
  )
  return index === -1 ? 999 : index
}

// ─── Time helpers ────────────────────────────────────────────────────

function calculateWorkingHours(
  timeIn: string | null | undefined,
  timeOut: string | null | undefined,
  breakHours: number = 0,
  allHoursAreOvertime = false
): number | null {
  const inM = parseTimeToMinutes(timeIn)
  const outM = parseTimeToMinutes(timeOut)
  if (inM == null || outM == null) return null
  const totalMins = outM - inM
  if (totalMins <= 0) return 0

  if (allHoursAreOvertime) {
    return 0
  }

  const breakMins = breakHours * 60
  const workingMins = Math.max(0, totalMins - breakMins)
  return workingMins
}

/**
 * Calculate overtime minutes by comparing actual time_in/time_out (from timesheet records)
 * against expected time_in/time_out (from categories or work sites).
 * 
 * @param timeIn - Actual time in from timesheet (can be edited)
 * @param timeOut - Actual time out from timesheet (can be edited)
 * @param expectedStartTime - Expected time in from category/work site
 * @param expectedEndTime - Expected time out from category/work site
 * @param breakHoursActual - Break hours for actual calculation
 * @param breakHoursExpected - Break hours for expected calculation
 * @param allHoursAreOvertime - Holiday or weekly-off day: all worked hours are overtime
 * @returns Overtime minutes (excess hours beyond expected working time)
 */
function calculateOvertimeMinutes(
  timeIn: string | null | undefined,
  timeOut: string | null | undefined,
  expectedStartTime: string | null | undefined,
  expectedEndTime: string | null | undefined,
  breakHoursActual: number = 0,
  breakHoursExpected: number = 0,
  allHoursAreOvertime = false
): number | null {
  const inM = parseTimeToMinutes(timeIn)
  const outM = parseTimeToMinutes(timeOut)
  const expStartM = parseTimeToMinutes(expectedStartTime)
  const expEndM = parseTimeToMinutes(expectedEndTime)
  if (inM == null || outM == null) return null
  const actualDurationMins = outM - inM
  if (actualDurationMins <= 0) return 0
  const breakMinsActual = breakHoursActual * 60
  const actualWorkingMins = Math.max(0, actualDurationMins - breakMinsActual)

  if (allHoursAreOvertime) {
    return actualWorkingMins
  }

  const expectedDuration =
    expStartM != null && expEndM != null && expEndM > expStartM
      ? expEndM - expStartM
      : null
  if (expectedDuration == null) return null
  const breakMinsExpected = breakHoursExpected * 60
  const expectedWorkingMins = Math.max(0, expectedDuration - breakMinsExpected)
  return Math.max(0, actualWorkingMins - expectedWorkingMins)
}

// ─── Types ───────────────────────────────────────────────────────────

type TimesheetRecord = {
  id: string
  employee_id: string
  date: string
  status: 'present' | 'absent' | 'leave'
  leave_type_id?: string | null
  work_site_id?: string | null
  time_in?: string | null
  time_out?: string | null
  break_hours?: number | null
}

// ─── Component ───────────────────────────────────────────────────────

export function TimesheetPageContent() {
  const { employees, loading: employeesLoading } = useEmployees()
  const { categories } = useCategories()
  const { workSites } = useWorkSites()
  const { holidays } = useHolidays()
  const { weeklyOff } = useWeeklyOff()

  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [records, setRecords] = useState<TimesheetRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null)
  const [editRecord, setEditRecord] = useState<TimesheetRecord | null>(null)
  const [editTimeIn, setEditTimeIn] = useState('')
  const [editTimeOut, setEditTimeOut] = useState('')
  const [editBreakHours, setEditBreakHours] = useState('')
  const [editProjectId, setEditProjectId] = useState<string>('__none__')
  const [editSaving, setEditSaving] = useState(false)

  // Monthly tab state
  const [activeTab, setActiveTab] = useState<'daily' | 'monthly'>('daily')
  const [selectedMonth, setSelectedMonth] = useState<Date>(() => {
    const d = new Date()
    d.setDate(1)
    return d
  })
  const [recordsInRange, setRecordsInRange] = useState<TimesheetRecord[]>([])
  const [loadingMonthly, setLoadingMonthly] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [viewEmployee, setViewEmployee] = useState<Employee | null>(null)
  const [pdfDownloadingId, setPdfDownloadingId] = useState<string | null>(null)
  const [zipDownloading, setZipDownloading] = useState(false)

  // ─── Lookup maps ──────────────────────────────────────────────────

  const categoryMap = useMemo(() => {
    const m: Record<string, { name?: string; time_in?: string; time_out?: string; break_hours?: number | null }> = {}
    categories.forEach((c) => {
      if (c.id) m[c.id] = { name: c.name, time_in: c.time_in, time_out: c.time_out, break_hours: c.break_hours ?? null }
    })
    return m
  }, [categories])

  const workSiteMap = useMemo(() => {
    const m: Record<string, WorkSite> = {}
    workSites.forEach((ws) => {
      m[ws.id] = ws
    })
    return m
  }, [workSites])

  const activeWorkSites = useMemo(() => workSites.filter((ws) => ws.status === 'active'), [workSites])

  const selectedDayInfo = useMemo(
    () => getNonWorkingDayInfo(selectedDate, holidays, weeklyOff),
    [selectedDate, holidays, weeklyOff]
  )

  const recordsByEmployeeId = useMemo(() => {
    const m: Record<string, TimesheetRecord> = {}
    records.forEach((r) => {
      if (r.employee_id) m[r.employee_id] = r
    })
    return m
  }, [records])

  // ─── Fetch ────────────────────────────────────────────────────────

  const fetchTimesheet = async (date: Date) => {
    setLoading(true)
    try {
      const dateStr = format(date, 'yyyy-MM-dd')
      const data = await AttendanceService.getTimesheetByDate(dateStr)
      setRecords((data as TimesheetRecord[]) || [])
    } catch (error) {
      console.error('Error fetching timesheet:', error)
      setRecords([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTimesheet(selectedDate)
  }, [selectedDate])

  // ─── Monthly: working month 26th to 25th ──────────────────────────

  /** Working month: from 26th of previous calendar month to 25th of selected month. */
  const workingMonthStart = useMemo(() => {
    const d = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1)
    d.setMonth(d.getMonth() - 1)
    d.setDate(26)
    return d
  }, [selectedMonth])
  const workingMonthEnd = useMemo(() => {
    const d = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 25)
    return d
  }, [selectedMonth])
  /** All dates in the working month (for full view and fetch). */
  const workingMonthDates = useMemo(
    () =>
      eachDayOfInterval({ start: workingMonthStart, end: workingMonthEnd }).map((d) =>
        format(d, 'yyyy-MM-dd')
      ),
    [workingMonthStart, workingMonthEnd]
  )

  useEffect(() => {
    if (activeTab !== 'monthly') return
    setLoadingMonthly(true)
    const startStr = format(workingMonthStart, 'yyyy-MM-dd')
    const endStr = format(workingMonthEnd, 'yyyy-MM-dd')
    AttendanceService.getTimesheetByDateRange(startStr, endStr)
      .then((recs) => {
        setRecordsInRange((recs as TimesheetRecord[]) || [])
      })
      .catch((err) => {
        console.error('Error fetching monthly timesheet:', err)
        setRecordsInRange([])
      })
      .finally(() => setLoadingMonthly(false))
  }, [activeTab, workingMonthStart, workingMonthEnd])

  // ─── Grouping ─────────────────────────────────────────────────────

  const groupedEmployees = useMemo(() => {
    const filtered = employees.filter((e) => {
      if (e.status !== 'active') return false
      if (!debouncedSearch.trim()) return true
      const q = debouncedSearch.toLowerCase()
      return (
        (e.employee_id || '').toLowerCase().includes(q) ||
        (e.name || '').toLowerCase().includes(q)
      )
    })
    const grouped: Record<string, Employee[]> = {}
    filtered.forEach((emp) => {
      const cat = emp.category?.name || 'Uncategorized'
      if (!grouped[cat]) grouped[cat] = []
      grouped[cat].push(emp)
    })
    Object.keys(grouped).forEach((cat) => {
      grouped[cat].sort((a, b) =>
        (a.employee_id || '').localeCompare(b.employee_id || '', undefined, {
          numeric: true,
          sensitivity: 'base',
        })
      )
    })
    const order = (a: string, b: string) => {
      const oa = getCategoryOrder(a)
      const ob = getCategoryOrder(b)
      if (oa !== 999 && ob !== 999) return oa - ob
      if (oa !== 999) return -1
      if (ob !== 999) return 1
      return a.localeCompare(b, undefined, { sensitivity: 'base' })
    }
    return Object.keys(grouped)
      .sort(order)
      .map((category) => ({ category, employees: grouped[category] }))
  }, [employees, debouncedSearch])

  // ─── Display helpers ──────────────────────────────────────────────

  const getRecord = (employeeId: string) => recordsByEmployeeId[employeeId]

  /** Get actual time_in from attendance record, or scheduled fallback when not yet saved. */
  const getDefaultTimeIn = (employee: Employee, record: TimesheetRecord | undefined) => {
    if (record?.time_in) return record.time_in
    if (record?.work_site_id) {
      const ws = workSiteMap[record.work_site_id]
      if (ws?.time_in) return ws.time_in
    }
    const catId = employee.category_id || employee.category?.id
    const cat = catId ? categoryMap[catId] : null
    return cat?.time_in ?? ''
  }

  /** Get actual time_out from attendance record, or scheduled fallback when not yet saved. */
  const getDefaultTimeOut = (employee: Employee, record: TimesheetRecord | undefined) => {
    if (record?.time_out) return record.time_out
    if (record?.work_site_id) {
      const ws = workSiteMap[record.work_site_id]
      if (ws?.time_out) return ws.time_out
    }
    const catId = employee.category_id || employee.category?.id
    const cat = catId ? categoryMap[catId] : null
    return cat?.time_out ?? ''
  }

  /** Scheduled time_in from Work Sites or Settings (category), not actual attendance times. */
  const getExpectedStartTime = (employee: Employee, record: TimesheetRecord | undefined) => {
    if (record?.work_site_id) {
      const ws = workSiteMap[record.work_site_id]
      if (ws?.time_in) return ws.time_in
    }
    const catId = employee.category_id || employee.category?.id
    const cat = catId ? categoryMap[catId] : null
    return cat?.time_in ?? null
  }

  /** Scheduled time_out from Work Sites or Settings (category), not actual attendance times. */
  const getExpectedEndTime = (employee: Employee, record: TimesheetRecord | undefined) => {
    if (record?.work_site_id) {
      const ws = workSiteMap[record.work_site_id]
      if (ws?.time_out) return ws.time_out
    }
    const catId = employee.category_id || employee.category?.id
    const cat = catId ? categoryMap[catId] : null
    return cat?.time_out ?? null
  }

  /** Actual break hours from attendance record, or scheduled fallback. */
  const getBreakHours = (employee: Employee, record: TimesheetRecord | undefined): number => {
    if (record?.break_hours != null) return record.break_hours
    return getExpectedBreakHours(employee, record)
  }

  /** Scheduled break hours from Work Sites or Settings (category). */
  const getExpectedBreakHours = (employee: Employee, record: TimesheetRecord | undefined): number => {
    if (record?.work_site_id) {
      const ws = workSiteMap[record.work_site_id]
      if (ws?.break_hours != null) return ws.break_hours
    }
    const catId = employee.category_id || employee.category?.id
    const cat = catId ? categoryMap[catId] : null
    return cat?.break_hours ?? 0
  }

  const getBreakHoursForDate = (
    employee: Employee,
    record: TimesheetRecord,
    _dateStr: string
  ): number => {
    if (record.break_hours != null) return record.break_hours
    return getExpectedBreakHoursForDate(employee, record)
  }

  const getExpectedBreakHoursForDate = (
    employee: Employee,
    record: TimesheetRecord
  ): number => {
    if (record.work_site_id) {
      const ws = workSiteMap[record.work_site_id]
      if (ws?.break_hours != null) return ws.break_hours
    }
    const catId = employee.category_id || employee.category?.id
    const cat = catId ? categoryMap[catId] : null
    return cat?.break_hours ?? 0
  }

  /** Scheduled start from Work Sites or Settings for overtime (monthly view). */
  const getExpectedStartForDate = (
    employee: Employee,
    record: TimesheetRecord,
    _dateStr: string
  ): string | null => {
    if (record.work_site_id) {
      const ws = workSiteMap[record.work_site_id]
      if (ws?.time_in) return ws.time_in
    }
    const catId = employee.category_id || employee.category?.id
    const cat = catId ? categoryMap[catId] : null
    return cat?.time_in ?? null
  }

  const getExpectedEndForDate = (
    employee: Employee,
    record: TimesheetRecord,
    _dateStr: string
  ): string | null => {
    if (record.work_site_id) {
      const ws = workSiteMap[record.work_site_id]
      if (ws?.time_out) return ws.time_out
    }
    const catId = employee.category_id || employee.category?.id
    const cat = catId ? categoryMap[catId] : null
    return cat?.time_out ?? null
  }

  /** Actual time in from attendance record (monthly view). */
  const getTimeInForRecord = (employee: Employee, record: TimesheetRecord, _dateStr: string): string => {
    if (record.time_in) return record.time_in
    if (record.work_site_id) {
      const ws = workSiteMap[record.work_site_id]
      if (ws?.time_in) return ws.time_in
    }
    const catId = employee.category_id || employee.category?.id
    const cat = catId ? categoryMap[catId] : null
    return cat?.time_in ?? ''
  }

  const getTimeOutForRecord = (employee: Employee, record: TimesheetRecord, _dateStr: string): string => {
    if (record.time_out) return record.time_out
    if (record.work_site_id) {
      const ws = workSiteMap[record.work_site_id]
      if (ws?.time_out) return ws.time_out
    }
    const catId = employee.category_id || employee.category?.id
    const cat = catId ? categoryMap[catId] : null
    return cat?.time_out ?? ''
  }

  // ─── Edit dialog ──────────────────────────────────────────────────

  const openEditDialog = (employee: Employee, record: TimesheetRecord | undefined) => {
    setEditEmployee(employee)
    setEditRecord(record || null)
    setEditTimeIn(toHHmm(getDefaultTimeIn(employee, record)))
    setEditTimeOut(toHHmm(getDefaultTimeOut(employee, record)))
    const breakHrs = getBreakHours(employee, record)
    setEditBreakHours(breakHrs > 0 ? String(breakHrs) : '')
    setEditProjectId(record?.work_site_id || '__none__')
    setEditDialogOpen(true)
  }

  const handleEditSave = async () => {
    if (!editRecord || !editEmployee) return
    setEditSaving(true)
    try {
      const breakHrsValue = editBreakHours.trim() ? parseFloat(editBreakHours) : null
      await AttendanceService.updateTimesheetRecord(editRecord.id, {
        time_in: editTimeIn.trim() || null,
        time_out: editTimeOut.trim() || null,
        break_hours: breakHrsValue,
        work_site_id: editProjectId !== '__none__' ? editProjectId : null,
      })
      await fetchTimesheet(selectedDate)
      setEditDialogOpen(false)
    } catch (error) {
      console.error('Error saving timesheet:', error)
      alert('Failed to save. Please try again.')
    } finally {
      setEditSaving(false)
    }
  }

  // ─── Date nav ─────────────────────────────────────────────────────

  const handlePrevDay = () => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() - 1)
    setSelectedDate(d)
  }

  const handleNextDay = () => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + 1)
    setSelectedDate(d)
  }

  // ─── Monthly: view dialog & PDF ────────────────────────────────────

  const openViewDialog = (employee: Employee) => {
    setViewEmployee(employee)
    setViewDialogOpen(true)
  }

  /** Monthly tab: employees grouped by category (same order as daily). */
  const monthlyGroupedByCategory = useMemo(() => {
    const filtered = employees.filter((e) => {
      if (e.status !== 'active') return false
      if (!debouncedSearch.trim()) return true
      const q = debouncedSearch.toLowerCase()
      return (
        (e.employee_id || '').toLowerCase().includes(q) ||
        (e.name || '').toLowerCase().includes(q)
      )
    })
    const grouped: Record<string, Employee[]> = {}
    filtered.forEach((emp) => {
      const cat = emp.category?.name || 'Uncategorized'
      if (!grouped[cat]) grouped[cat] = []
      grouped[cat].push(emp)
    })
    Object.keys(grouped).forEach((cat) => {
      grouped[cat].sort((a, b) =>
        (a.employee_id || '').localeCompare(b.employee_id || '', undefined, {
          numeric: true,
          sensitivity: 'base',
        })
      )
    })
    const order = (a: string, b: string) => {
      const oa = getCategoryOrder(a)
      const ob = getCategoryOrder(b)
      if (oa !== 999 && ob !== 999) return oa - ob
      if (oa !== 999) return -1
      if (ob !== 999) return 1
      return a.localeCompare(b, undefined, { sensitivity: 'base' })
    }
    return Object.keys(grouped)
      .sort(order)
      .map((category) => ({ category, employees: grouped[category] }))
  }, [employees, debouncedSearch])

  /** Day name helper */
  const getDayName = (dateStr: string): string => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const dateObj = new Date(dateStr + 'T12:00:00')
    return dayNames[dateObj.getDay()]
  }

  /** One row per date in working month; no record = dashes / Not Marked. */
  const getMonthlyRowsForEmployee = (employeeId: string) => {
    const emp = employees.find((e) => e.id === employeeId)
    if (!emp) return []
    const recordsByDate = new Map<string, TimesheetRecord>()
    recordsInRange
      .filter((r) => r.employee_id === employeeId)
      .forEach((r) => recordsByDate.set(r.date, r))

    return workingMonthDates.map((dateStr) => {
      const dateObj = new Date(dateStr + 'T12:00:00')
      const nonWorkingDay = getNonWorkingDayInfo(dateStr, holidays, weeklyOff)
      const dayName = getDayName(dateStr)
      const record = recordsByDate.get(dateStr)
      const workSiteName = record?.work_site_id
        ? (workSiteMap[record.work_site_id]?.short_hand || workSiteMap[record.work_site_id]?.name || '-')
        : '-'
      const dayInfo = nonWorkingDay.isNonWorkingDay ? nonWorkingDay.label : ''

      if (!record) {
        return {
          date: dateStr,
          dateFormatted: format(dateObj, 'dd MMM yyyy'),
          dayName,
          workSite: workSiteName,
          dayInfo,
          timeIn: '-',
          timeOut: '-',
          totalHours: '-',
          breakHours: '-',
          actualHours: '-',
          overtime: '-',
          holidayOvertime: '-',
          status: 'Not Marked',
          isNonWorkingDay: nonWorkingDay.isNonWorkingDay,
          nonWorkingDayType: nonWorkingDay.type,
        }
      }

      const timeIn = getTimeInForRecord(emp, record, dateStr)
      const timeOut = getTimeOutForRecord(emp, record, dateStr)
      const breakHrs = getBreakHoursForDate(emp, record, dateStr)
      const expectedBreakHrs = getExpectedBreakHoursForDate(emp, record)
      const expStart = getExpectedStartForDate(emp, record, dateStr)
      const expEnd = getExpectedEndForDate(emp, record, dateStr)

      // Total Hours = Time Out - Time In (no break subtracted)
      const inMins = parseTimeToMinutes(timeIn)
      const outMins = parseTimeToMinutes(timeOut)
      const totalMins = (record.status === 'present' && inMins != null && outMins != null && outMins > inMins)
        ? outMins - inMins
        : null
      const totalHoursStr = totalMins != null ? formatMinutesToDuration(totalMins) : '-'

      // Actual Hours = Total Hours - Break Hours
      const breakMins = breakHrs * 60
      const actualMins = totalMins != null ? Math.max(0, totalMins - breakMins) : null
      const actualHoursStr = actualMins != null ? formatMinutesToDuration(actualMins) : '-'

      // Overtime (regular days only; Office Staff excluded except on holidays/week off)
      const overtimeMins =
        record.status === 'present' &&
        !nonWorkingDay.isNonWorkingDay &&
        !isOfficeStaffCategory(emp.category?.name)
          ? calculateOvertimeMinutes(timeIn, timeOut, expStart, expEnd, breakHrs, expectedBreakHrs, false)
          : null
      const overtimeStr = (overtimeMins != null && overtimeMins > 0) ? formatMinutesToDuration(overtimeMins) : '-'

      // Holiday / week-off overtime (all worked hours on non-working days)
      const holidayOvertimeMins =
        record.status === 'present' && nonWorkingDay.isNonWorkingDay && actualMins != null
          ? actualMins
          : null
      const holidayOvertimeStr = (holidayOvertimeMins != null && holidayOvertimeMins > 0) ? formatMinutesToDuration(holidayOvertimeMins) : '-'

      const breakDisplay = breakHrs > 0 ? (breakHrs % 1 === 0 ? String(breakHrs) : String(breakHrs)) : '-'

      return {
        date: dateStr,
        dateFormatted: format(new Date(dateStr + 'T12:00:00'), 'dd MMM yyyy'),
        dayName,
        workSite: workSiteName,
        dayInfo,
        timeIn: record.status === 'absent' ? '-' : formatTime12hOrDash(timeIn),
        timeOut: record.status === 'absent' ? '-' : formatTime12hOrDash(timeOut),
        totalHours: totalHoursStr,
        breakHours: breakDisplay,
        actualHours: actualHoursStr,
        overtime: overtimeStr,
        holidayOvertime: holidayOvertimeStr,
        status: record.status,
        isNonWorkingDay: nonWorkingDay.isNonWorkingDay,
        nonWorkingDayType: nonWorkingDay.type,
      }
    })
  }

  const getTimesheetPdfFileName = (employee: Employee) => {
    const rawName = (employee.name || 'employee').trim()
    const safeName = rawName
      .replace(/[\\/:*?"<>|]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase()
    return `timesheet-${safeName || 'employee'}-${format(workingMonthEnd, 'yyyy-MM')}.pdf`
  }

  const createTimesheetPdfDoc = (employee: Employee) => {
    const startStr = format(workingMonthStart, 'yyyy-MM-dd')
    const endStr = format(workingMonthEnd, 'yyyy-MM-dd')
    const rows = getMonthlyRowsForEmployee(employee.id)
    const doc = new jsPDF('portrait', 'mm', 'a4')
    const title = `Timesheet (26–25) ${format(workingMonthStart, 'dd MMM')} – ${format(workingMonthEnd, 'dd MMM yyyy')}`
    doc.setFontSize(16)
    doc.text(title, 14, 20)
    doc.setFontSize(11)
    doc.text(`Employee ID: ${employee.employee_id || '-'}`, 14, 28)
    doc.text(`Employee Name: ${employee.name || '-'}`, 14, 34)
    doc.text(`From: ${format(new Date(startStr + 'T12:00:00'), 'dd MMM yyyy')}`, 14, 40)
    doc.text(`To: ${format(new Date(endStr + 'T12:00:00'), 'dd MMM yyyy')}`, 14, 46)

    const tableData = rows.map((r) => [
      r.dateFormatted,
      r.dayName,
      r.workSite,
      r.dayInfo,
      r.timeIn,
      r.timeOut,
      r.totalHours,
      r.breakHours,
      r.actualHours,
      r.overtime,
      r.holidayOvertime,
    ])

    // Calculate totals for the footer
    const parseHHmm = (v: string) => {
      if (!v || v === '-' || v === '0') return 0
      const p = v.split(':')
      if (p.length < 2) return 0
      const h = parseInt(p[0], 10)
      const m = parseInt(p[1], 10)
      return (Number.isNaN(h) || Number.isNaN(m)) ? 0 : h * 60 + m
    }
    const totalOT = rows.reduce((a, r) => a + parseHHmm(r.overtime), 0)
    const totalHOT = rows.reduce((a, r) => a + parseHHmm(r.holidayOvertime), 0)

    tableData.push([
      '', '', '', '', '', '', '', '', 'Total',
      totalOT > 0 ? formatMinutesToDuration(totalOT) : '-',
      totalHOT > 0 ? formatMinutesToDuration(totalHOT) : '-',
    ])

    autoTable(doc, {
      startY: 52,
      head: [['Date', 'Day', 'Work Site', 'Day Info', 'Time In', 'Time Out', 'Total Hours', 'Break Hrs', 'Actual Hours', 'Overtime', 'Holiday OT']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [35, 136, 124], fontSize: 7 },
      styles: { fontSize: 7, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 12 },
        2: { cellWidth: 18 },
        3: { cellWidth: 16 },
      },
    })

    return doc
  }

  const handleDownloadPdf = async (employee: Employee) => {
    setPdfDownloadingId(employee.id)
    try {
      const doc = createTimesheetPdfDoc(employee)
      doc.save(getTimesheetPdfFileName(employee))
    } catch (err) {
      console.error('Error generating PDF:', err)
      alert('Failed to download PDF.')
    } finally {
      setPdfDownloadingId(null)
    }
  }

  const handleDownloadAllMonthlyZip = async () => {
    const allEmployees = monthlyGroupedByCategory.flatMap((group) => group.employees)
    if (allEmployees.length === 0) {
      alert('No employees found to download.')
      return
    }

    setZipDownloading(true)
    try {
      const zip = new JSZip()
      allEmployees.forEach((employee) => {
        const doc = createTimesheetPdfDoc(employee)
        const blob = doc.output('blob')
        zip.file(getTimesheetPdfFileName(employee), blob)
      })

      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const zipName = `monthly-timesheets-${format(workingMonthEnd, 'yyyy-MM')}.zip`
      const url = URL.createObjectURL(zipBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = zipName
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error generating zip:', err)
      alert('Failed to download ZIP.')
    } finally {
      setZipDownloading(false)
    }
  }

  // ─── Loading skeleton ─────────────────────────────────────────────

  if (employeesLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  // ─── Render ───────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4 min-h-0">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'daily' | 'monthly')} className="flex flex-col gap-4 min-h-0 flex-1">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">Timesheet</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search employees..."
              className="pl-9 pr-8 h-10 w-56"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-gray-100"
              >
                <X className="h-3.5 w-3.5 text-gray-400" />
              </button>
            )}
          </div>
          <TabsList className="bg-gray-100">
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
          {activeTab === 'daily' && (
            <>
              <Button variant="outline" size="icon" onClick={handlePrevDay} aria-label="Previous day">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="min-w-[200px] justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(selectedDate, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(d) => d && setSelectedDate(d)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Button variant="outline" size="icon" onClick={handleNextDay} aria-label="Next day">
                <ChevronRight className="h-4 w-4" />
              </Button>
              {selectedDayInfo.isNonWorkingDay ? (
                <NonWorkingDayBadge info={selectedDayInfo} />
              ) : (
                <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-800">
                  WEEK ({['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][selectedDate.getDay()]})
                </span>
              )}
            </>
          )}
          {activeTab === 'monthly' && (
            <>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="min-w-[200px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(workingMonthStart, 'd MMM')} – {format(workingMonthEnd, 'd MMM yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={selectedMonth}
                    onSelect={(d) => {
                      if (d) {
                        const first = new Date(d.getFullYear(), d.getMonth(), 1)
                        setSelectedMonth(first)
                      }
                    }}
                    defaultMonth={selectedMonth}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Button
                variant="default"
                className="bg-[#23887C] hover:bg-[#1a6b62]"
                onClick={handleDownloadAllMonthlyZip}
                disabled={zipDownloading || loadingMonthly}
              >
                {zipDownloading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Preparing ZIP…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <FileDown className="h-4 w-4" />
                    Download All ZIP
                  </span>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      <TabsContent value="daily" className="mt-0 flex-1 flex flex-col min-h-0 data-[state=inactive]:hidden overflow-hidden">
      {selectedDayInfo.isNonWorkingDay && (
        <div
          className={`mb-3 flex flex-wrap items-center gap-2 rounded-lg border px-4 py-2.5 ${
            selectedDayInfo.type === 'holiday'
              ? 'border-blue-200 bg-blue-50'
              : 'border-red-200 bg-red-50'
          }`}
        >
          <NonWorkingDayBadge info={selectedDayInfo} />
          <span className="text-sm text-gray-600">
            All worked hours on this day count as holiday overtime.
          </span>
        </div>
      )}
      <div className="bg-white rounded-lg border border-gray-200 flex-1 min-h-0 overflow-auto">
        <div className="min-w-max">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#23887C] hover:bg-[#23887C]">
                <TableHead className="text-white font-semibold">Employee</TableHead>
                <TableHead className="text-white font-semibold">Time In</TableHead>
                <TableHead className="text-white font-semibold">Time Out</TableHead>
                <TableHead className="text-white font-semibold">Break hours</TableHead>
                <TableHead className="text-white font-semibold">Working Hours</TableHead>
                <TableHead className="text-white font-semibold">Overtime</TableHead>
                <TableHead className="text-white font-semibold">Status</TableHead>
                <TableHead className="text-white font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : groupedEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-gray-500">
                    No employees found
                  </TableCell>
                </TableRow>
              ) : (
                groupedEmployees.map(({ category, employees: categoryEmployees }) => (
                  <React.Fragment key={category}>
                    {/* Category header */}
                    <TableRow className="bg-[#23887C]/10 border-t-2 border-[#23887C] hover:bg-[#23887C]/10">
                      <TableCell colSpan={8} className="py-3 font-semibold text-[#23887C] text-base">
                        {category} ({categoryEmployees.length})
                      </TableCell>
                    </TableRow>
                    {categoryEmployees.map((employee, index) => {
                      const record = getRecord(employee.id)
                      const status = record?.status
                      const isPresent = status === 'present'
                      const isLeave = status === 'leave'

                      const timeIn = getDefaultTimeIn(employee, record)
                      const timeOut = getDefaultTimeOut(employee, record)
                      const expectedStart = getExpectedStartTime(employee, record)
                      const expectedEnd = getExpectedEndTime(employee, record)
                      const breakHrs = getBreakHours(employee, record)
                      const expectedBreakHrs = getExpectedBreakHours(employee, record)
                      const allHoursAreOvertime = selectedDayInfo.isNonWorkingDay
                      const isOfficeStaff = isOfficeStaffCategory(employee.category?.name)
                      
                      const workingMins = isPresent ? calculateWorkingHours(timeIn, timeOut, breakHrs, allHoursAreOvertime) : null
                      const workingHoursStr = workingMins != null ? formatMinutesToDuration(workingMins) : '-'
                      
                      const overtimeMins = isPresent
                        ? isOfficeStaff && !allHoursAreOvertime
                          ? 0
                          : calculateOvertimeMinutes(
                              timeIn,
                              timeOut,
                              expectedStart,
                              expectedEnd,
                              breakHrs,
                              expectedBreakHrs,
                              allHoursAreOvertime
                            )
                        : null
                      const overtimeStr = overtimeMins != null ? formatMinutesToDuration(overtimeMins) : '0'

                      const breakDisplay =
                        isPresent && breakHrs > 0 ? (breakHrs % 1 === 0 ? String(breakHrs) : String(breakHrs)) : '-'

                      return (
                        <TableRow
                          key={employee.id}
                          className={`hover:bg-gray-50 transition-colors ${
                            index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                          }`}
                        >
                          {/* Employee */}
                          <TableCell className="font-medium text-gray-900">
                            <div className="flex flex-col">
                              <span className="text-xs text-gray-500">{employee.employee_id || '-'}</span>
                              <span>{employee.name}</span>
                            </div>
                          </TableCell>
                          {/* Time In */}
                          <TableCell className="text-gray-700">
                            {isPresent && timeIn ? formatTime12h(timeIn) : <span className="text-gray-400">-</span>}
                          </TableCell>
                          {/* Time Out */}
                          <TableCell className="text-gray-700">
                            {isPresent && timeOut ? formatTime12h(timeOut) : <span className="text-gray-400">-</span>}
                          </TableCell>
                          {/* Break hours */}
                          <TableCell className="text-gray-700">{breakDisplay}</TableCell>
                          {/* Working Hours */}
                          <TableCell className="text-gray-700 font-medium">{workingHoursStr}</TableCell>
                          {/* Overtime */}
                          <TableCell className="text-gray-700 font-medium">
                            {overtimeMins != null && overtimeMins > 0 ? (
                              <span className="text-orange-600">{overtimeStr}</span>
                            ) : (
                              <span className="text-gray-500">{overtimeStr}</span>
                            )}
                          </TableCell>
                          {/* Status */}
                          <TableCell>
                            {!status ? (
                              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-600">
                                Not Marked
                              </span>
                            ) : isPresent ? (
                              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800">
                                Present
                              </span>
                            ) : isLeave ? (
                              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-orange-100 text-orange-800">
                                Leave
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-800">
                                Absent
                              </span>
                            )}
                          </TableCell>
                          {/* Actions */}
                          <TableCell className="text-right">
                            {record && isPresent && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1.5"
                                onClick={() => openEditDialog(employee, record)}
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                                Edit
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ─── Edit Dialog ──────────────────────────────────────────── */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Edit Timesheet</DialogTitle>
            <DialogDescription>
              Update details for <span className="font-medium text-gray-900">{editEmployee?.name}</span> on {format(selectedDate, 'PPP')}.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-4">
            {/* Project */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Project</label>
              <Select value={editProjectId} onValueChange={setEditProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {activeWorkSites.map((ws) => (
                    <SelectItem key={ws.id} value={ws.id}>
                      {ws.name} {ws.short_hand ? `(${ws.short_hand})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Time In */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Time In</label>
              <TimeInput
                value={editTimeIn}
                onChange={setEditTimeIn}
              />
            </div>

            {/* Time Out */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Time Out</label>
              <TimeInput
                value={editTimeOut}
                onChange={setEditTimeOut}
              />
            </div>

            {/* Break Hours */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Break Hours</label>
              <Input
                type="number"
                step="0.5"
                min="0"
                placeholder="e.g., 1 or 0.5"
                value={editBreakHours}
                onChange={(e) => setEditBreakHours(e.target.value)}
                className="h-10"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} disabled={editSaving}>
              Cancel
            </Button>
            <Button
              onClick={handleEditSave}
              disabled={editSaving}
              className="bg-[#23887C] hover:bg-[#1a6b62]"
            >
              {editSaving ? 'Saving…' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </TabsContent>

      <TabsContent value="monthly" className="mt-0 flex-1 flex flex-col min-h-0 overflow-hidden data-[state=inactive]:hidden">
        <div className="space-y-4 flex-1 min-h-0 overflow-auto">
          {loadingMonthly ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-32 rounded-lg" />
              ))}
            </div>
          ) : monthlyGroupedByCategory.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center text-gray-500">
              No employees found
            </div>
          ) : (
            <div className="space-y-6">
              {monthlyGroupedByCategory.map(({ category, employees: categoryEmployees }) => (
                <div key={category}>
                  <h3 className="text-base font-semibold text-[#23887C] mb-3">
                    {category} ({categoryEmployees.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryEmployees.map((employee) => (
                      <Card key={employee.id} className="border-gray-200">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base font-medium flex flex-col gap-0.5">
                            <span className="text-xs text-gray-500 font-normal">{employee.employee_id || '-'}</span>
                            <span>{employee.name}</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="flex gap-2 pt-0">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 gap-1.5"
                            onClick={() => openViewDialog(employee)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            className="flex-1 gap-1.5 bg-[#23887C] hover:bg-[#1a6b62]"
                            onClick={() => handleDownloadPdf(employee)}
                            disabled={pdfDownloadingId === employee.id}
                          >
                            {pdfDownloadingId === employee.id ? (
                              <span className="flex items-center gap-1.5">
                                <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Downloading…
                              </span>
                            ) : (
                              <>
                                <FileDown className="h-3.5 w-3.5" />
                                Download PDF
                              </>
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </TabsContent>
      </Tabs>

      {/* View monthly timesheet dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[90vw] max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Monthly Timesheet</DialogTitle>
            <DialogDescription asChild>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600">
                {viewEmployee && (
                  <>
                    <span>Employee ID: <span className="font-medium text-gray-900">{viewEmployee.employee_id || '-'}</span></span>
                    <span>Employee Name: <span className="font-medium text-gray-900">{viewEmployee.name || '-'}</span></span>
                    <span>From: <span className="font-medium text-gray-900">{format(workingMonthStart, 'dd MMM yyyy')}</span></span>
                    <span>To: <span className="font-medium text-gray-900">{format(workingMonthEnd, 'dd MMM yyyy')}</span></span>
                  </>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-auto flex-1 min-h-0 -mx-6 px-6">
            {viewEmployee && (() => {
              const viewRows = getMonthlyRowsForEmployee(viewEmployee.id)
              const parseHHmmToMins = (v: string) => {
                if (!v || v === '-' || v === '0') return 0
                const parts = v.split(':')
                if (parts.length < 2) return 0
                const h = parseInt(parts[0], 10)
                const m = parseInt(parts[1], 10)
                return (Number.isNaN(h) || Number.isNaN(m)) ? 0 : h * 60 + m
              }
              const totalOvertimeMins = viewRows.reduce((acc, row) => acc + parseHHmmToMins(row.overtime), 0)
              const totalHolidayOTMins = viewRows.reduce((acc, row) => acc + parseHHmmToMins(row.holidayOvertime), 0)
              const totalOvertimeStr = totalOvertimeMins > 0 ? formatMinutesToDuration(totalOvertimeMins) : '-'
              const totalHolidayOTStr = totalHolidayOTMins > 0 ? formatMinutesToDuration(totalHolidayOTMins) : '-'
              return (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#23887C] hover:bg-[#23887C]">
                      <TableHead className="text-white font-semibold">Date</TableHead>
                      <TableHead className="text-white font-semibold">Day</TableHead>
                      <TableHead className="text-white font-semibold">Work Site</TableHead>
                      <TableHead className="text-white font-semibold">Day Info</TableHead>
                      <TableHead className="text-white font-semibold">Time In</TableHead>
                      <TableHead className="text-white font-semibold">Time Out</TableHead>
                      <TableHead className="text-white font-semibold">Total Hours</TableHead>
                      <TableHead className="text-white font-semibold">Break Hrs</TableHead>
                      <TableHead className="text-white font-semibold">Actual Hours</TableHead>
                      <TableHead className="text-white font-semibold">Overtime</TableHead>
                      <TableHead className="text-white font-semibold">Holiday OT</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {viewRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} className="py-8 text-center text-gray-500">
                          No records for this month
                        </TableCell>
                      </TableRow>
                    ) : (
                      viewRows.map((row) => (
                        <TableRow
                          key={row.date}
                          className={
                            row.isNonWorkingDay
                              ? row.nonWorkingDayType === 'holiday'
                                ? 'bg-blue-50 hover:bg-blue-100'
                                : 'bg-red-50 hover:bg-red-100'
                              : ''
                          }
                        >
                          <TableCell className="font-medium whitespace-nowrap">{row.dateFormatted}</TableCell>
                          <TableCell>{row.dayName}</TableCell>
                          <TableCell>{row.workSite}</TableCell>
                          <TableCell>
                            {row.dayInfo ? (
                              <NonWorkingDayBadge
                                info={{
                                  isNonWorkingDay: row.isNonWorkingDay,
                                  type: row.nonWorkingDayType,
                                  label: row.dayInfo,
                                }}
                                compact
                              />
                            ) : null}
                          </TableCell>
                          <TableCell>{row.timeIn}</TableCell>
                          <TableCell>{row.timeOut}</TableCell>
                          <TableCell>{row.totalHours}</TableCell>
                          <TableCell>{row.breakHours}</TableCell>
                          <TableCell>{row.actualHours}</TableCell>
                          <TableCell>
                            {row.overtime !== '-' ? (
                              <span className="text-orange-600 font-medium">{row.overtime}</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {row.holidayOvertime !== '-' ? (
                              <span className="text-purple-600 font-medium">{row.holidayOvertime}</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                  {viewRows.length > 0 && (
                    <TableFooter>
                      <TableRow className="bg-[#f0faf9] hover:bg-[#e6f5f3]">
                        <TableCell colSpan={9} className="font-semibold text-gray-800 text-right">
                          Total
                        </TableCell>
                        <TableCell className="font-semibold text-[#23887C]">
                          {totalOvertimeStr}
                        </TableCell>
                        <TableCell className="font-semibold text-[#23887C]">
                          {totalHolidayOTStr}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  )}
                </Table>
              )
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
