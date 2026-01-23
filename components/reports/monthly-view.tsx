'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useEmployees, Employee } from '@/lib/hooks/useEmployees'
import { useLeaveTypes } from '@/lib/hooks/useLeaveTypes'
import { useWorkSites } from '@/lib/hooks/useWorkSites'
import { useHolidays } from '@/lib/hooks/useHolidays'
import { useWeeklyOff } from '@/lib/hooks/useWeeklyOff'
import { AttendanceService } from '@/lib/services/attendance.service'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import {
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  Search,
  Users,
  Calendar,
} from 'lucide-react'
import { format, eachDayOfInterval, getDate } from 'date-fns'
import { cn } from '@/lib/utils'
import {
  getDayName,
  isHoliday,
  isWeeklyOff,
  getStatusLabel,
  getStatusColor,
  getLeaveTypeAbbreviation,
  getWorkSiteInitials,
} from '@/lib/utils/reports.utils'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

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
  employees?: {
    id: string
    employee_id: string
    name: string
    category: { id: string; name: string }[]
    department: { id: string; name: string }[]
  }[]
}

const getCurrentWorkingMonth = () => {
  const today = new Date()
  const currentDay = today.getDate()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()

  let startDate: Date
  let endDate: Date

  if (currentDay >= 26) {
    startDate = new Date(currentYear, currentMonth, 26)
    endDate = new Date(currentYear, currentMonth + 1, 25)
  } else {
    startDate = new Date(currentYear, currentMonth - 1, 26)
    endDate = new Date(currentYear, currentMonth, 25)
  }

  return {
    start: startDate,
    end: endDate,
    startMonth: startDate.getMonth(),
    startYear: startDate.getFullYear(),
  }
}

const getWorkingMonthDates = (startMonth: number, startYear: number) => {
  const startDate = new Date(startYear, startMonth, 26)
  const endDate = new Date(startYear, startMonth + 1, 25)

  return {
    start: startDate,
    end: endDate,
    dates: eachDayOfInterval({ start: startDate, end: endDate })
  }
}

const getMonthCombinationLabel = (startMonth: number) => {
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ]

  const startMonthName = monthNames[startMonth]
  const endMonth = startMonth === 11 ? 0 : startMonth + 1
  const endMonthName = monthNames[endMonth]

  return `${startMonthName} - ${endMonthName}`
}


export function MonthlyView() {
  const { employees, loading: employeesLoading } = useEmployees()
  const { leaveTypes } = useLeaveTypes()
  const { workSites } = useWorkSites()
  const { holidays } = useHolidays()
  const { weeklyOff } = useWeeklyOff()
  const currentWorkingMonth = getCurrentWorkingMonth()
  const [selectedStartMonth, setSelectedStartMonth] = useState(currentWorkingMonth.startMonth)
  const [selectedStartYear, setSelectedStartYear] = useState(currentWorkingMonth.startYear)
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)

  const workingMonth = useMemo(() => {
    return getWorkingMonthDates(selectedStartMonth, selectedStartYear)
  }, [selectedStartMonth, selectedStartYear])

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true)
      try {
        const startDateStr = format(workingMonth.start, 'yyyy-MM-dd')
        const endDateStr = format(workingMonth.end, 'yyyy-MM-dd')
        const records = await AttendanceService.getAttendanceByDateRange(startDateStr, endDateStr)
        setAttendanceRecords(records)
      } catch (error) {
        console.error('Error fetching attendance:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAttendance()
  }, [workingMonth.start, workingMonth.end])

  const handlePreviousMonth = () => {
    if (selectedStartMonth === 0) {
      setSelectedStartMonth(11)
      setSelectedStartYear(selectedStartYear - 1)
    } else {
      setSelectedStartMonth(selectedStartMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (selectedStartMonth === 11) {
      setSelectedStartMonth(0)
      setSelectedStartYear(selectedStartYear + 1)
    } else {
      setSelectedStartMonth(selectedStartMonth + 1)
    }
  }

  const groupedEmployees = useMemo(() => {
    const grouped: Record<string, Employee[]> = {}

    let filteredEmployees = employees

    // Apply search filter
    if (searchQuery) {
      filteredEmployees = filteredEmployees.filter(emp =>
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.employee_id?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter employees based on their status during the selected month
    const monthStart = workingMonth.start
    const monthEnd = workingMonth.end
    
    filteredEmployees = filteredEmployees.filter((employee: Employee) => {
      // If employee is currently active, include them
      if (employee.status === 'active') {
        return true
      }

      // If employee is not active, check if they became inactive during this month
      // Include them only if their exit_date is within this month
      if (employee.exit_date) {
        const exitDate = new Date(employee.exit_date)
        // Include if exit date is within the month (they became inactive during this month)
        return exitDate >= monthStart && exitDate <= monthEnd
      }

      // If no exit_date but status is not active, exclude them
      return false
    })

    filteredEmployees.forEach((employee: Employee) => {
      const categoryName = employee.category?.name || 'Uncategorized'
      if (!grouped[categoryName]) {
        grouped[categoryName] = []
      }
      grouped[categoryName].push(employee)
    })

    Object.keys(grouped).forEach(category => {
      grouped[category].sort((a, b) => {
        const idA = a.employee_id || ''
        const idB = b.employee_id || ''
        return idA.localeCompare(idB, undefined, { numeric: true, sensitivity: 'base' })
      })
    })

    const sortedCategories = Object.keys(grouped).sort((a, b) => {
      const orderA = getCategoryOrder(a)
      const orderB = getCategoryOrder(b)

      if (orderA !== 999 && orderB !== 999) {
        return orderA - orderB
      }

      if (orderA !== 999) return -1
      if (orderB !== 999) return 1

      return a.localeCompare(b)
    })

    return sortedCategories.map(category => ({
      category,
      employees: grouped[category],
    }))
  }, [employees, searchQuery, workingMonth.start, workingMonth.end])

  const attendanceMap = useMemo(() => {
    const map: Record<string, Record<string, AttendanceRecord>> = {}

    attendanceRecords.forEach((record) => {
      if (record.employee_id && record.date) {
        if (!map[record.employee_id]) {
          map[record.employee_id] = {}
        }
        map[record.employee_id][record.date] = record
      }
    })

    return map
  }, [attendanceRecords])

  const getDayStatus = useCallback((date: Date) => {
    const holiday = isHoliday(date, holidays)
    if (holiday) return { type: 'holiday' as const, name: holiday.name || 'Holiday' }
    if (isWeeklyOff(date, weeklyOff)) return { type: 'weekoff' as const, name: 'Week Off' }
    return null
  }, [holidays, weeklyOff])

  // Calculate per-employee statistics
  const employeeStatistics = useMemo(() => {
    const stats: Record<string, {
      present: number
      absent: number
      leaves: Record<string, number> // leave_type_id -> count
      workSites: Record<string, number> // work_site_id -> count
    }> = {}

    employees.forEach(employee => {
      stats[employee.id] = {
        present: 0,
        absent: 0,
        leaves: {},
        workSites: {}
      }

      workingMonth.dates.forEach(date => {
        const dateStr = format(date, 'yyyy-MM-dd')
        const record = attendanceMap[employee.id]?.[dateStr]
        const dayStatus = getDayStatus(date)

        // If there's an attendance record, count it regardless of day status
        // If no record, then skip if it's a holiday or weekoff
        if (!record && dayStatus) return

        if (record?.status === 'present') {
          stats[employee.id].present++
          if (record.work_site_id) {
            stats[employee.id].workSites[record.work_site_id] =
              (stats[employee.id].workSites[record.work_site_id] || 0) + 1
          }
        } else if (record?.status === 'absent') {
          stats[employee.id].absent++
        } else if (record?.status === 'leave' && record.leave_type_id) {
          stats[employee.id].leaves[record.leave_type_id] =
            (stats[employee.id].leaves[record.leave_type_id] || 0) + 1
        }
      })
    })

    return stats
  }, [employees, workingMonth.dates, attendanceMap, getDayStatus])


  const monthCombinations = useMemo(() => {
    const combinations: Array<{ startMonth: number; startYear: number; label: string }> = []
    const currentYear = new Date().getFullYear()

    for (let year = currentYear - 2; year <= currentYear + 2; year++) {
      for (let month = 0; month < 12; month++) {
        combinations.push({
          startMonth: month,
          startYear: year,
          label: getMonthCombinationLabel(month),
        })
      }
    }

    return combinations
  }, [])

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)

  const filteredCombinations = useMemo(() => {
    return monthCombinations.filter(combo => combo.startYear === selectedStartYear)
  }, [monthCombinations, selectedStartYear])

  const selectedCombinationValue = `${selectedStartMonth}-${selectedStartYear}`

  // Export to Excel
  const exportToExcel = () => {
    const exportData: (string | number)[][] = []

    // 1. Metadata Row
    exportData.push([`Attendance Report: ${format(workingMonth.start, 'dd MMM yyyy')} - ${format(workingMonth.end, 'dd MMM yyyy')}`])
    exportData.push(['Generated on:', format(new Date(), 'dd MMM yyyy HH:mm')])
    exportData.push([]) // Spacer

    // 2. Header Row
    const headerRow = ['Employee ID', 'Employee Name', 'Category']
    workingMonth.dates.forEach(date => {
      headerRow.push(format(date, 'dd'))
    })
    // Summary Headers
    headerRow.push('Present', 'Absent')
    leaveTypes.forEach(lt => headerRow.push(lt.name || ''))
    workSites.forEach(ws => headerRow.push(ws.name || ''))

    exportData.push(headerRow)

    // 3. Employee Data
    groupedEmployees.forEach(({ category, employees: categoryEmployees }) => {
      categoryEmployees.forEach(employee => {
        const stats = employeeStatistics[employee.id]
        const row: (string | number)[] = [
          employee.employee_id || '-',
          employee.name,
          category
        ]

        // Daily Attendance
        workingMonth.dates.forEach(date => {
          const dateStr = format(date, 'yyyy-MM-dd')
          const record = attendanceMap[employee.id]?.[dateStr]
          const dayStatus = getDayStatus(date)
          const statusLabel = getStatusLabel(
            record?.status,
            dayStatus,
            record?.work_site_id,
            record?.leave_type_id,
            leaveTypes,
            workSites
          )
          row.push(statusLabel)
        })

        // Summary Counts
        row.push(stats?.present || 0)
        row.push(stats?.absent || 0)
        leaveTypes.forEach(lt => row.push(stats?.leaves[lt.id] || 0))
        workSites.forEach(ws => row.push(stats?.workSites[ws.id] || 0))

        exportData.push(row)
      })
    })

    // 4. Legend Section
    exportData.push([])
    exportData.push([])
    exportData.push(['LEGEND'])
    exportData.push(['Code', 'Description', 'Type'])
    exportData.push(['P', 'Present', 'Status'])
    exportData.push(['A', 'Absent', 'Status'])
    exportData.push(['H', 'Holiday', 'Status'])
    exportData.push(['WO', 'Week Off', 'Status'])

    leaveTypes.forEach(lt => {
      exportData.push([getLeaveTypeAbbreviation(lt.name || 'Leave'), lt.name || 'Leave', 'Leave'])
    })

    workSites.forEach(ws => {
      const abbr = ws.short_hand || getWorkSiteInitials(ws.name)
      exportData.push([abbr, ws.name, 'Work Site'])
    })

    const ws = XLSX.utils.aoa_to_sheet(exportData)

    // Auto-width for first few columns
    ws['!cols'] = [
      { wch: 15 }, // ID
      { wch: 25 }, // Name
      { wch: 15 }, // Category
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance Report')
    XLSX.writeFile(wb, `Attendance_${format(workingMonth.start, 'dd-MMM-yyyy')}_to_${format(workingMonth.end, 'dd-MMM-yyyy')}.xlsx`)
  }

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF('landscape', 'mm', 'a4')

    // Color Helpers matching reports.utils.ts
    const getColorRGB = (colorClass: string): [number, number, number] => {
      if (colorClass.includes('green-100')) return [220, 252, 231]
      if (colorClass.includes('red-100')) return [254, 226, 226]
      if (colorClass.includes('yellow-100')) return [254, 249, 195]
      if (colorClass.includes('orange-100')) return [255, 237, 213]
      if (colorClass.includes('pink-100')) return [252, 231, 243]
      if (colorClass.includes('indigo-100')) return [224, 231, 255]
      if (colorClass.includes('teal-100')) return [204, 251, 241]
      if (colorClass.includes('cyan-100')) return [207, 250, 254]
      if (colorClass.includes('lime-100')) return [236, 252, 203]
      if (colorClass.includes('fuchsia-100')) return [250, 232, 255]
      if (colorClass.includes('purple-100')) return [243, 232, 255]
      if (colorClass.includes('violet-100')) return [237, 233, 254]
      if (colorClass.includes('blue-100')) return [219, 234, 254]
      if (colorClass.includes('sky-100')) return [224, 242, 254]
      if (colorClass.includes('gray-100')) return [243, 244, 246]
      // Fallback
      return [255, 255, 255]
    }

    const getCodeColor = (category: string, id: string | null): [number, number, number] => {
      // Simulate logic from reports.utils.ts getStatusColor
      if (category === 'Status') {
        if (id === 'P') return [220, 252, 231] // present
        if (id === 'A') return [254, 226, 226] // absent
        if (id === 'H') return [219, 234, 254] // holiday
        if (id === 'WO') return [243, 244, 246] // weekoff
      }
      if (category === 'Leave' && id) {
        const index = leaveTypes.findIndex(lt => lt.id === id)
        if (index >= 0) {
          const colors = [
            'bg-yellow-100', 'bg-orange-100', 'bg-pink-100', 'bg-indigo-100',
            'bg-teal-100', 'bg-cyan-100', 'bg-lime-100', 'bg-fuchsia-100'
          ]
          return getColorRGB(colors[index % colors.length])
        }
      }
      if (category === 'Work Site' && id) {
        const index = workSites.findIndex(ws => ws.id === id)
        if (index >= 0) {
          const colors = [
            'bg-purple-100', 'bg-violet-100', 'bg-fuchsia-100', 'bg-indigo-100',
            'bg-blue-100', 'bg-sky-100', 'bg-cyan-100', 'bg-teal-100'
          ]
          return getColorRGB(colors[index % colors.length])
        }
      }
      return [255, 255, 255]
    }

    // Title
    doc.setFontSize(16)
    doc.text('Monthly Attendance Report', 14, 15)
    doc.setFontSize(10)
    doc.text(`Period: ${format(workingMonth.start, 'dd MMM yyyy')} - ${format(workingMonth.end, 'dd MMM yyyy')}`, 14, 22)

    // Prepare Headers
    const headers = [
      'ID', 'Name',
      ...workingMonth.dates.map(d => format(d, 'dd')),
      'P', 'A' // Present, Absent
    ]
    // Abbreviated Leave/Site Headers
    leaveTypes.forEach(lt => headers.push(getLeaveTypeAbbreviation(lt.name || 'Leave')))
    workSites.forEach(ws => headers.push(ws.short_hand || getWorkSiteInitials(ws.name || 'Work Site')))

    // Prepare Data
    const tableData: (string | number | { content: string | number; styles: Record<string, unknown> })[][] = []
    groupedEmployees.forEach(({ employees: categoryEmployees }) => {
      // Category Header Row - roughly simulated by pushing a row with category name
      // autoTable doesn't support "group headers" elegantly in the body array simply, 
      // but we'll stick to listing employees. 
      // Optionally we can add a row for category if desired, but sticking to simple rows is safer for column alignment.

      categoryEmployees.forEach(employee => {
        const stats = employeeStatistics[employee.id]
        const row: (string | number | { content: string | number; styles: Record<string, unknown> })[] = [
          employee.employee_id || '-',
          employee.name,
        ]

        // Daily Status
        workingMonth.dates.forEach(date => {
          const dateStr = format(date, 'yyyy-MM-dd')
          const record = attendanceMap[employee.id]?.[dateStr]
          const dayStatus = getDayStatus(date)
          const statusLabel = getStatusLabel(
            record?.status,
            dayStatus,
            record?.work_site_id,
            record?.leave_type_id,
            leaveTypes,
            workSites
          )

          // Determine Color Logic
          let colorClass = 'bg-gray-50'
          if (record?.work_site_id) {
            const index = workSites.findIndex(ws => ws.id === record.work_site_id)
            if (index >= 0) {
              const colors = ['bg-purple-100', 'bg-violet-100', 'bg-fuchsia-100', 'bg-indigo-100', 'bg-blue-100', 'bg-sky-100', 'bg-cyan-100', 'bg-teal-100']
              colorClass = colors[index % colors.length]
            } else { colorClass = 'bg-purple-100' }
          } else if (record?.leave_type_id) {
            const index = leaveTypes.findIndex(lt => lt.id === record.leave_type_id)
            if (index >= 0) {
              const colors = ['bg-yellow-100', 'bg-orange-100', 'bg-pink-100', 'bg-indigo-100', 'bg-teal-100', 'bg-cyan-100', 'bg-lime-100', 'bg-fuchsia-100']
              colorClass = colors[index % colors.length]
            } else { colorClass = 'bg-yellow-100' }
          } else if (record?.status === 'present') { colorClass = 'bg-green-100' }
          else if (record?.status === 'absent') { colorClass = 'bg-red-100' }
          else if (dayStatus?.type === 'holiday') { colorClass = 'bg-blue-100' }
          else if (dayStatus?.type === 'weekoff') { colorClass = 'bg-gray-100' }

          const fillColor = getColorRGB(colorClass)

          row.push({ content: statusLabel, styles: { fillColor, halign: 'center' } })
        })

        // Summary Stats
        row.push(stats?.present || 0)
        row.push(stats?.absent || 0)
        leaveTypes.forEach(lt => row.push(stats?.leaves[lt.id] || 0))
        workSites.forEach(ws => row.push(stats?.workSites[ws.id] || 0))

        tableData.push(row)
      })
    })

    // Generate Table
    // Generate Table
    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: 28,
      styles: { fontSize: 6, cellPadding: 1, overflow: 'linebreak' },
      headStyles: { fillColor: [35, 136, 124], fontSize: 6, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 15 }, // ID (Increased)
        1: { cellWidth: 20 }, // Name (Decreased)
        // Dynamic dates will take remaining space
      },
    })

    // Add Legend
    const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 40

    // Prepare Legend Data
    const legendHeaders = ['Code', 'Description']
    const legendData: (string | number)[][] = []

    // Statuses
    legendData.push(['P', 'Present'])
    legendData.push(['A', 'Absent'])
    legendData.push(['H', 'Holiday'])
    legendData.push(['W', 'Week Off'])

    // Leaves
    leaveTypes.forEach(lt => {
      legendData.push([getLeaveTypeAbbreviation(lt.name || 'Leave'), lt.name || 'Leave'])
    })

    // Worksites
    workSites.forEach(ws => {
      legendData.push([ws.short_hand || getWorkSiteInitials(ws.name || 'Work Site'), ws.name || 'Work Site'])
    })

    doc.setFontSize(12)
    doc.text("Legend", 14, finalY + 10)

    autoTable(doc, {
      head: [legendHeaders],
      body: legendData,
      startY: finalY + 15,
      styles: { fontSize: 8, cellPadding: 1 },
      headStyles: { fillColor: [50, 50, 50] },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 60 },
      },
      didParseCell: (data) => {
        if (data.section === 'body' && data.column.index === 0) {
          const code = (data.row.raw as (string | number)[])[0]
          let rgb: [number, number, number] | null = null

          if (code === 'P') rgb = getColorRGB('bg-green-100')
          else if (code === 'A') rgb = getColorRGB('bg-red-100')
          else if (code === 'H') rgb = getColorRGB('bg-blue-100')
          else if (code === 'W') rgb = getColorRGB('bg-gray-100')
          else {
            // Check Leaves
            const leave = leaveTypes.find(lt => getLeaveTypeAbbreviation(lt.name || '') === code)
            if (leave) {
              rgb = getCodeColor('Leave', leave.id)
            } else {
              // Check Sites
              const site = workSites.find(ws => (ws.short_hand || getWorkSiteInitials(ws.name || '')) === code)
              if (site) {
                rgb = getCodeColor('Work Site', site.id)
              }
            }
          }

          if (rgb) {
            data.cell.styles.fillColor = rgb
          }
        }
      }
    })

    doc.save(`Attendance_${format(workingMonth.start, 'dd-MMM-yyyy')}_to_${format(workingMonth.end, 'dd-MMM-yyyy')}.pdf`)
  }

  if (employeesLoading || loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="max-w-[1360px] mx-auto flex flex-col gap-6 h-full overflow-auto">

      {/* Controls and Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Navigation Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePreviousMonth}
              className="h-10 w-10 rounded-lg hover:bg-[#23887C] hover:text-white transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Select
              value={selectedCombinationValue}
              onValueChange={(value) => {
                const [month, year] = value.split('-').map(Number)
                setSelectedStartMonth(month)
                setSelectedStartYear(year)
              }}
            >
              <SelectTrigger className="w-40 h-10 rounded-lg border-gray-300 focus:ring-[#23887C]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {filteredCombinations.map((combo) => (
                  <SelectItem
                    key={`${combo.startMonth}-${combo.startYear}`}
                    value={`${combo.startMonth}-${combo.startYear}`}
                  >
                    {combo.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedStartYear.toString()}
              onValueChange={(value) => {
                const newYear = parseInt(value)
                setSelectedStartYear(newYear)
                const availableCombinations = monthCombinations.filter(combo => combo.startYear === newYear)
                if (availableCombinations.length > 0) {
                  setSelectedStartMonth(availableCombinations[0].startMonth)
                }
              }}
            >
              <SelectTrigger className="w-24 h-10 rounded-lg border-gray-300 focus:ring-[#23887C]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={handleNextMonth}
              className="h-10 w-10 rounded-lg hover:bg-[#23887C] hover:text-white transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
              <Calendar className="h-4 w-4" />
              <span className="font-medium">
                {format(workingMonth.start, 'dd MMM yyyy')} - {format(workingMonth.end, 'dd MMM yyyy')}
              </span>
            </div>
          </div>

          {/* Search and Export */}
          <div className="flex items-center gap-3 flex-wrap w-full lg:w-auto">
            <div className="relative flex-1 lg:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search employees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 w-full lg:w-64 rounded-lg border-gray-300 focus:ring-[#23887C]"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 h-10 rounded-lg hover:bg-green-50 hover:text-green-700 hover:border-green-300 transition-colors"
                onClick={exportToExcel}
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span className="hidden sm:inline">Excel</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 h-10 rounded-lg hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-colors"
                onClick={exportToPDF}
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">PDF</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="w-full border border-gray-200 rounded-xl shadow-sm overflow-auto bg-white">
        <div className="min-w-fit">
          <div
            className="grid gap-0"
            style={{
              gridTemplateColumns: `minmax(12rem, 1fr) repeat(${workingMonth.dates.length}, minmax(2.5rem, 3rem)) minmax(5rem, 6rem) minmax(5rem, 6rem) repeat(${leaveTypes.length}, minmax(6rem, 8rem)) repeat(${workSites.length}, minmax(3.5rem, 4.5rem))`
            }}
          >
            {/* Header Row */}
            <div className="sticky left-0 z-20 bg-gradient-to-r from-[#23887C] to-[#23887C] px-4 py-3 text-white font-semibold border-b border-[#1e6f66] flex items-center">
              Employee
            </div>
            {workingMonth.dates.map((date) => {
              const dayStatus = getDayStatus(date)
              return (
                <div
                  key={date.toISOString()}
                  className={cn(
                    "text-white font-semibold text-center px-2 py-3 border-b border-[#1e6f66] flex flex-col items-center justify-center",
                    dayStatus?.type === 'holiday' && 'bg-blue-600',
                    dayStatus?.type === 'weekoff' && 'bg-gray-600',
                    !dayStatus && 'bg-gradient-to-r from-[#23887C] to-[#1e6f66]'
                  )}
                >
                  <span className="text-sm font-bold">{getDate(date)}</span>
                  <span className="text-[11px] font-normal opacity-90">
                    {getDayName(date)}
                  </span>
                </div>
              )
            })}

            {/* Summary Column Headers */}
            <div className="bg-gradient-to-r from-[#23887C] to-[#1e6f66] px-4 py-3 text-white font-semibold border-b border-l-2 border-[#1e6f66] text-center flex items-center justify-center">
              <span className="text-sm">Present</span>
            </div>
            <div className="bg-gradient-to-r from-[#23887C] to-[#1e6f66] px-4 py-3 text-white font-semibold border-b border-[#1e6f66] text-center flex items-center justify-center">
              <span className="text-sm">Absent</span>
            </div>
            {/* Dynamic Leave Headers */}
            {leaveTypes.map((leaveType) => {
              return (
                <div
                  key={leaveType.id}
                  className="bg-gradient-to-r from-[#23887C] to-[#1e6f66] px-2 py-3 text-white font-semibold border-b border-[#1e6f66] text-center flex items-center justify-center"
                  title={leaveType.name}
                >
                  <span className="text-xs">{leaveType.name}</span>
                </div>
              )
            })}
            {/* Dynamic Work Site Headers */}
            {workSites.map((site) => {
              const abbr = site.short_hand || getWorkSiteInitials(site.name || 'Work Site')
              return (
                <div
                  key={site.id}
                  className="bg-gradient-to-r from-[#23887C] to-[#1e6f66] px-2 py-3 text-white font-semibold border-b border-[#1e6f66] text-center flex items-center justify-center"
                  title={site.name}
                >
                  <span className="text-xs">{abbr}</span>
                </div>
              )
            })}


            {/* Data Rows */}
            {groupedEmployees.length === 0 ? (
              <div
                className="col-span-full text-center py-12"
                style={{ gridColumn: `1 / -1` }}
              >
                <div className="flex flex-col items-center gap-3 text-gray-500">
                  <Users className="h-12 w-12 opacity-20" />
                  <p className="font-medium">No employees found</p>
                  {searchQuery && (
                    <p className="text-sm">Try adjusting your search criteria</p>
                  )}
                </div>
              </div>
            ) : (
              groupedEmployees.map(({ category, employees: categoryEmployees }) => (
                <React.Fragment key={category}>
                  {/* Category Header */}
                  <div
                    className="col-span-full px-4 py-2 font-bold text-[#23887C] text-sm bg-gradient-to-r from-[#23887C]/10 to-[#23887C]/5 border-t-2 border-[#23887C] sticky left-0 z-10"
                    style={{ gridColumn: `1 / -1` }}
                  >
                    {category} ({categoryEmployees.length})
                  </div>

                  {/* Employee Rows */}
                  {categoryEmployees.map((employee, index) => {
                    // Check if employee should be highlighted (non-active during this month)
                    const isNonActive = employee.status !== 'active'
                    const exitDate = employee.exit_date ? new Date(employee.exit_date) : null
                    const becameInactiveThisMonth = exitDate && exitDate >= workingMonth.start && exitDate <= workingMonth.end
                    const shouldHighlight = isNonActive && becameInactiveThisMonth
                    
                    return (
                    <React.Fragment key={employee.id}>
                      <div
                        className={cn(
                          "sticky left-0 z-10 px-4 py-3 font-medium border-b border-gray-200 transition-all duration-200",
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50',
                          hoveredRow === employee.id && 'bg-blue-50',
                          shouldHighlight && 'bg-yellow-100 border-yellow-300 border-l-4'
                        )}
                        onMouseEnter={() => setHoveredRow(employee.id)}
                        onMouseLeave={() => setHoveredRow(null)}
                      >
                        <div className="flex flex-col gap-1">
                          <span className={cn(
                            "text-sm font-bold",
                            shouldHighlight ? 'text-yellow-800' : 'text-[#23887C]'
                          )}>
                            {employee.employee_id || '-'}
                          </span>
                          <span className={cn(
                            "text-xs truncate",
                            shouldHighlight ? 'text-yellow-700 font-semibold' : 'text-gray-600'
                          )}>
                            {employee.name}
                            {shouldHighlight && ` (${employee.status})`}
                          </span>
                        </div>
                      </div>
                      {workingMonth.dates.map((date) => {
                        const dateStr = format(date, 'yyyy-MM-dd')
                        const record = attendanceMap[employee.id]?.[dateStr]
                        const dayStatus = getDayStatus(date)
                        const statusLabel = getStatusLabel(
                          record?.status,
                          dayStatus,
                          record?.work_site_id,
                          record?.leave_type_id,
                          leaveTypes,
                          workSites
                        )
                        const statusColor = getStatusColor(
                          record?.status,
                          dayStatus,
                          record?.work_site_id,
                          record?.leave_type_id,
                          leaveTypes,
                          workSites
                        )

                        return (
                          <div
                            key={dateStr}
                            className={cn(
                              "text-center text-xs font-semibold py-2 px-1 border-b border-gray-200 transition-all duration-200 flex items-center justify-center",
                              index % 2 === 0 ? 'bg-white' : 'bg-gray-50',
                              hoveredRow === employee.id && 'bg-blue-50',
                              shouldHighlight && 'bg-yellow-50'
                            )}
                            onMouseEnter={() => setHoveredRow(employee.id)}
                            onMouseLeave={() => setHoveredRow(null)}
                          >
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shadow-sm",
                              statusColor
                            )}>
                              {statusLabel}
                            </div>
                          </div>
                        )
                      })}

                      {/* Summary Cells */}
                      <div
                        className={cn(
                          "px-4 py-3 text-center font-bold text-lg border-b border-l-2 border-gray-200 transition-all duration-200",
                          "text-green-700 bg-green-50",
                          hoveredRow === employee.id && 'bg-green-100',
                          shouldHighlight && 'bg-yellow-50 border-yellow-200'
                        )}
                        onMouseEnter={() => setHoveredRow(employee.id)}
                        onMouseLeave={() => setHoveredRow(null)}
                      >
                        {employeeStatistics[employee.id]?.present || 0}
                      </div>
                      <div
                        className={cn(
                          "px-4 py-3 text-center font-bold text-lg border-b border-gray-200 transition-all duration-200",
                          "text-red-700 bg-red-50",
                          hoveredRow === employee.id && 'bg-red-100',
                          shouldHighlight && 'bg-yellow-50 border-yellow-200'
                        )}
                        onMouseEnter={() => setHoveredRow(employee.id)}
                        onMouseLeave={() => setHoveredRow(null)}
                      >
                        {employeeStatistics[employee.id]?.absent || 0}
                      </div>

                      {/* Dynamic Leave Cells */}
                      {leaveTypes.map((leaveType) => {
                        const count = employeeStatistics[employee.id]?.leaves[leaveType.id] || 0
                        return (
                          <div
                            key={leaveType.id}
                            className={cn(
                              "px-2 py-3 text-center text-lg font-bold border-b border-gray-200 transition-all duration-200 bg-yellow-50 flex items-center justify-center",
                              hoveredRow === employee.id && 'bg-yellow-100',
                              shouldHighlight && 'bg-yellow-100 border-yellow-200',
                              count > 0 ? "text-yellow-900" : "text-gray-300"
                            )}
                            onMouseEnter={() => setHoveredRow(employee.id)}
                            onMouseLeave={() => setHoveredRow(null)}
                            title={`${leaveType.name}: ${count}`}
                          >
                            {count > 0 ? count : '-'}
                          </div>
                        )
                      })}

                      {/* Dynamic Project Cells */}
                      {workSites.map((site) => {
                        const count = employeeStatistics[employee.id]?.workSites[site.id] || 0
                        return (
                          <div
                            key={site.id}
                            className={cn(
                              "px-2 py-3 text-center text-lg font-bold border-b border-gray-200 transition-all duration-200 bg-purple-50 flex items-center justify-center",
                              hoveredRow === employee.id && 'bg-purple-100',
                              shouldHighlight && 'bg-yellow-50 border-yellow-200',
                              count > 0 ? "text-purple-900" : "text-gray-300"
                            )}
                            onMouseEnter={() => setHoveredRow(employee.id)}
                            onMouseLeave={() => setHoveredRow(null)}
                            title={`${site.name}: ${count}`}
                          >
                            {count > 0 ? count : '-'}
                          </div>
                        )
                      })}
                    </React.Fragment>
                  )
                  })}
                </React.Fragment>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Legend</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-100 text-green-800 flex items-center justify-center text-xs font-bold shadow-sm">P</div>
            <span className="text-sm text-gray-700">Present</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-800 flex items-center justify-center text-xs font-bold shadow-sm">A</div>
            <span className="text-sm text-gray-700">Absent</span>
          </div>
          {leaveTypes.map((leaveType) => {
            const color = getStatusColor('leave', null, null, leaveType.id, leaveTypes)
            const abbr = getLeaveTypeAbbreviation(leaveType.name || 'Leave')

            return (
              <div key={leaveType.id} className="flex items-center gap-2">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shadow-sm", color)}>
                  {abbr}
                </div>
                <span className="text-sm text-gray-700">{leaveType.name}</span>
              </div>
            )
          })}
          {workSites.map((site) => {
            const color = getStatusColor(undefined, null, site.id, null, [], workSites)
            const abbr = site.short_hand || getWorkSiteInitials(site.name || 'Work Site')

            return (
              <div key={site.id} className="flex items-center gap-2">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shadow-sm", color)}>
                  {abbr}
                </div>
                <span className="text-sm text-gray-700">{site.name}</span>
              </div>
            )
          })}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold shadow-sm">W</div>
            <span className="text-sm text-gray-700">Weekly Off</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-bold shadow-sm">H</div>
            <span className="text-sm text-gray-700">Holiday</span>
          </div>
        </div>
      </div>
    </div>
  )
}
