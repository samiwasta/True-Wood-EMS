import { supabase } from '@/lib/supabase'

export interface EmployeeLeaveBalance {
  leave_type_id: string
  leave_type_name: string
  max_days: number | null
  taken_days: number
  remaining_days: number | null
  is_paid: boolean | null
}

export class LeaveService {
  static async getUpcomingLeaves(limit: number = 5) {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await supabase
        .from('attendance_records')
        .select(`
          id,
          date,
          employee_id,
          leave_type_id,
          employees!attendance_records_employee_id_fkey(id, name, employee_id),
          leave_types!attendance_records_leave_type_id_fkey(id, name)
        `)
        .eq('status', 'leave')
        .gte('date', today)
        .order('date', { ascending: true })
        .limit(limit)

      if (error) {
        console.error('Error fetching upcoming leaves:', error)
        throw error
      }

      if (!data) {
        return []
      }

      return data.map((record: {
        id: string
        date: string
        employee_id: string
        leave_type_id: string | null
        employees: { id: string; name: string; employee_id?: string } | { id: string; name: string; employee_id?: string }[] | null
        leave_types: { id: string; name: string } | { id: string; name: string }[] | null
      }) => {
        const employee = Array.isArray(record.employees) ? record.employees[0] : record.employees
        const leaveType = Array.isArray(record.leave_types) ? record.leave_types[0] : record.leave_types
        
        return {
          id: record.id,
          start_date: record.date,
          end_date: record.date,
          employee_id: record.employee_id,
          leave_type_id: record.leave_type_id,
          employee_name: employee?.name || 'Unknown',
          employee: employee,
          type: leaveType?.name || 'Leave',
        }
      })
    } catch (error) {
      console.error('Error fetching upcoming leaves:', error)
      throw error
    }
  }

  static async getEmployeeLeaveBalance(employeeId: string): Promise<EmployeeLeaveBalance[]> {
    try {
      const currentYear = new Date().getFullYear()
      const yearStart = `${currentYear}-01-01`
      const yearEnd = `${currentYear}-12-31`

      const { data: leaveTypes, error: leaveTypesError } = await supabase
        .from('leave_types')
        .select('id, name, max_days, is_paid')
        .order('name', { ascending: true })

      if (leaveTypesError) {
        console.error('Error fetching leave types:', leaveTypesError)
        throw leaveTypesError
      }

      if (!leaveTypes || leaveTypes.length === 0) {
        return []
      }

      const { data: attendanceRecords, error: attendanceError } = await supabase
        .from('attendance_records')
        .select('date, leave_type_id')
        .eq('employee_id', employeeId)
        .eq('status', 'leave')
        .gte('date', yearStart)
        .lte('date', yearEnd)

      if (attendanceError) {
        console.error('Error fetching employee leave attendance records:', attendanceError)
        throw attendanceError
      }

      const leaveBalanceMap = new Map<string, { taken_days: number }>()

      if (attendanceRecords && attendanceRecords.length > 0) {
        attendanceRecords.forEach((record) => {
          const leaveTypeId = record.leave_type_id || 'unknown'
          if (!leaveBalanceMap.has(leaveTypeId)) {
            leaveBalanceMap.set(leaveTypeId, { taken_days: 0 })
          }
          const balance = leaveBalanceMap.get(leaveTypeId)!
          balance.taken_days += 1
        })
      }

      const leaveBalance: EmployeeLeaveBalance[] = leaveTypes.map((leaveType) => {
        const balance = leaveBalanceMap.get(leaveType.id) || { taken_days: 0 }
        const takenDays = balance.taken_days
        const maxDays = leaveType.max_days ?? null
        const remainingDays = maxDays !== null ? Math.max(0, maxDays - takenDays) : null

        return {
          leave_type_id: leaveType.id,
          leave_type_name: leaveType.name || 'Unknown',
          max_days: maxDays,
          taken_days: takenDays,
          remaining_days: remainingDays,
          is_paid: leaveType.is_paid ?? null,
        }
      })

      return leaveBalance
    } catch (error) {
      console.error('Error fetching employee leave balance:', error)
      throw error
    }
  }
}

