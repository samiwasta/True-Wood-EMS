import { useState, useEffect, useCallback } from 'react'
import { EmployeeService } from '@/lib/services/employee.service'

export interface Employee {
  id: string
  employee_id?: string
  name: string
  phone?: string
  email?: string
  category_id?: string
  department_id?: string
  work_site_id?: string
  joining_date?: string
  exit_date?: string
  salary?: number | string
  status: 'active' | 'terminated' | 'released' | string
  created_at: string
  updated_at: string
  category?: {
    id: string
    name: string
  }
  department?: {
    id: string
    name: string
  }
}

export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await EmployeeService.getAllEmployees()
      setEmployees(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch employees'))
      setEmployees([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  const createEmployee = useCallback(async (employeeData: {
    employee_id?: string
    name: string
    email?: string
    phone?: string
    category_id?: string
    department_id?: string
    work_site_id?: string
    joining_date?: string
    exit_date?: string
    salary?: number | string
    status?: string
  }) => {
    try {
      const data = await EmployeeService.createEmployee(employeeData)
      await fetchEmployees()
      return data
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to create employee')
    }
  }, [fetchEmployees])

  const updateEmployee = useCallback(async (id: string, updates: Record<string, unknown>) => {
    try {
      const data = await EmployeeService.updateEmployee(id, updates)
      await fetchEmployees()
      return data
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to update employee')
    }
  }, [fetchEmployees])

  const deleteEmployee = useCallback(async (id: string) => {
    try {
      await EmployeeService.deleteEmployee(id)
      await fetchEmployees()
      return true
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to delete employee')
    }
  }, [fetchEmployees])

  return { 
    employees, 
    loading, 
    error,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    refetch: fetchEmployees
  }
}

