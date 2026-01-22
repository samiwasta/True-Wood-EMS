import { supabase } from '@/lib/supabase'

export interface EmploymentHistory {
  id: string
  employee_id: string
  joining_date: string
  exit_date?: string | null
  status: string
  created_at: string
  updated_at: string
}

export class EmploymentHistoryService {
  static async getEmploymentHistory(employeeId: string): Promise<EmploymentHistory[]> {
    try {
      if (!employeeId) {
        console.error('Employee ID is required for fetching employment history')
        return []
      }

      const { data, error } = await supabase
        .from('employment_history')
        .select('*')
        .eq('employee_id', employeeId)
        .order('joining_date', { ascending: false })

      if (error) {
        console.error('Error fetching employment history:', error)
        throw error
      }

      return data ?? []
    } catch (error) {
      console.error('Error fetching employment history:', error)
      throw error
    }
  }

  static async createEmploymentHistory(employeeId: string, joiningDate: string, exitDate?: string | null, status?: string): Promise<EmploymentHistory> {
    try {
      const payload: Record<string, unknown> = {
        employee_id: employeeId,
        joining_date: joiningDate,
        status: status || 'active',
      }

      if (exitDate) {
        payload.exit_date = exitDate
      }

      const { data, error } = await supabase
        .from('employment_history')
        .insert(payload)
        .select()
        .single()

      if (error) {
        console.error('Error creating employment history:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Error creating employment history:', error)
      throw error
    }
  }

  static async updateEmploymentHistory(id: string, updates: Partial<EmploymentHistory>): Promise<EmploymentHistory> {
    try {
      const { data, error } = await supabase
        .from('employment_history')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating employment history:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Error updating employment history:', error)
      throw error
    }
  }

  static async backfillEmploymentHistory(): Promise<number> {
    try {
      // Get all employees with joining dates but no history
      const { data: employees, error: employeesError } = await supabase
        .from('employees')
        .select('id, joining_date, exit_date, status')
        .not('joining_date', 'is', null)

      if (employeesError) {
        console.error('Error fetching employees:', employeesError)
        throw employeesError
      }

      if (!employees || employees.length === 0) {
        return 0
      }

      let createdCount = 0

      for (const employee of employees) {
        // Check if history already exists
        const { data: existingHistory } = await supabase
          .from('employment_history')
          .select('id')
          .eq('employee_id', employee.id)
          .limit(1)

        if (!existingHistory || existingHistory.length === 0) {
          try {
            await this.createEmploymentHistory(
              employee.id,
              employee.joining_date,
              employee.exit_date || null,
              employee.status || 'active'
            )
            createdCount++
          } catch (error) {
            console.error(`Error creating history for employee ${employee.id}:`, error)
          }
        }
      }

      return createdCount
    } catch (error) {
      console.error('Error backfilling employment history:', error)
      throw error
    }
  }
}
