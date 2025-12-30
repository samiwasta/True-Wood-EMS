import { supabase } from '@/lib/supabase'

export class AttendanceService {
  static async getTodayPresentCount(): Promise<number> {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { count, error } = await supabase
        .from('attendance_records')
        .select('*', { count: 'exact', head: true })
        .eq('date', today)
        .eq('status', 'present')

      if (error) {
        console.error('Error fetching today present count:', error)
        throw error
      }

      return count ?? 0
    } catch (error) {
      console.error('Error fetching today present count:', error)
      throw error
    }
  }

  static async getTodayAbsentLeaveCount(): Promise<number> {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { count, error } = await supabase
        .from('attendance_records')
        .select('*', { count: 'exact', head: true })
        .eq('date', today)
        .in('status', ['absent', 'leave'])

      if (error) {
        console.error('Error fetching today absent/leave count:', error)
        throw error
      }

      return count ?? 0
    } catch (error) {
      console.error('Error fetching today absent/leave count:', error)
      throw error
    }
  }

  static async getWeeklyAttendance() {
    try {
      const today = new Date()
      const weekStart = new Date(today)
      weekStart.setDate(today.getDate() - 6)
      
      const { data, error } = await supabase
        .from('attendance_records')
        .select('date, status')
        .gte('date', weekStart.toISOString().split('T')[0])
        .lte('date', today.toISOString().split('T')[0])

      if (error) {
        console.error('Error fetching weekly attendance:', error)
        throw error
      }

      return data ?? []
    } catch (error) {
      console.error('Error fetching weekly attendance:', error)
      throw error
    }
  }

  static async getAttendanceByDate(date: string) {
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select(`
          id,
          employee_id,
          date,
          status,
          leave_type_id,
          work_site_id,
          employee:employees(id, employee_id, name)
        `)
        .eq('date', date)
        .order('employee_id', { ascending: true })

      if (error) {
        console.error('Error fetching attendance by date:', error)
        throw error
      }

      return data ?? []
    } catch (error) {
      console.error('Error fetching attendance by date:', error)
      throw error
    }
  }

  static async saveAttendance(
    employeeId: string,
    date: string,
    status: 'present' | 'absent' | 'leave',
    leaveTypeId?: string | null,
    workSiteId?: string | null
  ) {
    try {
      const { data: existing, error: checkError } = await supabase
        .from('attendance_records')
        .select('id')
        .eq('employee_id', employeeId)
        .eq('date', date)
        .single()

      const payload: Record<string, unknown> = {
        employee_id: employeeId,
        date: date,
        status: status,
        leave_type_id: status === 'leave' ? (leaveTypeId || null) : null,
        work_site_id: workSiteId || null,
      }

      if (existing && !checkError) {
        const { data, error } = await supabase
          .from('attendance_records')
          .update(payload)
          .eq('id', existing.id)
          .select()
          .single()

        if (error) {
          console.error('Error updating attendance:', error)
          throw error
        }

        return data
      } else {
        const { data, error } = await supabase
          .from('attendance_records')
          .insert(payload)
          .select()
          .single()

        if (error) {
          console.error('Error creating attendance:', error)
          throw error
        }

        return data
      }
    } catch (error) {
      console.error('Error saving attendance:', error)
      throw error
    }
  }

  static async resetAttendanceForDate(date: string) {
    try {
      const { error } = await supabase
        .from('attendance_records')
        .delete()
        .eq('date', date)

      if (error) {
        console.error('Error resetting attendance:', error)
        throw error
      }

      return true
    } catch (error) {
      console.error('Error resetting attendance:', error)
      throw error
    }
  }

  static async getAttendanceByDateRange(startDate: string, endDate: string) {
    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select(`
          id,
          employee_id,
          date,
          status,
          leave_type_id,
          work_site_id,
          employees!attendance_records_employee_id_fkey(id, employee_id, name, category:categories(id, name), department:departments(id, name))
        `)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })
        .order('employee_id', { ascending: true })

      if (error) {
        console.error('Error fetching attendance by date range:', error)
        throw error
      }

      return data ?? []
    } catch (error) {
      console.error('Error fetching attendance by date range:', error)
      throw error
    }
  }
}
