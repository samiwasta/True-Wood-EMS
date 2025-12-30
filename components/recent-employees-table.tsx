'use client'

import { useRecentEmployees } from '@/lib/hooks/useRecentEmployees'
import { Skeleton } from '@/components/ui/skeleton'
import { Users } from 'lucide-react'

export function RecentEmployeesTable() {
  const { employees, loading } = useRecentEmployees(5)

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-5 w-5 text-gray-600" />
        <h2 className="text-lg font-semibold text-gray-900">Recent Employees</h2>
      </div>
      
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : employees.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No recent employees found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {employees.map((employee: any, index: number) => (
            <div key={employee.id || index} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="h-10 w-10 rounded-full bg-[#23887C] flex items-center justify-center text-white font-semibold">
                {employee.name?.charAt(0)?.toUpperCase() || 'E'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {employee.name || employee.full_name || 'Unknown'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {employee.department || employee.role || 'No department'}
                </p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                employee.status === 'active' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {employee.status || 'active'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

