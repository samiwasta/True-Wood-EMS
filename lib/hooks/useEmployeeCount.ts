import { useState, useEffect } from 'react'
import { EmployeeService } from '@/lib/services/employee.service'

export function useEmployeeCount() {
  const [count, setCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchCount() {
      try {
        setLoading(true)
        setError(null)
        const employeeCount = await EmployeeService.getEmployeeCount()
        setCount(employeeCount)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch employee count'))
        setCount(0)
      } finally {
        setLoading(false)
      }
    }

    fetchCount()
  }, [])

  return { count, loading, error }
}

