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

export interface SalaryHistory {
  id: string
  employee_id: string
  salary: number | string
  effective_date: string
  created_at: string
  updated_at: string
}

interface EmployeeForHistorySync {
  id: string
  joining_date?: string | null
  exit_date?: string | null
  status?: string | null
  created_at?: string | null
}

interface EmployeeForSalarySync {
  id: string
  salary?: number | string | null
  joining_date?: string | null
  created_at?: string | null
}

export class EmploymentHistoryService {
  private static toDateOnly(date?: string | null): string | null {
    return date ? date.split('T')[0].split(' ')[0] : null
  }

  private static toSalaryNumber(salary?: number | string | null): number | null {
    if (salary === null || salary === undefined || salary === '') {
      return null
    }

    const value = typeof salary === 'string' ? parseFloat(salary) : salary
    return isNaN(value) ? null : value
  }

  private static getHistoryJoiningDate(employee: EmployeeForHistorySync): string {
    return (
      this.toDateOnly(employee.joining_date) ||
      this.toDateOnly(employee.created_at) ||
      new Date().toISOString().split('T')[0]
    )
  }

  private static async getLatestEmploymentHistory(employeeId: string): Promise<EmploymentHistory | null> {
    const { data, error } = await supabase
      .from('employment_history')
      .select('*')
      .eq('employee_id', employeeId)
      .order('joining_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Error fetching latest employment history:', error)
      throw error
    }

    return data ?? null
  }

  private static getSalaryEffectiveDate(employee: EmployeeForSalarySync, effectiveDate?: string | null): string {
    return (
      this.toDateOnly(effectiveDate) ||
      this.toDateOnly(employee.joining_date) ||
      this.toDateOnly(employee.created_at) ||
      new Date().toISOString().split('T')[0]
    )
  }

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

  static async getSalaryHistory(employeeId: string): Promise<SalaryHistory[]> {
    try {
      if (!employeeId) {
        console.error('Employee ID is required for fetching salary history')
        return []
      }

      const { data, error } = await supabase
        .from('employee_salary_history')
        .select('*')
        .eq('employee_id', employeeId)
        .order('effective_date', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching salary history:', error)
        throw error
      }

      return data ?? []
    } catch (error) {
      console.error('Error fetching salary history:', error)
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

  static async upsertSalaryHistory(
    employeeId: string,
    salary: number | string,
    effectiveDate: string
  ): Promise<SalaryHistory> {
    try {
      const salaryAmount = this.toSalaryNumber(salary)
      if (salaryAmount === null) {
        throw new Error('A valid salary amount is required')
      }

      const { data, error } = await supabase
        .from('employee_salary_history')
        .upsert(
          {
            employee_id: employeeId,
            salary: salaryAmount,
            effective_date: effectiveDate,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'employee_id,effective_date' }
        )
        .select()
        .single()

      if (error) {
        console.error('Error saving salary history:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Error saving salary history:', error)
      throw error
    }
  }

  static async syncCurrentSalaryHistory(
    employee: EmployeeForSalarySync,
    effectiveDate?: string | null
  ): Promise<SalaryHistory | null> {
    if (!employee.id) {
      throw new Error('Employee ID is required for syncing salary history')
    }

    const salaryAmount = this.toSalaryNumber(employee.salary)
    if (salaryAmount === null) {
      return null
    }

    return this.upsertSalaryHistory(
      employee.id,
      salaryAmount,
      this.getSalaryEffectiveDate(employee, effectiveDate)
    )
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

  static async syncCurrentEmploymentHistory(
    employee: EmployeeForHistorySync,
    options?: { createNewPeriod?: boolean }
  ): Promise<EmploymentHistory> {
    if (!employee.id) {
      throw new Error('Employee ID is required for syncing employment history')
    }

    const joiningDate = this.getHistoryJoiningDate(employee)
    const exitDate = this.toDateOnly(employee.exit_date)
    const status = employee.status || 'active'

    if (options?.createNewPeriod) {
      return this.createEmploymentHistory(employee.id, joiningDate, exitDate, status)
    }

    const latestHistory = await this.getLatestEmploymentHistory(employee.id)

    if (!latestHistory) {
      return this.createEmploymentHistory(employee.id, joiningDate, exitDate, status)
    }

    return this.updateEmploymentHistory(latestHistory.id, {
      joining_date: joiningDate,
      exit_date: exitDate,
      status,
    })
  }

  static async backfillEmploymentHistory(): Promise<number> {
    try {
      const { data: employees, error: employeesError } = await supabase
        .from('employees')
        .select('id, joining_date, exit_date, status, created_at')

      if (employeesError) {
        console.error('Error fetching employees:', employeesError)
        throw employeesError
      }

      if (!employees || employees.length === 0) {
        return 0
      }

      let syncedCount = 0

      for (const employee of employees) {
        try {
          const joiningDate = this.getHistoryJoiningDate(employee)
          const exitDate = this.toDateOnly(employee.exit_date)
          const status = employee.status || 'active'
          const latestHistory = await this.getLatestEmploymentHistory(employee.id)

          if (!latestHistory) {
            await this.createEmploymentHistory(employee.id, joiningDate, exitDate, status)
            syncedCount++
            continue
          }

          const historyExitDate = this.toDateOnly(latestHistory.exit_date)
          if (
            latestHistory.joining_date !== joiningDate ||
            historyExitDate !== exitDate ||
            latestHistory.status !== status
          ) {
            await this.updateEmploymentHistory(latestHistory.id, {
              joining_date: joiningDate,
              exit_date: exitDate,
              status,
            })
            syncedCount++
          }
        } catch (error) {
          console.error(`Error syncing history for employee ${employee.id}:`, error)
        }
      }

      return syncedCount
    } catch (error) {
      console.error('Error backfilling employment history:', error)
      throw error
    }
  }

  static async backfillSalaryHistory(): Promise<number> {
    try {
      const { data: employees, error: employeesError } = await supabase
        .from('employees')
        .select('id, salary, joining_date, created_at')
        .not('salary', 'is', null)

      if (employeesError) {
        console.error('Error fetching employees:', employeesError)
        throw employeesError
      }

      if (!employees || employees.length === 0) {
        return 0
      }

      let syncedCount = 0

      for (const employee of employees) {
        try {
          const history = await this.syncCurrentSalaryHistory(employee)
          if (history) {
            syncedCount++
          }
        } catch (error) {
          console.error(`Error syncing salary history for employee ${employee.id}:`, error)
        }
      }

      return syncedCount
    } catch (error) {
      console.error('Error backfilling salary history:', error)
      throw error
    }
  }
}
