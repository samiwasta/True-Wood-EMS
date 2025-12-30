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
    FileSpreadsheet,
    FileText,
    Search,
} from 'lucide-react'
import { format, eachDayOfInterval } from 'date-fns'
import { cn } from '@/lib/utils'
import {
    isHoliday,
    isWeeklyOff,
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

export function YearlyView() {
    const { employees, loading: employeesLoading } = useEmployees()
    const { leaveTypes } = useLeaveTypes()
    const { workSites } = useWorkSites()
    const { holidays } = useHolidays()
    const { weeklyOff } = useWeeklyOff()

    const currentYear = new Date().getFullYear()
    const [selectedYear, setSelectedYear] = useState(currentYear)
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
    const [loading, setLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [hoveredRow, setHoveredRow] = useState<string | null>(null)

    const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)

    const workingYearDates = useMemo(() => {
        const startDate = new Date(selectedYear - 1, 11, 26) // Dec 26 of previous year
        const endDate = new Date(selectedYear, 11, 25) // Dec 25 of current year
        return {
            start: startDate,
            end: endDate,
            dates: eachDayOfInterval({ start: startDate, end: endDate })
        }
    }, [selectedYear])

    useEffect(() => {
        const fetchAttendance = async () => {
            setLoading(true)
            try {
                const startDateStr = format(workingYearDates.start, 'yyyy-MM-dd')
                const endDateStr = format(workingYearDates.end, 'yyyy-MM-dd')
                const records = await AttendanceService.getAttendanceByDateRange(startDateStr, endDateStr) as unknown as AttendanceRecord[]
                setAttendanceRecords(records)
            } catch (error) {
                console.error('Error fetching attendance:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchAttendance()
    }, [workingYearDates.start, workingYearDates.end])

    const groupedEmployees = useMemo(() => {
        const grouped: Record<string, Employee[]> = {}
        let filteredEmployees = employees

        if (searchQuery) {
            filteredEmployees = filteredEmployees.filter(emp =>
                emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                emp.employee_id?.toLowerCase().includes(searchQuery.toLowerCase())
            )
        }

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

            if (orderA !== 999 && orderB !== 999) return orderA - orderB
            if (orderA !== 999) return -1
            if (orderB !== 999) return 1
            return a.localeCompare(b)
        })

        return sortedCategories.map(category => ({
            category,
            employees: grouped[category],
        }))
    }, [employees, searchQuery])

    const attendanceMap = useMemo(() => {
        const map: Record<string, Record<string, AttendanceRecord>> = {}
        attendanceRecords.forEach((record) => {
            if (record.employee_id && record.date) {
                if (!map[record.employee_id]) map[record.employee_id] = {}
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

    const employeeStatistics = useMemo(() => {
        const stats: Record<string, {
            present: number
            absent: number
            leaves: Record<string, number>
            workSites: Record<string, number>
        }> = {}

        employees.forEach(employee => {
            stats[employee.id] = {
                present: 0,
                absent: 0,
                leaves: {},
                workSites: {}
            }

            workingYearDates.dates.forEach(date => {
                const dateStr = format(date, 'yyyy-MM-dd')
                const record = attendanceMap[employee.id]?.[dateStr]
                const dayStatus = getDayStatus(date)

                // Count logic: prioritize records over holidays/weekoffs
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
    }, [employees, workingYearDates.dates, attendanceMap, getDayStatus])

    const exportToExcel = () => {
        const exportData: (string | number)[][] = []

        // Header
        const headers = [
            'Employee ID', 'Employee Name', 'Category',
            'Total Present', 'Total Absent'
        ]
        leaveTypes.forEach(lt => headers.push(lt.name || 'Leave'))
        workSites.forEach(ws => headers.push(ws.name || 'Site'))
        exportData.push(headers)

        // Data
        groupedEmployees.forEach(({ category, employees: categoryEmployees }) => {
            categoryEmployees.forEach(employee => {
                const stats = employeeStatistics[employee.id]
                const row = [
                    employee.employee_id || '-',
                    employee.name,
                    category,
                    stats?.present || 0,
                    stats?.absent || 0
                ]

                leaveTypes.forEach(lt => {
                    row.push(stats?.leaves[lt.id] || 0)
                })

                workSites.forEach(ws => {
                    row.push(stats?.workSites[ws.id] || 0)
                })

                exportData.push(row)
            })
        })

        const ws = XLSX.utils.aoa_to_sheet(exportData)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Yearly Report')
        XLSX.writeFile(wb, `Yearly_Attendance_${selectedYear}.xlsx`)
    }

    const exportToPDF = () => {
        const doc = new jsPDF('landscape', 'mm', 'a4')

        // Color Helpers
        const getColorRGB = (colorClass: string): [number, number, number] => {
            if (colorClass.includes('green-100')) return [220, 252, 231]
            if (colorClass.includes('red-100')) return [254, 226, 226]
            if (colorClass.includes('yellow-100')) return [254, 249, 195]
            if (colorClass.includes('purple-100')) return [243, 232, 255]
            if (colorClass.includes('blue-100')) return [219, 234, 254]
            if (colorClass.includes('gray-100')) return [243, 244, 246]
            // Additional colors for Legend matching Monthly View
            if (colorClass.includes('orange-100')) return [255, 237, 213]
            if (colorClass.includes('pink-100')) return [252, 231, 243]
            if (colorClass.includes('indigo-100')) return [224, 231, 255]
            if (colorClass.includes('teal-100')) return [204, 251, 241]
            if (colorClass.includes('cyan-100')) return [207, 250, 254]
            if (colorClass.includes('lime-100')) return [236, 252, 203]
            if (colorClass.includes('fuchsia-100')) return [250, 232, 255]
            if (colorClass.includes('violet-100')) return [237, 233, 254]
            if (colorClass.includes('sky-100')) return [224, 242, 254]

            // Fallback
            return [255, 255, 255]
        }

        const getCodeColor = (category: string, id: string | null): [number, number, number] => {
            if (category === 'Status') {
                if (id === 'P') return [220, 252, 231]
                if (id === 'A') return [254, 226, 226]
                if (id === 'H') return [219, 234, 254]
                if (id === 'W') return [243, 244, 246]
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

        doc.setFontSize(16)
        doc.text('Yearly Attendance Report', 14, 15)
        doc.setFontSize(10)
        doc.text(`Period: Dec 26, ${selectedYear - 1} - Dec 25, ${selectedYear}`, 14, 22)

        const tableHeaders = [
            'ID', 'Name', 'Category', 'Present', 'Absent'
        ]
        // Abbreviate columns for PDF width space
        leaveTypes.forEach(lt => tableHeaders.push(getLeaveTypeAbbreviation(lt.name || 'Leave')))
        workSites.forEach(ws => tableHeaders.push(ws.short_hand || getWorkSiteInitials(ws.name)))

        const tableData: (string | number | { content: string | number; styles: Record<string, unknown> })[][] = []
        groupedEmployees.forEach(({ category, employees: categoryEmployees }) => {
            categoryEmployees.forEach(employee => {
                const stats = employeeStatistics[employee.id]
                const row: (string | number | { content: string | number; styles: Record<string, unknown> })[] = [
                    employee.employee_id || '-',
                    employee.name,
                    category,
                    // Present (Green)
                    { content: stats?.present || 0, styles: { fillColor: getColorRGB('bg-green-100'), halign: 'center' } },
                    // Absent (Red)
                    { content: stats?.absent || 0, styles: { fillColor: getColorRGB('bg-red-100'), halign: 'center' } }
                ]

                // Leaves (Yellowish)
                leaveTypes.forEach(lt => {
                    // Optionally could use dynamic colors here too, but consistent Yellow as per UI is safe. 
                    // Let's match UI: bg-yellow-100
                    row.push({ content: stats?.leaves[lt.id] || 0, styles: { fillColor: getColorRGB('bg-yellow-100'), halign: 'center' } })
                })

                // Sites (Purplish)
                workSites.forEach(ws => {
                    // Match UI: bg-purple-100
                    row.push({ content: stats?.workSites[ws.id] || 0, styles: { fillColor: getColorRGB('bg-purple-100'), halign: 'center' } })
                })

                tableData.push(row)
            })
        })

        autoTable(doc, {
            head: [tableHeaders],
            body: tableData,
            startY: 28,
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [35, 136, 124] },
            columnStyles: {
                0: { cellWidth: 15 }, // ID
                1: { cellWidth: 20 }, // Name
                // Category will take auto
            },
        })

        // Add Legend
        const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 40
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

        doc.save(`Yearly_Attendance_${selectedYear}.pdf`)
    }

    if (employeesLoading || loading) {
        return (
            <div className="space-y-4 animate-pulse">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-96 w-full rounded-xl" />
            </div>
        )
    }

    return (
        <div className="max-w-[1360px] mx-auto flex flex-col gap-6 h-full overflow-auto">

            {/* Controls */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Select
                            value={selectedYear.toString()}
                            onValueChange={(value) => setSelectedYear(parseInt(value))}
                        >
                            <SelectTrigger className="w-[280px] h-10 rounded-lg border-gray-300 focus:ring-[#23887C]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {years.map((year) => (
                                    <SelectItem key={year} value={year.toString()}>
                                        Dec 26, {year - 1} - Dec 25, {year}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-3 w-full lg:w-auto">
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
                            <Button onClick={exportToExcel} variant="outline" size="sm" className="gap-2 h-10">
                                <FileSpreadsheet className="h-4 w-4" /> Excel
                            </Button>
                            <Button onClick={exportToPDF} variant="outline" size="sm" className="gap-2 h-10">
                                <FileText className="h-4 w-4" /> PDF
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Yearly Summary Table */}
            <div className="w-full border border-gray-200 rounded-xl shadow-sm overflow-auto bg-white">
                <div className="min-w-fit">
                    <div
                        className="grid gap-0"
                        style={{
                            // Employee | Present | Absent | ...Leaves | ...projects
                            gridTemplateColumns: `minmax(12rem, 1fr) minmax(5rem, 6rem) minmax(5rem, 6rem) repeat(${leaveTypes.length}, minmax(6rem, 8rem)) repeat(${workSites.length}, minmax(3.5rem, 4.5rem))`
                        }}
                    >
                        {/* Headers */}
                        <div className="sticky left-0 z-20 bg-gradient-to-r from-[#23887C] to-[#23887C] px-4 py-3 text-white font-semibold border-b border-[#1e6f66] flex items-center">
                            Employee
                        </div>
                        <div className="bg-gradient-to-r from-[#23887C] to-[#1e6f66] px-4 py-3 text-white font-semibold border-b border-l-2 border-[#1e6f66] text-center flex items-center justify-center">
                            Present
                        </div>
                        <div className="bg-gradient-to-r from-[#23887C] to-[#1e6f66] px-4 py-3 text-white font-semibold border-b border-[#1e6f66] text-center flex items-center justify-center">
                            Absent
                        </div>
                        {leaveTypes.map((leaveType) => (
                            <div
                                key={leaveType.id}
                                className="bg-gradient-to-r from-[#23887C] to-[#1e6f66] px-2 py-3 text-white font-semibold border-b border-[#1e6f66] text-center flex items-center justify-center"
                                title={leaveType.name}
                            >
                                <span className="text-xs">{leaveType.name}</span>
                            </div>
                        ))}
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
                            <div className="col-span-full py-12 text-center text-gray-500">No employees found</div>
                        ) : (
                            groupedEmployees.map(({ category, employees: categoryEmployees }) => (
                                <React.Fragment key={category}>
                                    {/* Category Header */}
                                    <div
                                        className="col-span-full px-4 py-2 font-bold text-[#23887C] text-sm bg-gray-50 border-t border-b border-gray-200 sticky left-0 z-10"
                                        style={{ gridColumn: '1 / -1' }}
                                    >
                                        {category} ({categoryEmployees.length})
                                    </div>

                                    {/* Employee Rows */}
                                    {categoryEmployees.map((employee, index) => {
                                        const stats = employeeStatistics[employee.id]
                                        const isHovered = hoveredRow === employee.id
                                        return (
                                            <React.Fragment key={employee.id}>
                                                {/* Employee Name */}
                                                <div
                                                    className={cn(
                                                        "sticky left-0 z-10 px-4 py-3 font-medium text-gray-900 border-b border-gray-200 transition-all duration-200",
                                                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50',
                                                        isHovered && 'bg-blue-50'
                                                    )}
                                                    onMouseEnter={() => setHoveredRow(employee.id)}
                                                    onMouseLeave={() => setHoveredRow(null)}
                                                >
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-sm font-bold text-[#23887C]">{employee.employee_id || '-'}</span>
                                                        <span className="text-xs text-gray-600 truncate">{employee.name}</span>
                                                    </div>
                                                </div>

                                                {/* Present */}
                                                <div
                                                    className={cn(
                                                        "px-4 py-3 text-center text-lg font-bold border-b border-l-2 border-gray-200 transition-all duration-200",
                                                        "text-green-700 bg-green-50",
                                                        isHovered && 'bg-green-100'
                                                    )}
                                                    onMouseEnter={() => setHoveredRow(employee.id)}
                                                    onMouseLeave={() => setHoveredRow(null)}
                                                >
                                                    {stats?.present || 0}
                                                </div>

                                                {/* Absent */}
                                                <div
                                                    className={cn(
                                                        "px-4 py-3 text-center text-lg font-bold border-b border-gray-200 transition-all duration-200",
                                                        "text-red-700 bg-red-50",
                                                        isHovered && 'bg-red-100'
                                                    )}
                                                    onMouseEnter={() => setHoveredRow(employee.id)}
                                                    onMouseLeave={() => setHoveredRow(null)}
                                                >
                                                    {stats?.absent || 0}
                                                </div>

                                                {/* Leave Counts */}
                                                {leaveTypes.map((lt) => {
                                                    const count = stats?.leaves[lt.id] || 0
                                                    return (
                                                        <div
                                                            key={lt.id}
                                                            className={cn(
                                                                "px-2 py-3 text-center text-lg font-bold border-b border-gray-200 transition-all duration-200 bg-yellow-50 flex items-center justify-center",
                                                                isHovered && 'bg-yellow-100',
                                                                count > 0 ? "text-yellow-900" : "text-gray-300"
                                                            )}
                                                            onMouseEnter={() => setHoveredRow(employee.id)}
                                                            onMouseLeave={() => setHoveredRow(null)}
                                                            title={`${lt.name}: ${count}`}
                                                        >
                                                            {count > 0 ? count : '-'}
                                                        </div>
                                                    )
                                                })}

                                                {/* Work Site Counts */}
                                                {workSites.map((ws) => {
                                                    const count = stats?.workSites[ws.id] || 0
                                                    return (
                                                        <div
                                                            key={ws.id}
                                                            className={cn(
                                                                "px-2 py-3 text-center text-lg font-bold border-b border-gray-200 transition-all duration-200 bg-purple-50 flex items-center justify-center",
                                                                isHovered && 'bg-purple-100',
                                                                count > 0 ? "text-purple-900" : "text-gray-300"
                                                            )}
                                                            onMouseEnter={() => setHoveredRow(employee.id)}
                                                            onMouseLeave={() => setHoveredRow(null)}
                                                            title={`${ws.name}: ${count}`}
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
        </div>
    )
}