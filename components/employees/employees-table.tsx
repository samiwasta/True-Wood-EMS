'use client'

import React, { useState, useMemo, useRef, useEffect } from 'react'
import { useEmployees, Employee } from '@/lib/hooks/useEmployees'
import { useCategories } from '@/lib/hooks/useCategories'
import { useDepartments } from '@/lib/hooks/useDepartments'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { EmployeeService } from '@/lib/services/employee.service'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Edit2, Trash2, AlertTriangle, CalendarIcon, CalendarDays } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { LeaveService, EmployeeLeaveBalance } from '@/lib/services/leave.service'
import { format } from 'date-fns'

const predefinedCategoryOrder = ['Worker Staff', 'Dubai Staff', 'Daily Basis Staff', 'Office Staff']

const getCategoryOrder = (categoryName?: string): number => {
  if (!categoryName) return 999
  const index = predefinedCategoryOrder.findIndex(
    cat => cat.toLowerCase() === categoryName.toLowerCase()
  )
  return index === -1 ? 999 : index
}

interface EmployeesTableProps {
  searchQuery?: string
  onAddEmployeeTriggerRef?: React.MutableRefObject<(() => void) | null>
}

export function EmployeesTable({ searchQuery = '', onAddEmployeeTriggerRef }: EmployeesTableProps) {
  const { employees, loading, createEmployee, updateEmployee, deleteEmployee } = useEmployees()
  const { categories } = useCategories()
  const { departments } = useDepartments()
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form state
  const [employeeId, setEmployeeId] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [categoryId, setCategoryId] = useState<string>('__none__')
  const [departmentId, setDepartmentId] = useState<string>('__none__')
  const [joiningDate, setJoiningDate] = useState<Date | undefined>(undefined)
  const [salary, setSalary] = useState('')
  const [status, setStatus] = useState('active')
  
  const [showJoiningCalendar, setShowJoiningCalendar] = useState(false)
  const joiningCalendarRef = useRef<HTMLDivElement>(null)
  const currentYear = new Date().getFullYear()
  
  const [employeeIdError, setEmployeeIdError] = useState<string>('')
  const [isCheckingEmployeeId, setIsCheckingEmployeeId] = useState(false)
  const debouncedEmployeeId = useDebounce(employeeId, 500)
  
  const [nameError, setNameError] = useState<string>('')
  const [phoneError, setPhoneError] = useState<string>('')
  const [salaryError, setSalaryError] = useState<string>('')
  
  const [leaveBalanceOpen, setLeaveBalanceOpen] = useState<string | null>(null)
  const [leaveBalance, setLeaveBalance] = useState<EmployeeLeaveBalance[]>([])
  const [leaveBalanceLoading, setLeaveBalanceLoading] = useState(false)
  const [leaveBalanceError, setLeaveBalanceError] = useState<string | null>(null)
  
  useEffect(() => {
    if (onAddEmployeeTriggerRef) {
      onAddEmployeeTriggerRef.current = () => {
        resetForm()
        setIsAddDialogOpen(true)
      }
    }
  }, [onAddEmployeeTriggerRef])
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (joiningCalendarRef.current && !joiningCalendarRef.current.contains(event.target as Node)) {
        setShowJoiningCalendar(false)
      }
    }
    
    if (showJoiningCalendar) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showJoiningCalendar])

  useEffect(() => {
    const validateEmployeeId = async () => {
      const trimmedId = debouncedEmployeeId.trim()
      
      if (!trimmedId) {
        setEmployeeIdError('')
        setIsCheckingEmployeeId(false)
        return
      }

      setIsCheckingEmployeeId(true)
      setEmployeeIdError('')

      try {
        const excludeId = isEditDialogOpen && editingEmployee ? editingEmployee.id : undefined
        const exists = await EmployeeService.checkEmployeeIdExists(trimmedId, excludeId)
        
        if (exists) {
          setEmployeeIdError('This Employee ID already exists')
        } else {
          setEmployeeIdError('')
        }
      } catch (error) {
        console.error('Error validating employee ID:', error)
        setEmployeeIdError('Error checking Employee ID. Please try again.')
      } finally {
        setIsCheckingEmployeeId(false)
      }
    }

    if (isAddDialogOpen || isEditDialogOpen) {
      validateEmployeeId()
    }
  }, [debouncedEmployeeId, isAddDialogOpen, isEditDialogOpen, editingEmployee])
  
  const validatePhone = (phoneNumber: string): boolean => {
    if (!phoneNumber || !phoneNumber.trim()) {
      return true
    }
    const cleaned = phoneNumber.replace(/[\s\-\(\)\+]/g, '')
    const digitsOnly = cleaned.replace(/\D/g, '')
    return digitsOnly.length === 10
  }

  const handlePhoneChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '')
    
    if (digitsOnly.length <= 10) {
      setPhone(value)
      
      if (value && digitsOnly.length > 0 && digitsOnly.length !== 10) {
        setPhoneError('Phone number must be 10 digits (excluding country code)')
      } else {
        setPhoneError('')
      }
    }
  }

  const validateSalary = (salaryValue: string): boolean => {
    if (!salaryValue || !salaryValue.trim()) {
      return true
    }
    const numSalary = parseFloat(salaryValue)
    return !isNaN(numSalary) && numSalary >= 0
  }

  const resetForm = () => {
    setEmployeeId('')
    setName('')
    setPhone('')
    setCategoryId('__none__')
    setDepartmentId('__none__')
    setJoiningDate(undefined)
    setSalary('')
    setStatus('active')
    setEmployeeIdError('')
    setIsCheckingEmployeeId(false)
    setNameError('')
    setPhoneError('')
    setSalaryError('')
  }
  
  const handleEditClick = (employee: Employee) => {
    setEditingEmployee(employee)
    setEmployeeId(employee.employee_id || '')
    setName(employee.name || '')
    setPhone(employee.phone || '')
    setCategoryId(employee.category_id || '__none__')
    setDepartmentId(employee.department_id || '__none__')
    setJoiningDate(employee.joining_date ? new Date(employee.joining_date) : undefined)
    setSalary(employee.salary ? String(employee.salary) : '')
    setStatus(employee.status || 'active')
    setIsEditDialogOpen(true)
  }
  
  const validateForm = (): boolean => {
    let isValid = true

    if (!name.trim()) {
      setNameError('Employee name is required')
      isValid = false
    } else {
      setNameError('')
    }

    if (phone && !validatePhone(phone)) {
      setPhoneError('Phone number must be 10 digits (excluding country code)')
      isValid = false
    } else {
      setPhoneError('')
    }

    if (salary && !validateSalary(salary)) {
      setSalaryError('Please enter a valid salary amount')
      isValid = false
    } else {
      setSalaryError('')
    }

    if (employeeIdError || isCheckingEmployeeId) {
      isValid = false
    }

    return isValid
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setIsSubmitting(true)
    try {
      await createEmployee({
        employee_id: employeeId.trim() || undefined,
        name: name.trim(),
        phone: phone.trim() || undefined,
        category_id: categoryId && categoryId !== '__none__' ? categoryId : undefined,
        department_id: departmentId && departmentId !== '__none__' ? departmentId : undefined,
        joining_date: joiningDate ? format(joiningDate, 'yyyy-MM-dd') : undefined,
        salary: salary ? parseFloat(salary) : undefined,
        status: status,
      })
      resetForm()
      setIsAddDialogOpen(false)
    } catch (error) {
      console.error('Error creating employee:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create employee. Please try again.'
      alert(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingEmployee) return
    if (!name.trim()) {
      alert('Employee name is required')
      return
    }
    
    setIsSubmitting(true)
    try {
      const updates: Record<string, unknown> = {
        name: name.trim(),
        status: status,
      }
      
      if (employeeId.trim()) {
        updates.employee_id = employeeId.trim()
      } else {
        updates.employee_id = null
      }
      
      if (phone.trim()) {
        updates.phone = phone.trim()
      } else {
        updates.phone = null
      }
      
      if (categoryId && categoryId !== '__none__') {
        updates.category_id = categoryId
      } else {
        updates.category_id = null
      }
      
      if (departmentId && departmentId !== '__none__') {
        updates.department_id = departmentId
      } else {
        updates.department_id = null
      }
      
      if (joiningDate) {
        updates.joining_date = format(joiningDate, 'yyyy-MM-dd')
      } else {
        updates.joining_date = null
      }
      
      if (salary) {
        const numSalary = parseFloat(salary)
        if (!isNaN(numSalary)) {
          updates.salary = numSalary
        }
      } else {
        updates.salary = null
      }
      
      await updateEmployee(editingEmployee.id, updates)
      resetForm()
      setEditingEmployee(null)
      setIsEditDialogOpen(false)
    } catch (error) {
      console.error('Error updating employee:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to update employee. Please try again.'
      alert(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleAddDialogOpenChange = (open: boolean) => {
    setIsAddDialogOpen(open)
    if (!open) {
      resetForm()
    }
  }
  
  const handleEditDialogOpenChange = (open: boolean) => {
    setIsEditDialogOpen(open)
    if (!open) {
      resetForm()
      setEditingEmployee(null)
    }
  }

  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) {
      return employees
    }

    const query = searchQuery.toLowerCase()
    return employees.filter((employee: Employee) => {
      const name = (employee.name || '').toLowerCase()
      const employeeId = (employee.employee_id || '').toLowerCase()
      const phone = (employee.phone || '').toLowerCase()
      const category = (employee.category?.name || '').toLowerCase()
      const department = (employee.department?.name || '').toLowerCase()
      
      return (
        name.includes(query) ||
        employeeId.includes(query) ||
        phone.includes(query) ||
        category.includes(query) ||
        department.includes(query)
      )
    })
  }, [employees, searchQuery])

  const groupedEmployees = useMemo(() => {
    const grouped: Record<string, Employee[]> = {}
    
    filteredEmployees.forEach((employee: Employee) => {
      const categoryName = employee.category?.name || 'Uncategorized'
      if (!grouped[categoryName]) {
        grouped[categoryName] = []
      }
      grouped[categoryName].push(employee)
    })

    // Sort employees within each category by employee_id
    Object.keys(grouped).forEach(category => {
      grouped[category].sort((a, b) => {
        const idA = a.employee_id || ''
        const idB = b.employee_id || ''
        return idA.localeCompare(idB, undefined, { numeric: true, sensitivity: 'base' })
      })
    })

    // Sort categories: predefined order first, then others alphabetically
    const sortedCategories = Object.keys(grouped).sort((a, b) => {
      const orderA = getCategoryOrder(a)
      const orderB = getCategoryOrder(b)
      
      // If both are in predefined order, sort by their order
      if (orderA !== 999 && orderB !== 999) {
        return orderA - orderB
      }
      
      // If only A is in predefined order, A comes first
      if (orderA !== 999) {
        return -1
      }
      
      // If only B is in predefined order, B comes first
      if (orderB !== 999) {
        return 1
      }
      
      // If neither is in predefined order, sort alphabetically
      return a.localeCompare(b, undefined, { sensitivity: 'base' })
    })

    return sortedCategories.map(category => ({
      category,
      employees: grouped[category],
    }))
  }, [filteredEmployees])

  const handleDelete = async () => {
    if (!deletingEmployee) return

    setIsSubmitting(true)
    try {
      await deleteEmployee(deletingEmployee.id)
      setDeletingEmployee(null)
      setIsDeleteDialogOpen(false)
    } catch (error) {
      console.error('Error deleting employee:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete employee. Please try again.'
      alert(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteClick = (employee: Employee) => {
    setDeletingEmployee(employee)
    setIsDeleteDialogOpen(true)
  }

  const handleViewLeaves = async (employee: Employee) => {
    if (!employee.id) return
    
    if (leaveBalanceOpen === employee.id) {
      setLeaveBalanceOpen(null)
      return
    }

    setLeaveBalanceOpen(employee.id)
    setLeaveBalanceLoading(true)
    setLeaveBalanceError(null)
    
    try {
      const balance = await LeaveService.getEmployeeLeaveBalance(employee.id)
      setLeaveBalance(balance)
    } catch (error) {
      console.error('Error fetching leave balance:', error)
      setLeaveBalanceError('Failed to load leave balance')
      setLeaveBalance([])
    } finally {
      setLeaveBalanceLoading(false)
    }
  }

  const handleDeleteDialogOpenChange = (open: boolean) => {
    setIsDeleteDialogOpen(open)
    if (!open) {
      setDeletingEmployee(null)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    try {
      return format(new Date(dateString), 'MMM dd, yyyy')
    } catch {
      return '-'
    }
  }

  const formatSalary = (salary?: number | string) => {
    if (!salary) return '-'
    const numSalary = typeof salary === 'string' ? parseFloat(salary) : salary
    if (isNaN(numSalary)) return '-'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(numSalary)
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 border border-green-200'
      case 'terminated':
        return 'bg-red-100 text-red-700 border border-red-200'
      case 'released':
        return 'bg-gray-100 text-gray-700 border border-gray-200'
      case 'transferred':
        return 'bg-blue-100 text-blue-700 border border-blue-200'
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-[#23887C] hover:bg-[#23887C]">
              <TableHead className="font-semibold text-white h-12 px-4">Employee ID</TableHead>
              <TableHead className="font-semibold text-white h-12 px-4">Name</TableHead>
              <TableHead className="font-semibold text-white h-12 px-4">Phone</TableHead>
              <TableHead className="font-semibold text-white h-12 px-4">Category</TableHead>
              <TableHead className="font-semibold text-white h-12 px-4">Department</TableHead>
              <TableHead className="font-semibold text-white h-12 px-4">Joining Date</TableHead>
              <TableHead className="font-semibold text-white h-12 px-4">Salary</TableHead>
              <TableHead className="font-semibold text-white h-12 px-4">Status</TableHead>
              <TableHead className="font-semibold text-white h-12 px-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groupedEmployees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-gray-500">
                  No employees found
                </TableCell>
              </TableRow>
            ) : (
              groupedEmployees.map(({ category, employees: categoryEmployees }) => (
                <React.Fragment key={category}>
                  <TableRow className="bg-[#23887C]/10 hover:bg-[#23887C]/10 border-t-2 border-[#23887C]">
                    <TableCell colSpan={9} className="font-semibold text-[#23887C] py-4 px-4 text-base">
                      {category}
                    </TableCell>
                  </TableRow>
                  {categoryEmployees.map((employee: Employee, index: number) => (
                    <TableRow 
                      key={employee.id} 
                      className={`hover:bg-[#23887C]/5 transition-colors ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                      }`}
                    >
                      <TableCell className="font-medium text-gray-900 px-4 py-3">
                        {employee.employee_id || '-'}
                      </TableCell>
                      <TableCell className="text-gray-900 font-medium px-4 py-3">
                        {employee.name}
                      </TableCell>
                      <TableCell className="text-gray-600 px-4 py-3">
                        {employee.phone || '-'}
                      </TableCell>
                      <TableCell className="text-gray-600 px-4 py-3">
                        {employee.category?.name || '-'}
                      </TableCell>
                      <TableCell className="text-gray-600 px-4 py-3">
                        {employee.department?.name || '-'}
                      </TableCell>
                      <TableCell className="text-gray-600 px-4 py-3">
                        {formatDate(employee.joining_date)}
                      </TableCell>
                      <TableCell className="text-gray-700 font-medium px-4 py-3">
                        {formatSalary(employee.salary)}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getStatusBadgeColor(employee.status)}`}>
                          {employee.status || 'active'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Popover 
                            open={leaveBalanceOpen === employee.id} 
                            onOpenChange={(open) => {
                              if (!open) {
                                setLeaveBalanceOpen(null)
                                setLeaveBalance([])
                                setLeaveBalanceError(null)
                              } else {
                                handleViewLeaves(employee)
                              }
                            }}
                          >
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors"
                                  >
                                    <CalendarDays className="h-4 w-4" />
                                  </Button>
                                </PopoverTrigger>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>View Leave Balance</p>
                              </TooltipContent>
                            </Tooltip>
                            <PopoverContent className="w-80 p-0" align="end">
                              <div className="p-4">
                                <div className="flex items-center gap-2 mb-4 pb-3 border-b">
                                  <CalendarDays className="h-5 w-5 text-[#23887C]" />
                                  <h3 className="font-semibold text-gray-900">Leave Balance</h3>
                                </div>
                                <div className="mb-2">
                                  <p className="text-sm font-medium text-gray-700 mb-1">{employee.name}</p>
                                  <p className="text-xs text-gray-500">Employee ID: {employee.employee_id || '-'}</p>
                                </div>
                                {leaveBalanceLoading ? (
                                  <div className="py-6 text-center">
                                    <div className="inline-block h-6 w-6 border-2 border-[#23887C] border-t-transparent rounded-full animate-spin" />
                                    <p className="text-sm text-gray-500 mt-2">Loading leave balance...</p>
                                  </div>
                                ) : leaveBalanceError ? (
                                  <div className="py-6 text-center">
                                    <AlertTriangle className="h-6 w-6 text-red-500 mx-auto mb-2" />
                                    <p className="text-sm text-red-600">{leaveBalanceError}</p>
                                  </div>
                                ) : leaveBalance.length === 0 ? (
                                  <div className="py-6 text-center">
                                    <p className="text-sm text-gray-500">No leave types found</p>
                                  </div>
                                ) : (
                                  <div className="space-y-3 max-h-64 overflow-y-auto">
                                    {leaveBalance.map((balance) => (
                                      <div
                                        key={balance.leave_type_id}
                                        className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                                      >
                                        <div className="flex items-start justify-between mb-2">
                                          <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">
                                              {balance.leave_type_name}
                                            </p>
                                            {balance.is_paid !== null && (
                                              <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${
                                                balance.is_paid
                                                  ? 'bg-green-100 text-green-700'
                                                  : 'bg-orange-100 text-orange-700'
                                              }`}>
                                                {balance.is_paid ? 'Paid' : 'Unpaid'}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                                          <div>
                                            <p className="text-gray-500">Max Days</p>
                                            <p className="font-medium text-gray-900 mt-0.5">
                                              {balance.max_days !== null ? balance.max_days : '-'}
                                            </p>
                                          </div>
                                          <div>
                                            <p className="text-gray-500">Taken</p>
                                            <p className="font-medium text-gray-900 mt-0.5">
                                              {balance.taken_days}
                                            </p>
                                          </div>
                                          <div>
                                            <p className="text-gray-500">Remaining</p>
                                            <p className={`font-medium mt-0.5 ${
                                              balance.remaining_days !== null
                                                ? balance.remaining_days > 0
                                                  ? 'text-green-600'
                                                  : 'text-red-600'
                                                : 'text-gray-900'
                                            }`}>
                                              {balance.remaining_days !== null ? balance.remaining_days : '-'}
                                            </p>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </PopoverContent>
                          </Popover>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                            onClick={() => handleEditClick(employee)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                            onClick={() => handleDeleteClick(employee)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Employee Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={handleAddDialogOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">Add New Employee</DialogTitle>
            <DialogDescription className="text-gray-500">
              Fill in the employee details below. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="add-employee-id" className="text-sm font-medium text-gray-700 block">
                    Employee ID
                  </label>
                  <div className="relative">
                    <Input
                      id="add-employee-id"
                      type="text"
                      placeholder="e.g., EMP001"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      className={`h-11 border-gray-300 focus:border-[#23887C] focus:ring-[#23887C] focus:ring-1 ${
                        employeeIdError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                      }`}
                      disabled={isSubmitting}
                    />
                    {isCheckingEmployeeId && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="h-4 w-4 border-2 border-[#23887C] border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  {employeeIdError && (
                    <p className="text-sm text-red-600 mt-1">{employeeIdError}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label htmlFor="add-joining-date" className="text-sm font-medium text-gray-700 block">
                    Joining Date
                  </label>
                  <div className="relative w-full" ref={joiningCalendarRef}>
                    <Input
                      id="add-joining-date"
                      type="text"
                      readOnly
                      placeholder="Select joining date"
                      value={joiningDate ? format(joiningDate, 'PPP') : ''}
                      onClick={() => setShowJoiningCalendar(!showJoiningCalendar)}
                      className="h-11 w-full border-gray-300 focus:border-[#23887C] focus:ring-[#23887C] focus:ring-1 cursor-pointer pr-10"
                      disabled={isSubmitting}
                    />
                    <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    {showJoiningCalendar && (
                      <div className="absolute z-[100] mt-1 left-0 top-full bg-white border border-gray-300 rounded-md shadow-xl p-3">
                        <Calendar
                          mode="single"
                          selected={joiningDate}
                          onSelect={(date) => {
                            setJoiningDate(date)
                            setShowJoiningCalendar(false)
                          }}
                          disabled={isSubmitting}
                          captionLayout="dropdown"
                          fromYear={currentYear - 50}
                          toYear={currentYear + 1}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="add-name" className="text-sm font-medium text-gray-700 block">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="add-name"
                    type="text"
                    placeholder="Employee name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value)
                      if (e.target.value.trim()) {
                        setNameError('')
                      }
                    }}
                    onBlur={() => {
                      if (!name.trim()) {
                        setNameError('Employee name is required')
                      }
                    }}
                    className={`h-11 border-gray-300 focus:border-[#23887C] focus:ring-[#23887C] focus:ring-1 ${
                      nameError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                    }`}
                    disabled={isSubmitting}
                    required
                  />
                  {nameError && (
                    <p className="text-sm text-red-600 mt-1">{nameError}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label htmlFor="add-phone" className="text-sm font-medium text-gray-700 block">
                    Phone
                  </label>
                  <Input
                    id="add-phone"
                    type="tel"
                    placeholder="1234567890"
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    onBlur={() => {
                      if (phone && !validatePhone(phone)) {
                        setPhoneError('Phone number must be 10 digits (excluding country code)')
                      }
                    }}
                    className={`h-11 border-gray-300 focus:border-[#23887C] focus:ring-[#23887C] focus:ring-1 ${
                      phoneError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                    }`}
                    disabled={isSubmitting}
                  />
                  {phoneError && (
                    <p className="text-sm text-red-600 mt-1">{phoneError}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="add-category" className="text-sm font-medium text-gray-700 block">
                    Category
                  </label>
                  <Select value={categoryId} onValueChange={setCategoryId} disabled={isSubmitting}>
                    <SelectTrigger className="w-full h-11! border-gray-300 focus:border-[#23887C] focus:ring-[#23887C]">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="w-full">
                      <SelectItem value="__none__">None</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="add-department" className="text-sm font-medium text-gray-700 block">
                    Department
                  </label>
                  <Select value={departmentId} onValueChange={setDepartmentId} disabled={isSubmitting}>
                    <SelectTrigger className="w-full h-11! border-gray-300 focus:border-[#23887C] focus:ring-[#23887C]">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent className="w-full">
                      <SelectItem value="__none__">None</SelectItem>
                      {departments.map((department) => (
                        <SelectItem key={department.id} value={department.id}>
                          {department.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="add-status" className="text-sm font-medium text-gray-700 block">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <Select value={status} onValueChange={setStatus} disabled={isSubmitting}>
                    <SelectTrigger className="w-full h-11! border-gray-300 focus:border-[#23887C] focus:ring-[#23887C]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="w-full">
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="terminated">Terminated</SelectItem>
                      <SelectItem value="released">Released</SelectItem>
                      <SelectItem value="transferred">Transferred</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="add-salary" className="text-sm font-medium text-gray-700 block">
                    Salary
                  </label>
                  <Input
                    id="add-salary"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    className="h-11 border-gray-300 focus:border-[#23887C] focus:ring-[#23887C] focus:ring-1"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleAddDialogOpenChange(false)}
                disabled={isSubmitting}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isCheckingEmployeeId || !!employeeIdError || !!nameError || !!phoneError || !!salaryError}
                className="bg-[#23887C] hover:bg-[#1f7569] text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <span className="mr-2">Creating...</span>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </>
                ) : (
                  'Create Employee'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={handleEditDialogOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">Edit Employee</DialogTitle>
            <DialogDescription className="text-gray-500">
              Update the employee details below. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="edit-employee-id" className="text-sm font-medium text-gray-700 block">
                    Employee ID
                  </label>
                  <div className="relative">
                    <Input
                      id="edit-employee-id"
                      type="text"
                      placeholder="e.g., EMP001"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      className={`h-11 border-gray-300 focus:border-[#23887C] focus:ring-[#23887C] focus:ring-1 ${
                        employeeIdError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                      }`}
                      disabled={isSubmitting}
                    />
                    {isCheckingEmployeeId && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="h-4 w-4 border-2 border-[#23887C] border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  {employeeIdError && (
                    <p className="text-sm text-red-600 mt-1">{employeeIdError}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label htmlFor="edit-joining-date" className="text-sm font-medium text-gray-700 block">
                    Joining Date
                  </label>
                  <div className="relative w-full" ref={joiningCalendarRef}>
                    <Input
                      id="edit-joining-date"
                      type="text"
                      readOnly
                      placeholder="Select joining date"
                      value={joiningDate ? format(joiningDate, 'PPP') : ''}
                      onClick={() => setShowJoiningCalendar(!showJoiningCalendar)}
                      className="h-11 w-full border-gray-300 focus:border-[#23887C] focus:ring-[#23887C] focus:ring-1 cursor-pointer pr-10"
                      disabled={isSubmitting}
                    />
                    <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    {showJoiningCalendar && (
                      <div className="absolute z-[100] mt-1 left-0 top-full bg-white border border-gray-300 rounded-md shadow-xl p-3">
                        <Calendar
                          mode="single"
                          selected={joiningDate}
                          onSelect={(date) => {
                            setJoiningDate(date)
                            setShowJoiningCalendar(false)
                          }}
                          disabled={isSubmitting}
                          captionLayout="dropdown"
                          fromYear={currentYear - 50}
                          toYear={currentYear + 1}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="edit-name" className="text-sm font-medium text-gray-700 block">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="edit-name"
                    type="text"
                    placeholder="Employee name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value)
                      if (e.target.value.trim()) {
                        setNameError('')
                      }
                    }}
                    onBlur={() => {
                      if (!name.trim()) {
                        setNameError('Employee name is required')
                      }
                    }}
                    className={`h-11 border-gray-300 focus:border-[#23887C] focus:ring-[#23887C] focus:ring-1 ${
                      nameError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                    }`}
                    disabled={isSubmitting}
                    required
                  />
                  {nameError && (
                    <p className="text-sm text-red-600 mt-1">{nameError}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label htmlFor="edit-phone" className="text-sm font-medium text-gray-700 block">
                    Phone
                  </label>
                  <Input
                    id="edit-phone"
                    type="tel"
                    placeholder="+91 1234567890"
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    onBlur={() => {
                      if (phone && !validatePhone(phone)) {
                        setPhoneError('Phone number must be 10 digits (excluding country code)')
                      }
                    }}
                    className={`h-11 border-gray-300 focus:border-[#23887C] focus:ring-[#23887C] focus:ring-1 ${
                      phoneError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                    }`}
                    disabled={isSubmitting}
                  />
                  {phoneError && (
                    <p className="text-sm text-red-600 mt-1">{phoneError}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="edit-category" className="text-sm font-medium text-gray-700 block">
                    Category
                  </label>
                  <Select value={categoryId} onValueChange={setCategoryId} disabled={isSubmitting}>
                    <SelectTrigger className="w-full h-11 border-gray-300 focus:border-[#23887C] focus:ring-[#23887C]">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="w-full">
                      <SelectItem value="__none__">None</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="edit-department" className="text-sm font-medium text-gray-700 block">
                    Department
                  </label>
                  <Select value={departmentId} onValueChange={setDepartmentId} disabled={isSubmitting}>
                    <SelectTrigger className="w-full h-11 border-gray-300 focus:border-[#23887C] focus:ring-[#23887C]">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent className="w-full">
                      <SelectItem value="__none__">None</SelectItem>
                      {departments.map((department) => (
                        <SelectItem key={department.id} value={department.id}>
                          {department.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="edit-status" className="text-sm font-medium text-gray-700 block">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <Select value={status} onValueChange={setStatus} disabled={isSubmitting}>
                    <SelectTrigger className="w-full h-11 border-gray-300 focus:border-[#23887C] focus:ring-[#23887C]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="w-full">
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="terminated">Terminated</SelectItem>
                      <SelectItem value="released">Released</SelectItem>
                      <SelectItem value="transferred">Transferred</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="edit-status" className="text-sm font-medium text-gray-700 block">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <Select value={status} onValueChange={setStatus} disabled={isSubmitting}>
                    <SelectTrigger className="w-full h-11! border-gray-300 focus:border-[#23887C] focus:ring-[#23887C]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="w-full">
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="terminated">Terminated</SelectItem>
                      <SelectItem value="released">Released</SelectItem>
                      <SelectItem value="transferred">Transferred</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="edit-salary" className="text-sm font-medium text-gray-700 block">
                    Salary
                  </label>
                  <Input
                    id="edit-salary"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={salary}
                    onChange={(e) => {
                      setSalary(e.target.value)
                      if (e.target.value && !validateSalary(e.target.value)) {
                        setSalaryError('Please enter a valid salary amount')
                      } else {
                        setSalaryError('')
                      }
                    }}
                    onBlur={() => {
                      if (salary && !validateSalary(salary)) {
                        setSalaryError('Please enter a valid salary amount')
                      }
                    }}
                    className={`h-11 border-gray-300 focus:border-[#23887C] focus:ring-[#23887C] focus:ring-1 ${
                      salaryError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
                    }`}
                    disabled={isSubmitting}
                  />
                  {salaryError && (
                    <p className="text-sm text-red-600 mt-1">{salaryError}</p>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter className="gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleEditDialogOpenChange(false)}
                disabled={isSubmitting}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isCheckingEmployeeId || !!employeeIdError || !!nameError || !!phoneError || !!salaryError}
                className="bg-[#23887C] hover:bg-[#1f7569] text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <span className="mr-2">Updating...</span>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </>
                ) : (
                  'Update Employee'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={handleDeleteDialogOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              Delete Employee
            </DialogTitle>
            <DialogDescription className="text-gray-500 pt-2">
              Are you sure you want to delete this employee? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deletingEmployee && (
            <div className="py-4">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="font-medium text-gray-900">{deletingEmployee.name}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Employee ID: {deletingEmployee.employee_id || '-'}
                </p>
                {deletingEmployee.category?.name && (
                  <p className="text-sm text-gray-500 mt-1">
                    Category: {deletingEmployee.category.name}
                  </p>
                )}
              </div>
            </div>
          )}
          <DialogFooter className="gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleDeleteDialogOpenChange(false)}
              disabled={isSubmitting}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <span className="mr-2">Deleting...</span>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Employee
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

