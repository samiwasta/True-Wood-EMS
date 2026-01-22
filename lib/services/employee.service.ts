import { supabase } from '@/lib/supabase'
import { normalizePhoneNumber } from '@/lib/utils'
import { EmploymentHistoryService } from './employment-history.service'

export class EmployeeService {
  static async getEmployeeCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })

      if (error) {
        console.error('Error fetching employee count:', error)
        throw error
      }

      return count ?? 0
    } catch (error) {
      console.error('Error fetching employee count:', error)
      throw error
    }
  }

  static async getRecentEmployees(limit: number = 5) {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching recent employees:', error)
        throw error
      }

      return data ?? []
    } catch (error) {
      console.error('Error fetching recent employees:', error)
      throw error
    }
  }

  static async getAllEmployees() {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          category:categories(id, name),
          department:departments(id, name)
        `)
        .order('employee_id', { ascending: true, nullsFirst: false })

      if (error) {
        console.error('Error fetching employees:', error)
        throw error
      }

      return data ?? []
    } catch (error) {
      console.error('Error fetching employees:', error)
      throw error
    }
  }

  static async updateEmployee(id: string, updates: Record<string, unknown>) {
    try {
      if (!id) {
        throw new Error('Employee ID is required')
      }

      // Get current employee data to compare status changes
      const { data: currentEmployee } = await supabase
        .from('employees')
        .select('status, joining_date, exit_date')
        .eq('id', id)
        .single()

      const { data, error } = await supabase
        .from('employees')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select(`
          *,
          category:categories(id, name),
          department:departments(id, name)
        `)
        .single()

      if (error) {
        const errorInfo = {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        }
        console.error('Error updating employee:', errorInfo)
        console.error('Full error object:', error)
        console.error('Employee ID:', id)
        console.error('Updates sent:', updates)
        
        const errorMessage = error.message || error.details || 'Failed to update employee'
        throw new Error(errorMessage)
      }

      // Handle employment history updates
      if (data && currentEmployee) {
        try {
          const newStatus = updates.status as string
          const oldStatus = currentEmployee.status
          const newJoiningDate = updates.joining_date as string
          const newExitDate = updates.exit_date as string | null | undefined

          // If status changed from active to terminated/released/transferred, update history with exit date
          if (oldStatus === 'active' && newStatus && ['terminated', 'released', 'transferred'].includes(newStatus)) {
            // Get the latest active history entry
            const { data: historyEntries } = await supabase
              .from('employment_history')
              .select('*')
              .eq('employee_id', id)
              .eq('status', 'active')
              .order('created_at', { ascending: false })
              .limit(1)

            if (historyEntries && historyEntries.length > 0) {
              await EmploymentHistoryService.updateEmploymentHistory(historyEntries[0].id, {
                exit_date: newExitDate || new Date().toISOString().split('T')[0],
                status: newStatus,
              })
            }
          }

          // If status changed from terminated/released/transferred back to active (rejoin), create new history entry
          if (oldStatus && ['terminated', 'released', 'transferred'].includes(oldStatus) && newStatus === 'active') {
            const joiningDate = newJoiningDate || new Date().toISOString().split('T')[0]
            await EmploymentHistoryService.createEmploymentHistory(
              id,
              joiningDate,
              null,
              'active'
            )
          }

          // If employee is being updated with joining date and no history exists, create one
          if (newJoiningDate) {
            const { data: existingHistory } = await supabase
              .from('employment_history')
              .select('id')
              .eq('employee_id', id)
              .limit(1)

            if (!existingHistory || existingHistory.length === 0) {
              await EmploymentHistoryService.createEmploymentHistory(
                id,
                newJoiningDate,
                newExitDate || null,
                newStatus || 'active'
              )
            }
          }
          
          // Also create history if employee has joining_date but no history exists (for existing employees)
          if (!newJoiningDate && data.joining_date) {
            const { data: existingHistory } = await supabase
              .from('employment_history')
              .select('id')
              .eq('employee_id', id)
              .limit(1)

            if (!existingHistory || existingHistory.length === 0) {
              await EmploymentHistoryService.createEmploymentHistory(
                id,
                data.joining_date,
                data.exit_date || null,
                data.status || 'active'
              )
            }
          }
        } catch (historyError) {
          console.error('Error updating employment history:', historyError)
          // Don't throw - history update failure shouldn't fail employee update
        }
      }

      return data
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      const errorMessage = typeof error === 'string' ? error : 'Unknown error occurred'
      console.error('Error updating employee:', errorMessage, error)
      throw new Error(errorMessage)
    }
  }

  static async deleteEmployee(id: string) {
    try {
      if (!id) {
        throw new Error('Employee ID is required')
      }

      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id)

      if (error) {
        const errorInfo = {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        }
        console.error('Error deleting employee:', errorInfo)
        console.error('Full error object:', error)
        console.error('Employee ID:', id)
        
        const errorMessage = error.message || error.details || 'Failed to delete employee'
        throw new Error(errorMessage)
      }

      return true
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      const errorMessage = typeof error === 'string' ? error : 'Unknown error occurred'
      console.error('Error deleting employee:', errorMessage, error)
      throw new Error(errorMessage)
    }
  }

  static async getEmployeeById(id: string) {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          *,
          category:categories(id, name),
          department:departments(id, name)
        `)
        .eq('id', id)
        .single()

      if (error) {
        console.error('Error fetching employee:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Error fetching employee:', error)
      throw error
    }
  }

  static async checkEmployeeIdExists(employeeId: string, excludeEmployeeId?: string): Promise<boolean> {
    try {
      if (!employeeId || !employeeId.trim()) {
        return false
      }

      let query = supabase
        .from('employees')
        .select('id', { count: 'exact', head: true })
        .eq('employee_id', employeeId.trim())

      if (excludeEmployeeId) {
        query = query.neq('id', excludeEmployeeId)
      }

      const { count, error } = await query

      if (error) {
        console.error('Error checking employee ID:', error)
        return false
      }

      return (count ?? 0) > 0
    } catch (error) {
      console.error('Error checking employee ID:', error)
      return false
    }
  }

  static async createEmployee(employeeData: {
    employee_id?: string
    name: string
    phone?: string
    category_id?: string
    department_id?: string
    work_site_id?: string
    joining_date?: string
    exit_date?: string
    salary?: number | string
    status?: string
  }) {
    try {
      const trimmedName = employeeData.name.trim()
      if (!trimmedName) {
        throw new Error('Employee name is required')
      }

      const payload: Record<string, unknown> = {
        name: trimmedName,
        status: employeeData.status || 'active',
      }

      if (employeeData.employee_id?.trim()) {
        payload.employee_id = employeeData.employee_id.trim()
      }
      if (employeeData.phone?.trim()) {
        const normalized = normalizePhoneNumber(employeeData.phone)
        payload.phone = normalized || null
      }
      if (employeeData.category_id) {
        payload.category_id = employeeData.category_id
      }
      if (employeeData.department_id) {
        payload.department_id = employeeData.department_id
      }
      if (employeeData.work_site_id) {
        payload.work_site_id = employeeData.work_site_id
      }
      if (employeeData.joining_date) {
        payload.joining_date = employeeData.joining_date
      }
      if (employeeData.exit_date) {
        payload.exit_date = employeeData.exit_date
      }
      if (employeeData.salary) {
        const numSalary = typeof employeeData.salary === 'string' ? parseFloat(employeeData.salary) : employeeData.salary
        if (!isNaN(numSalary)) {
          payload.salary = numSalary
        }
      }

      const { data, error } = await supabase
        .from('employees')
        .insert(payload)
        .select(`
          *,
          category:categories(id, name),
          department:departments(id, name)
        `)
        .single()

      if (error) {
        const errorInfo = {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        }
        console.error('Error creating employee:', errorInfo)
        console.error('Full error object:', error)
        console.error('Payload sent:', payload)
        
        const errorMessage = error.message || error.details || 'Failed to create employee'
        throw new Error(errorMessage)
      }

      // Create initial employment history entry
      if (data && data.id) {
        try {
          const joiningDate = employeeData.joining_date || new Date().toISOString().split('T')[0]
          const exitDate = employeeData.exit_date || null
          const status = employeeData.status || 'active'
          
          await EmploymentHistoryService.createEmploymentHistory(
            data.id,
            joiningDate,
            exitDate,
            status
          )
        } catch (historyError) {
          console.error('Error creating employment history:', historyError)
          // Don't throw - history creation failure shouldn't fail employee creation
        }
      }

      return data
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      const errorMessage = typeof error === 'string' ? error : 'Unknown error occurred'
      console.error('Error creating employee:', errorMessage, error)
      throw new Error(errorMessage)
    }
  }
}
