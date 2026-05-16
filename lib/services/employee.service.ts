import { supabase } from '@/lib/supabase'
import { normalizePhoneNumber } from '@/lib/utils'
import { EmploymentHistoryService } from './employment-history.service'

const NON_ACTIVE_EMPLOYEE_STATUSES = ['inactive', 'terminated', 'released', 'transferred', 'resigned']
const todayDate = () => new Date().toISOString().split('T')[0]
const toAmountNumber = (amount: unknown): number | null => {
  if (amount === null || amount === undefined || amount === '') {
    return null
  }

  const value = typeof amount === 'string' ? parseFloat(amount) : Number(amount)
  return isNaN(value) ? null : value
}

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
        .select(`
          *,
          category:categories(id, name),
          department:departments(id, name)
        `)
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
      // Paginate to avoid Supabase's default 1000-row limit
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const allEmployees: any[] = []
      let offset = 0
      const pageSize = 1000
      let hasMore = true

      while (hasMore) {
        const { data, error } = await supabase
          .from('employees')
          .select(`
            *,
            category:categories(id, name),
            department:departments(id, name)
          `)
          .order('employee_id', { ascending: true, nullsFirst: false })
          .range(offset, offset + pageSize - 1)

        if (error) {
          console.error('Error fetching employees:', error)
          throw error
        }

        if (data && data.length > 0) {
          allEmployees.push(...data)
          offset += pageSize
          hasMore = data.length === pageSize
        } else {
          hasMore = false
        }
      }

      return allEmployees
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

      const { data: currentEmployee } = await supabase
        .from('employees')
        .select('status, joining_date, exit_date, salary, food_allowance, created_at')
        .eq('id', id)
        .single()

      const normalizedUpdates = { ...updates }
      const salaryEffectiveDate = typeof normalizedUpdates.salary_effective_date === 'string'
        ? normalizedUpdates.salary_effective_date
        : undefined
      delete normalizedUpdates.salary_effective_date

      const foodAllowanceEffectiveDate = typeof normalizedUpdates.food_allowance_effective_date === 'string'
        ? normalizedUpdates.food_allowance_effective_date
        : undefined
      delete normalizedUpdates.food_allowance_effective_date

      const hasSalaryUpdate = Object.prototype.hasOwnProperty.call(normalizedUpdates, 'salary')
      const nextSalary = hasSalaryUpdate ? toAmountNumber(normalizedUpdates.salary) : null
      const currentSalary = toAmountNumber(currentEmployee?.salary)

      const hasFoodAllowanceUpdate = Object.prototype.hasOwnProperty.call(normalizedUpdates, 'food_allowance')
      const nextFoodAllowance = hasFoodAllowanceUpdate ? toAmountNumber(normalizedUpdates.food_allowance) : null
      const currentFoodAllowance = toAmountNumber(currentEmployee?.food_allowance)
      const nextStatus = typeof normalizedUpdates.status === 'string'
        ? normalizedUpdates.status
        : currentEmployee?.status

      if (nextStatus === 'active') {
        normalizedUpdates.exit_date = null
      } else if (nextStatus && NON_ACTIVE_EMPLOYEE_STATUSES.includes(nextStatus)) {
        const nextExitDate = normalizedUpdates.exit_date || currentEmployee?.exit_date
        if (!nextExitDate) {
          normalizedUpdates.exit_date = todayDate()
        }
      }

      const { data, error } = await supabase
        .from('employees')
        .update({
          ...normalizedUpdates,
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
        console.error('Updates sent:', normalizedUpdates)
        
        const errorMessage = error.message || error.details || 'Failed to update employee'
        throw new Error(errorMessage)
      }

      if (data && currentEmployee) {
        try {
          const oldStatus = currentEmployee.status
          const currentStatus = data.status || 'active'
          const isRejoin = oldStatus
            && NON_ACTIVE_EMPLOYEE_STATUSES.includes(oldStatus)
            && currentStatus === 'active'

          await EmploymentHistoryService.syncCurrentEmploymentHistory(
            {
              id: data.id,
              joining_date: isRejoin && !data.joining_date ? todayDate() : data.joining_date,
              exit_date: data.exit_date,
              status: currentStatus,
              created_at: data.created_at,
            },
            { createNewPeriod: Boolean(isRejoin) }
          )

          if (hasSalaryUpdate && nextSalary !== null && nextSalary !== currentSalary) {
            await EmploymentHistoryService.syncCurrentSalaryHistory(
              {
                id: data.id,
                salary: nextSalary,
                joining_date: data.joining_date,
                created_at: data.created_at,
              },
              salaryEffectiveDate
            )
          }

          if (hasFoodAllowanceUpdate && nextFoodAllowance !== null && nextFoodAllowance !== currentFoodAllowance) {
            await EmploymentHistoryService.syncCurrentFoodAllowanceHistory(
              {
                id: data.id,
                food_allowance: nextFoodAllowance,
                joining_date: data.joining_date,
                created_at: data.created_at,
              },
              foodAllowanceEffectiveDate
            )
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
    salary_effective_date?: string
    food_allowance?: number | string
    food_allowance_effective_date?: string
    status?: string
  }) {
    try {
      const trimmedName = employeeData.name.trim()
      if (!trimmedName) {
        throw new Error('Employee name is required')
      }

      const initialStatus = employeeData.status || 'active'
      const payload: Record<string, unknown> = {
        name: trimmedName,
        status: initialStatus,
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
      if (initialStatus !== 'active' && NON_ACTIVE_EMPLOYEE_STATUSES.includes(initialStatus)) {
        payload.exit_date = employeeData.exit_date || todayDate()
      }
      if (employeeData.salary !== null && employeeData.salary !== undefined && employeeData.salary !== '') {
        const numSalary = toAmountNumber(employeeData.salary)
        if (numSalary !== null) {
          payload.salary = numSalary
        }
      }
      if (employeeData.food_allowance !== null && employeeData.food_allowance !== undefined && employeeData.food_allowance !== '') {
        const numFoodAllowance = toAmountNumber(employeeData.food_allowance)
        if (numFoodAllowance !== null) {
          payload.food_allowance = numFoodAllowance
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

      if (data && data.id) {
        try {
          await EmploymentHistoryService.syncCurrentEmploymentHistory({
            id: data.id,
            joining_date: data.joining_date,
            exit_date: data.exit_date,
            status: data.status,
            created_at: data.created_at,
          })
          await EmploymentHistoryService.syncCurrentSalaryHistory(
            {
              id: data.id,
              salary: data.salary,
              joining_date: data.joining_date,
              created_at: data.created_at,
            },
            employeeData.salary_effective_date
          )
          await EmploymentHistoryService.syncCurrentFoodAllowanceHistory(
            {
              id: data.id,
              food_allowance: data.food_allowance,
              joining_date: data.joining_date,
              created_at: data.created_at,
            },
            employeeData.food_allowance_effective_date
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
