'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useEmployees, Employee } from '@/lib/hooks/useEmployees'
import { useCategories } from '@/lib/hooks/useCategories'
import { useWorkSites, WorkSite } from '@/lib/hooks/useWorkSites'
import { AttendanceService } from '@/lib/services/attendance.service'
import { WorkSiteService } from '@/lib/services/work-site.service'
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
import {
  Table,
  TableBody,
  TableCell,
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

function parseTimeToMinutes(t: string | null | undefined): number | null {
  if (!t || typeof t !== 'string') return null
  const trimmed = t.trim()
  if (!trimmed) return null
  const parts = trimmed.split(':')
  if (parts.length < 2) return null
  const h = parseInt(parts[0], 10)
  const m = parseInt(parts[1], 10)
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return h * 60 + m
}

function formatMinutesToTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

function toHHmm(t: string | null | undefined): string {
  if (!t || typeof t !== 'string') return ''
  const trimmed = t.trim()
  if (!trimmed) return ''
  const parts = trimmed.split(':')
  if (parts.length < 2) return ''
  const h = parseInt(parts[0], 10)
  const m = parseInt(parts[1], 10)
  if (Number.isNaN(h) || Number.isNaN(m)) return ''
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

function calculateWorkingHours(
  timeIn: string | null | undefined,
  timeOut: string | null | undefined,
  breakHours: number = 0,
  date?: Date | string
): number | null {
  const inM = parseTimeToMinutes(timeIn)
  const outM = parseTimeToMinutes(timeOut)
  if (inM == null || outM == null) return null
  const totalMins = outM - inM
  if (totalMins <= 0) return 0
  
  // Check if the date is Sunday - if so, return 0 working hours (all hours are overtime)
  if (date) {
    const dateObj = typeof date === 'string' ? new Date(date + 'T12:00:00') : date
    const dayOfWeek = dateObj.getDay()
    if (dayOfWeek === 0) {
      // Sunday - no working hours, all hours count as overtime
      return 0
    }
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
 * @param date - Date to check if Sunday (all hours = overtime on Sunday)
 * @returns Overtime minutes (excess hours beyond expected working time)
 */
function calculateOvertimeMinutes(
  timeIn: string | null | undefined,
  timeOut: string | null | undefined,
  expectedStartTime: string | null | undefined,
  expectedEndTime: string | null | undefined,
  breakHoursActual: number = 0,
  breakHoursExpected: number = 0,
  date?: Date | string
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

  // Check if the date is Sunday (day 0) - if so, all working hours count as overtime
  if (date) {
    const dateObj = typeof date === 'string' ? new Date(date + 'T12:00:00') : date
    const dayOfWeek = dateObj.getDay()
    if (dayOfWeek === 0) {
      // Sunday - all working hours are overtime
      return actualWorkingMins
    }
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
}

// ─── Component ───────────────────────────────────────────────────────

export function TimesheetPageContent() {
  const { employees, loading: employeesLoading } = useEmployees()
  const { categories } = useCategories()
  const { workSites } = useWorkSites()

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
  const [editProjectId, setEditProjectId] = useState<string>('__none__')
  const [editSaving, setEditSaving] = useState(false)
  /** Project times effective on selected date (for correct overtime). */
  const [workSiteTimesOnDate, setWorkSiteTimesOnDate] = useState<
    Record<string, { time_in: string | null; time_out: string | null; break_hours: number | null }>
  >({})

  // Monthly tab state
  const [activeTab, setActiveTab] = useState<'daily' | 'monthly'>('daily')
  const [selectedMonth, setSelectedMonth] = useState<Date>(() => {
    const d = new Date()
    d.setDate(1)
    return d
  })
  const [recordsInRange, setRecordsInRange] = useState<TimesheetRecord[]>([])
  const [workSiteTimesByDate, setWorkSiteTimesByDate] = useState<
    Record<string, Record<string, { time_in: string | null; time_out: string | null; break_hours: number | null }>>
  >({})
  const [loadingMonthly, setLoadingMonthly] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [viewEmployee, setViewEmployee] = useState<Employee | null>(null)
  const [pdfDownloadingId, setPdfDownloadingId] = useState<string | null>(null)

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

  useEffect(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    WorkSiteService.getWorkSiteTimesForAllSitesOnDate(dateStr).then(setWorkSiteTimesOnDate)
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
    const dates = workingMonthDates
    Promise.all([
      AttendanceService.getTimesheetByDateRange(startStr, endStr),
      ...dates.map((d) =>
        WorkSiteService.getWorkSiteTimesForAllSitesOnDate(d).then((times) => ({ date: d, times }))
      ),
    ])
      .then(([recs, ...dateTimes]) => {
        setRecordsInRange((recs as TimesheetRecord[]) || [])
        const byDate: typeof workSiteTimesByDate = {}
        dateTimes.forEach(({ date, times }) => {
          byDate[date] = times
        })
        setWorkSiteTimesByDate(byDate)
      })
      .catch((err) => {
        console.error('Error fetching monthly timesheet:', err)
        setRecordsInRange([])
        setWorkSiteTimesByDate({})
      })
      .finally(() => setLoadingMonthly(false))
  }, [activeTab, workingMonthStart, workingMonthEnd, workingMonthDates])

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

  /** Get actual time_in: from timesheet record (can be edited), work site, or category */
  const getDefaultTimeIn = (employee: Employee, record: TimesheetRecord | undefined) => {
    if (record?.time_in) return record.time_in
    if (record?.work_site_id) {
      const times = workSiteTimesOnDate[record.work_site_id]
      if (times?.time_in) return times.time_in
      const ws = workSiteMap[record.work_site_id]
      if (ws?.time_in) return ws.time_in
    }
    const catId = employee.category_id || employee.category?.id
    const cat = catId ? categoryMap[catId] : null
    return cat?.time_in ?? ''
  }

  /** Get actual time_out: from timesheet record (can be edited), work site, or category */
  const getDefaultTimeOut = (employee: Employee, record: TimesheetRecord | undefined) => {
    if (record?.time_out) return record.time_out
    if (record?.work_site_id) {
      const times = workSiteTimesOnDate[record.work_site_id]
      if (times?.time_out) return times.time_out
      const ws = workSiteMap[record.work_site_id]
      if (ws?.time_out) return ws.time_out
    }
    const catId = employee.category_id || employee.category?.id
    const cat = catId ? categoryMap[catId] : null
    return cat?.time_out ?? ''
  }

  /** Get expected time_in: from work site or category (NOT from timesheet edits) */
  const getExpectedStartTime = (employee: Employee, record: TimesheetRecord | undefined) => {
    if (record?.work_site_id) {
      const times = workSiteTimesOnDate[record.work_site_id]
      if (times?.time_in) return times.time_in
      const ws = workSiteMap[record.work_site_id]
      if (ws?.time_in) return ws.time_in
    }
    const catId = employee.category_id || employee.category?.id
    const cat = catId ? categoryMap[catId] : null
    return cat?.time_in ?? null
  }

  /** Get expected time_out: from work site or category (NOT from timesheet edits) */
  const getExpectedEndTime = (employee: Employee, record: TimesheetRecord | undefined) => {
    if (record?.work_site_id) {
      const times = workSiteTimesOnDate[record.work_site_id]
      if (times?.time_out) return times.time_out
      const ws = workSiteMap[record.work_site_id]
      if (ws?.time_out) return ws.time_out
    }
    const catId = employee.category_id || employee.category?.id
    const cat = catId ? categoryMap[catId] : null
    return cat?.time_out ?? null
  }

  /** Break hours for display and overtime: from work site (on date) or category. */
  const getBreakHours = (employee: Employee, record: TimesheetRecord | undefined): number => {
    if (record?.work_site_id) {
      const times = workSiteTimesOnDate[record.work_site_id]
      if (times?.break_hours != null) return times.break_hours
      const ws = workSiteMap[record.work_site_id]
      if (ws?.break_hours != null) return ws.break_hours
    }
    const catId = employee.category_id || employee.category?.id
    const cat = catId ? categoryMap[catId] : null
    return cat?.break_hours ?? 0
  }

  /** Break hours for a record on a specific date (monthly view uses workSiteTimesByDate). */
  const getBreakHoursForDate = (
    employee: Employee,
    record: TimesheetRecord,
    dateStr: string
  ): number => {
    const byDate = workSiteTimesByDate[dateStr]
    if (record.work_site_id && byDate?.[record.work_site_id]?.break_hours != null)
      return byDate[record.work_site_id].break_hours!
    if (record.work_site_id) {
      const ws = workSiteMap[record.work_site_id]
      if (ws?.break_hours != null) return ws.break_hours
    }
    const catId = employee.category_id || employee.category?.id
    const cat = catId ? categoryMap[catId] : null
    return cat?.break_hours ?? 0
  }

  /** Expected start/end for a record on a specific date (monthly view). */
  const getExpectedStartForDate = (
    employee: Employee,
    record: TimesheetRecord,
    dateStr: string
  ): string | null => {
    const byDate = workSiteTimesByDate[dateStr]
    if (record.work_site_id && byDate?.[record.work_site_id]?.time_in != null)
      return byDate[record.work_site_id].time_in
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
    dateStr: string
  ): string | null => {
    const byDate = workSiteTimesByDate[dateStr]
    if (record.work_site_id && byDate?.[record.work_site_id]?.time_out != null)
      return byDate[record.work_site_id].time_out
    if (record.work_site_id) {
      const ws = workSiteMap[record.work_site_id]
      if (ws?.time_out) return ws.time_out
    }
    const catId = employee.category_id || employee.category?.id
    const cat = catId ? categoryMap[catId] : null
    return cat?.time_out ?? null
  }

  /** Default time in/out for a record (monthly: from record or work site/category for that date). */
  const getTimeInForRecord = (employee: Employee, record: TimesheetRecord, dateStr: string): string => {
    if (record.time_in) return record.time_in
    const byDate = workSiteTimesByDate[dateStr]
    if (record.work_site_id && byDate?.[record.work_site_id]?.time_in) return byDate[record.work_site_id].time_in!
    if (record.work_site_id && workSiteMap[record.work_site_id]?.time_in)
      return workSiteMap[record.work_site_id].time_in!
    const catId = employee.category_id || employee.category?.id
    const cat = catId ? categoryMap[catId] : null
    return cat?.time_in ?? ''
  }

  const getTimeOutForRecord = (employee: Employee, record: TimesheetRecord, dateStr: string): string => {
    if (record.time_out) return record.time_out
    const byDate = workSiteTimesByDate[dateStr]
    if (record.work_site_id && byDate?.[record.work_site_id]?.time_out) return byDate[record.work_site_id].time_out!
    if (record.work_site_id && workSiteMap[record.work_site_id]?.time_out)
      return workSiteMap[record.work_site_id].time_out!
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
    setEditProjectId(record?.work_site_id || '__none__')
    setEditDialogOpen(true)
  }

  const handleEditSave = async () => {
    if (!editRecord || !editEmployee) return
    setEditSaving(true)
    try {
      await AttendanceService.updateTimesheetRecord(editRecord.id, {
        time_in: editTimeIn.trim() || null,
        time_out: editTimeOut.trim() || null,
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
      const isSunday = dateObj.getDay() === 0
      const record = recordsByDate.get(dateStr)
      if (!record) {
        return {
          date: dateStr,
          dateFormatted: format(dateObj, 'dd MMM yyyy'),
          timeIn: '-',
          timeOut: '-',
          breakHours: '-',
          workingHours: '-',
          overtime: '0',
          status: 'Not Marked',
          isSunday,
        }
      }
      const timeIn = getTimeInForRecord(emp, record, dateStr)
      const timeOut = getTimeOutForRecord(emp, record, dateStr)
      const breakHrs = getBreakHoursForDate(emp, record, dateStr)
      const expStart = getExpectedStartForDate(emp, record, dateStr)
      const expEnd = getExpectedEndForDate(emp, record, dateStr)
      
      const workingMins = record.status === 'present' ? calculateWorkingHours(timeIn, timeOut, breakHrs, dateStr) : null
      const workingHoursStr = workingMins != null ? formatMinutesToTime(workingMins) : '-'
      
      const overtimeMins =
        record.status === 'present'
          ? calculateOvertimeMinutes(timeIn, timeOut, expStart, expEnd, breakHrs, breakHrs, dateStr)
          : null
      const overtimeStr = overtimeMins != null ? formatMinutesToTime(overtimeMins) : '0'
      const breakDisplay = breakHrs > 0 ? (breakHrs % 1 === 0 ? String(breakHrs) : String(breakHrs)) : '-'
      return {
        date: dateStr,
        dateFormatted: format(new Date(dateStr + 'T12:00:00'), 'dd MMM yyyy'),
        timeIn: timeIn ? toHHmm(timeIn) : '-',
        timeOut: timeOut ? toHHmm(timeOut) : '-',
        breakHours: breakDisplay,
        workingHours: workingHoursStr,
        overtime: overtimeStr,
        status: record.status,
        isSunday,
      }
    })
  }

  const handleDownloadPdf = async (employee: Employee) => {
    setPdfDownloadingId(employee.id)
    try {
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
        r.timeIn,
        r.timeOut,
        r.breakHours,
        r.workingHours,
        r.overtime,
        r.status,
      ])
      autoTable(doc, {
        startY: 52,
        head: [['Date', 'Time In', 'Time Out', 'Break Hours', 'Working Hours', 'Overtime', 'Status']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [35, 136, 124] },
      })
      doc.save(`timesheet-${employee.employee_id || employee.id}-${format(workingMonthEnd, 'yyyy-MM')}.pdf`)
    } catch (err) {
      console.error('Error generating PDF:', err)
      alert('Failed to download PDF.')
    } finally {
      setPdfDownloadingId(null)
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
              {(() => {
                const dayOfWeek = selectedDate.getDay()
                const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
                const isSunday = dayOfWeek === 0
                return (
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                      isSunday
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {isSunday ? 'WEEKOFF' : 'WEEK'} ({dayNames[dayOfWeek]})
                  </span>
                )
              })()}
            </>
          )}
          {activeTab === 'monthly' && (
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
          )}
        </div>
      </div>

      <TabsContent value="daily" className="mt-0 flex-1 flex flex-col min-h-0 data-[state=inactive]:hidden overflow-hidden">
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
                      
                      const workingMins = isPresent ? calculateWorkingHours(timeIn, timeOut, breakHrs, selectedDate) : null
                      const workingHoursStr = workingMins != null ? formatMinutesToTime(workingMins) : '-'
                      
                      const overtimeMins = isPresent
                        ? calculateOvertimeMinutes(
                            timeIn,
                            timeOut,
                            expectedStart,
                            expectedEnd,
                            breakHrs,
                            breakHrs,
                            selectedDate
                          )
                        : null
                      const overtimeStr = overtimeMins != null ? formatMinutesToTime(overtimeMins) : '0'

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
                            {isPresent && timeIn ? toHHmm(timeIn) : <span className="text-gray-400">-</span>}
                          </TableCell>
                          {/* Time Out */}
                          <TableCell className="text-gray-700">
                            {isPresent && timeOut ? toHHmm(timeOut) : <span className="text-gray-400">-</span>}
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
              <Input
                type="time"
                value={editTimeIn}
                onChange={(e) => setEditTimeIn(e.target.value)}
                className="h-10"
              />
            </div>

            {/* Time Out */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Time Out</label>
              <Input
                type="time"
                value={editTimeOut}
                onChange={(e) => setEditTimeOut(e.target.value)}
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
            {viewEmployee && (
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#23887C] hover:bg-[#23887C]">
                    <TableHead className="text-white font-semibold">Date</TableHead>
                    <TableHead className="text-white font-semibold">Time In</TableHead>
                    <TableHead className="text-white font-semibold">Time Out</TableHead>
                    <TableHead className="text-white font-semibold">Break Hours</TableHead>
                    <TableHead className="text-white font-semibold">Working Hours</TableHead>
                    <TableHead className="text-white font-semibold">Overtime</TableHead>
                    <TableHead className="text-white font-semibold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getMonthlyRowsForEmployee(viewEmployee.id).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-8 text-center text-gray-500">
                        No records for this month
                      </TableCell>
                    </TableRow>
                  ) : (
                    getMonthlyRowsForEmployee(viewEmployee.id).map((row) => (
                      <TableRow 
                        key={row.date}
                        className={row.isSunday ? 'bg-red-50 hover:bg-red-100' : ''}
                      >
                        <TableCell className="font-medium">
                          {row.dateFormatted}
                          {row.isSunday && (
                            <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">
                              WEEKOFF
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{row.timeIn}</TableCell>
                        <TableCell>{row.timeOut}</TableCell>
                        <TableCell>{row.breakHours}</TableCell>
                        <TableCell>{row.workingHours}</TableCell>
                        <TableCell>{row.overtime}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              row.status === 'present'
                                ? 'bg-green-100 text-green-800'
                                : row.status === 'leave'
                                  ? 'bg-orange-100 text-orange-800'
                                  : row.status === 'Not Marked'
                                    ? 'bg-gray-100 text-gray-600'
                                    : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {row.status === 'present'
                              ? 'Present'
                              : row.status === 'leave'
                                ? 'Leave'
                                : row.status === 'Not Marked'
                                  ? 'Not Marked'
                                  : 'Absent'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
