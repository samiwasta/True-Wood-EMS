'use client'

import { useState, useRef } from 'react'
import { EmployeesTable } from '@/components/employees/employees-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Plus } from 'lucide-react'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'

import { Suspense } from 'react'

function EmployeesPageInner() {
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const addEmployeeTriggerRef = useRef<() => void>(null)
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    if (searchParams.get('add') === 'true' && addEmployeeTriggerRef.current) {
      addEmployeeTriggerRef.current()
      // Remove the param after triggering to avoid reopening on reload
      const params = new URLSearchParams(searchParams.toString())
      params.delete('add')
      router.replace(`/employees${params.toString() ? `?${params.toString()}` : ''}`)
    }
  }, [searchParams, router])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-500">Manage employees and their details</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Search employees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 h-10 w-64 border-gray-300 focus:border-[#23887C] focus:ring-[#23887C] focus:ring-1 bg-white shadow-sm transition-all duration-200"
            />
          </div>
          <Button
            className="bg-[#23887C] hover:bg-[#1f7569] text-white h-10 px-4 gap-2"
            onClick={() => {
              if (addEmployeeTriggerRef.current) {
                addEmployeeTriggerRef.current()
              }
            }}
          >
            <Plus className="h-4 w-4" />
            Add Employee
          </Button>
        </div>
      </div>
      <EmployeesTable
        searchQuery={debouncedSearch}
        onAddEmployeeTriggerRef={addEmployeeTriggerRef}
      />
    </div>
  )
}

export default function EmployeesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EmployeesPageInner />
    </Suspense>
  )
}