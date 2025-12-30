import { useState, useEffect } from 'react'
import { EmployeeService } from '@/lib/services/employee.service'

export function useRecentEmployees(limit: number = 5) {
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchEmployees() {
      try {
        setLoading(true)
        setError(null)
        const data = await EmployeeService.getRecentEmployees(limit)
        setEmployees(data)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch recent employees'))
        setEmployees([])
      } finally {
        setLoading(false)
      }
    }

    fetchEmployees()
  }, [limit])

  return { employees, loading, error }
}

