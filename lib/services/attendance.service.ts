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
          time_in,
          time_out,
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
    workSiteId?: string | null,
    timeIn?: string | null,
    timeOut?: string | null
  ) {
    try {
      const { data: existingRecords, error: checkError } = await supabase
        .from('attendance_records')
        .select('id')
        .eq('employee_id', employeeId)
        .eq('date', date)
        .limit(1)

      const existing = existingRecords && existingRecords.length > 0 ? existingRecords[0] : null

      const payload: Record<string, unknown> = {
        employee_id: employeeId,
        date: date,
        status: status,
        leave_type_id: status === 'leave' ? (leaveTypeId || null) : null,
        work_site_id: workSiteId || null,
      }
      if (timeIn !== undefined) payload.time_in = timeIn || null
      if (timeOut !== undefined) payload.time_out = timeOut || null

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

  static async deleteAttendanceRecord(employeeId: string, date: string) {
    try {
      const { error } = await supabase
        .from('attendance_records')
        .delete()
        .eq('employee_id', employeeId)
        .eq('date', date)

      if (error) {
        console.error('Error deleting attendance record:', error)
        throw error
      }

      return true
    } catch (error) {
      console.error('Error deleting attendance record:', error)
      throw error
    }
  }

  /** Fetch attendance for a single date with employee info for timesheet. */
  static async getTimesheetByDate(date: string) {
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
          time_in,
          time_out
        `)
        .eq('date', date)
        .order('employee_id', { ascending: true })

      if (error) {
        console.error('Error fetching timesheet by date:', error)
        throw error
      }

      return data ?? []
    } catch (error) {
      console.error('Error fetching timesheet by date:', error)
      throw error
    }
  }

  /** Fetch attendance records for a date range (flat, for monthly timesheet). */
  static async getTimesheetByDateRange(startDate: string, endDate: string) {
    try {
      const allRecords: Array<{
        id: string
        employee_id: string
        date: string
        status: 'present' | 'absent' | 'leave'
        leave_type_id?: string | null
        work_site_id?: string | null
        time_in?: string | null
        time_out?: string | null
      }> = []
      let offset = 0
      const pageSize = 1000
      let hasMore = true

      while (hasMore) {
        const { data, error } = await supabase
          .from('attendance_records')
          .select('id, employee_id, date, status, leave_type_id, work_site_id, time_in, time_out')
          .gte('date', startDate)
          .lte('date', endDate)
          .order('date', { ascending: true })
          .order('employee_id', { ascending: true })
          .range(offset, offset + pageSize - 1)

        if (error) {
          console.error('Error fetching timesheet by date range:', error)
          throw error
        }

        if (data && data.length > 0) {
          allRecords.push(...(data as typeof allRecords))
          offset += pageSize
          hasMore = data.length === pageSize
        } else {
          hasMore = false
        }
      }

      return allRecords
    } catch (error) {
      console.error('Error fetching timesheet by date range:', error)
      throw error
    }
  }

  /** Update time_in, time_out, and optionally work_site_id for an attendance record (admin timesheet edit). */
  static async updateTimesheetRecord(
    recordId: string,
    updates: {
      time_in?: string | null
      time_out?: string | null
      work_site_id?: string | null
    }
  ) {
    try {
      const payload: Record<string, unknown> = {}
      if (updates.time_in !== undefined) payload.time_in = updates.time_in
      if (updates.time_out !== undefined) payload.time_out = updates.time_out
      if (updates.work_site_id !== undefined) payload.work_site_id = updates.work_site_id
      if (Object.keys(payload).length === 0) return null

      const { data, error } = await supabase
        .from('attendance_records')
        .update(payload)
        .eq('id', recordId)
        .select()
        .single()

      if (error) {
        console.error('Error updating timesheet record:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Error updating timesheet record:', error)
      throw error
    }
  }

  static async getAttendanceByDateRange(startDate: string, endDate: string) {
    try {
      // Fetch all records using pagination to bypass Supabase's default 1000 row limit
      // A month of attendance for ~50 employees = ~1500 records max
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const allRecords: any[] = []
      let offset = 0
      const pageSize = 1000
      let hasMore = true

      while (hasMore) {
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
          .range(offset, offset + pageSize - 1)

        if (error) {
          console.error('Error fetching attendance by date range:', error)
          throw error
        }

        if (data && data.length > 0) {
          allRecords.push(...data)
          offset += pageSize
          hasMore = data.length === pageSize
        } else {
          hasMore = false
        }
      }

      return allRecords
    } catch (error) {
      console.error('Error fetching attendance by date range:', error)
      throw error
    }
  }
}
