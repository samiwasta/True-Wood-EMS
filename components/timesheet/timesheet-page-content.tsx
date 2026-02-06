'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useEmployees, Employee } from '@/lib/hooks/useEmployees'
import { useCategories } from '@/lib/hooks/useCategories'
import { useWorkSites, WorkSite } from '@/lib/hooks/useWorkSites'
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
  Search,
  X,
} from 'lucide-react'
import { format } from 'date-fns'
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

function calculateOvertimeMinutes(
  timeIn: string | null | undefined,
  timeOut: string | null | undefined,
  expectedStartTime: string | null | undefined,
  expectedEndTime: string | null | undefined
): number | null {
  const inM = parseTimeToMinutes(timeIn)
  const outM = parseTimeToMinutes(timeOut)
  const expStartM = parseTimeToMinutes(expectedStartTime)
  const expEndM = parseTimeToMinutes(expectedEndTime)
  if (inM == null || outM == null) return null
  const actualDuration = outM - inM
  if (actualDuration <= 0) return 0
  const expectedDuration =
    expStartM != null && expEndM != null && expEndM > expStartM
      ? expEndM - expStartM
      : null
  if (expectedDuration == null) return null
  return Math.max(0, actualDuration - expectedDuration)
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

  // ─── Lookup maps ──────────────────────────────────────────────────

  const categoryMap = useMemo(() => {
    const m: Record<string, { name?: string; time_in?: string; time_out?: string }> = {}
    categories.forEach((c) => {
      if (c.id) m[c.id] = { name: c.name, time_in: c.time_in, time_out: c.time_out }
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

  const getDefaultTimeIn = (employee: Employee, record: TimesheetRecord | undefined) => {
    if (record?.time_in) return record.time_in
    // From project (work_site)
    if (record?.work_site_id) {
      const ws = workSiteMap[record.work_site_id]
      if (ws?.time_in) return ws.time_in
    }
    // From category
    const catId = employee.category_id || employee.category?.id
    const cat = catId ? categoryMap[catId] : null
    return cat?.time_in ?? ''
  }

  const getDefaultTimeOut = (employee: Employee, record: TimesheetRecord | undefined) => {
    if (record?.time_out) return record.time_out
    // From project (work_site)
    if (record?.work_site_id) {
      const ws = workSiteMap[record.work_site_id]
      if (ws?.time_out) return ws.time_out
    }
    // From category
    const catId = employee.category_id || employee.category?.id
    const cat = catId ? categoryMap[catId] : null
    return cat?.time_out ?? ''
  }

  const getExpectedStartTime = (employee: Employee, record: TimesheetRecord | undefined) => {
    if (record?.work_site_id) {
      const ws = workSiteMap[record.work_site_id]
      if (ws?.time_in) return ws.time_in
    }
    const catId = employee.category_id || employee.category?.id
    const cat = catId ? categoryMap[catId] : null
    return cat?.time_in ?? null
  }

  const getExpectedEndTime = (employee: Employee, record: TimesheetRecord | undefined) => {
    if (record?.work_site_id) {
      const ws = workSiteMap[record.work_site_id]
      if (ws?.time_out) return ws.time_out
    }
    const catId = employee.category_id || employee.category?.id
    const cat = catId ? categoryMap[catId] : null
    return cat?.time_out ?? null
  }

  const getProjectDisplay = (record: TimesheetRecord | undefined) => {
    if (!record?.work_site_id) return '-'
    const ws = workSiteMap[record.work_site_id]
    return ws ? ws.short_hand || ws.name : '-'
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
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-900">Timesheet</h1>
        <div className="flex items-center gap-3">
          {/* Search */}
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
          {/* Date nav */}
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
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-[#23887C] hover:bg-[#23887C]">
                <TableHead className="text-white font-semibold">Employee</TableHead>
                <TableHead className="text-white font-semibold">Project</TableHead>
                <TableHead className="text-white font-semibold">Time In</TableHead>
                <TableHead className="text-white font-semibold">Time Out</TableHead>
                <TableHead className="text-white font-semibold">Overtime</TableHead>
                <TableHead className="text-white font-semibold">Status</TableHead>
                <TableHead className="text-white font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : groupedEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-gray-500">
                    No employees found
                  </TableCell>
                </TableRow>
              ) : (
                groupedEmployees.map(({ category, employees: categoryEmployees }) => (
                  <React.Fragment key={category}>
                    {/* Category header */}
                    <TableRow className="bg-[#23887C]/10 border-t-2 border-[#23887C] hover:bg-[#23887C]/10">
                      <TableCell colSpan={7} className="py-3 font-semibold text-[#23887C] text-base">
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
                      const overtimeMins = isPresent
                        ? calculateOvertimeMinutes(timeIn, timeOut, expectedStart, expectedEnd)
                        : null
                      const overtimeStr =
                        overtimeMins != null && overtimeMins > 0
                          ? formatMinutesToTime(overtimeMins)
                          : '-'

                      const projectDisplay = isPresent ? getProjectDisplay(record) : '-'

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
                          {/* Project */}
                          <TableCell className="text-gray-700">{projectDisplay}</TableCell>
                          {/* Time In */}
                          <TableCell className="text-gray-700">
                            {isPresent && timeIn ? toHHmm(timeIn) : <span className="text-gray-400">-</span>}
                          </TableCell>
                          {/* Time Out */}
                          <TableCell className="text-gray-700">
                            {isPresent && timeOut ? toHHmm(timeOut) : <span className="text-gray-400">-</span>}
                          </TableCell>
                          {/* Overtime */}
                          <TableCell className="text-gray-700 font-medium">
                            {overtimeMins != null && overtimeMins > 0 ? (
                              <span className="text-orange-600">{overtimeStr}</span>
                            ) : (
                              '-'
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
    </div>
  )
}
