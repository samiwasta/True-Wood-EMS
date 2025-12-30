'use client'

import { useState, useMemo } from 'react'
import { useDepartments } from '@/lib/hooks/useDepartments'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { Skeleton } from '@/components/ui/skeleton'
import { Department } from '@/lib/models/settings.model'
import { Building2, Plus, Edit2, Trash2, Search, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export function DepartmentsTab() {
  const { departments, loading, createDepartment, updateDepartment, deleteDepartment } = useDepartments()
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  
  // Add dialog state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  
  // Form state
  const [departmentName, setDepartmentName] = useState('')
  const [departmentDescription, setDepartmentDescription] = useState('')
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [deletingDepartment, setDeletingDepartment] = useState<Department | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const filteredDepartments = useMemo(() => {
    if (!debouncedSearch.trim()) {
      return departments
    }

    const query = debouncedSearch.toLowerCase()
    return departments.filter((department: Department) => {
      const name = (department.name || department.title || '').toLowerCase()
      const description = (department.description || '').toLowerCase()
      return name.includes(query) || description.includes(query)
    })
  }, [departments, debouncedSearch])

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!departmentName.trim()) {
      return
    }

    setIsSubmitting(true)
    try {
      await createDepartment(departmentName, departmentDescription)
      
      // Reset form and close dialog
      setDepartmentName('')
      setDepartmentDescription('')
      setIsAddDialogOpen(false)
    } catch (error) {
      console.error('Error adding department:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to add department. Please try again.'
      alert(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!departmentName.trim() || !editingDepartment) {
      return
    }

    setIsSubmitting(true)
    try {
      // Pass description only if it has a value, otherwise pass undefined
      const descriptionToUpdate = departmentDescription.trim() || undefined
      await updateDepartment(editingDepartment.id, departmentName, descriptionToUpdate)
      
      // Reset form and close dialog
      setDepartmentName('')
      setDepartmentDescription('')
      setEditingDepartment(null)
      setIsEditDialogOpen(false)
    } catch (error) {
      console.error('Error updating department:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to update department. Please try again.'
      alert(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingDepartment) return

    setIsSubmitting(true)
    try {
      await deleteDepartment(deletingDepartment.id)
      
      // Reset and close dialog
      setDeletingDepartment(null)
      setIsDeleteDialogOpen(false)
    } catch (error) {
      console.error('Error deleting department:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete department. Please try again.'
      alert(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddDialogOpenChange = (open: boolean) => {
    setIsAddDialogOpen(open)
    if (!open) {
      setDepartmentName('')
      setDepartmentDescription('')
    }
  }

  const handleEditClick = (department: Department) => {
    setEditingDepartment(department)
    setDepartmentName(department.name || department.title || '')
    setDepartmentDescription(department.description || '')
    setIsEditDialogOpen(true)
  }

  const handleEditDialogOpenChange = (open: boolean) => {
    setIsEditDialogOpen(open)
    if (!open) {
      setDepartmentName('')
      setDepartmentDescription('')
      setEditingDepartment(null)
    }
  }

  const handleDeleteClick = (department: Department) => {
    setDeletingDepartment(department)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteDialogOpenChange = (open: boolean) => {
    setIsDeleteDialogOpen(open)
    if (!open) {
      setDeletingDepartment(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-[#23887C]" />
          <h3 className="text-lg font-semibold text-gray-900">Departments</h3>
          {!loading && departments.length > 0 && (
            <span className="text-sm text-gray-500">({departments.length})</span>
          )}
        </div>
        <div className="flex items-center gap-3 flex-1 max-w-md justify-end">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Search departments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 h-10 border-gray-300 focus:border-[#23887C] focus:ring-[#23887C] focus:ring-1 bg-white shadow-sm transition-all duration-200"
            />
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={handleAddDialogOpenChange}>
            <DialogTrigger asChild>
              <Button className="bg-[#23887C] hover:bg-[#23887C]/90 text-white whitespace-nowrap">
                <Plus className="h-4 w-4 mr-2" />
                Add Department
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  Add New Department
                </DialogTitle>
                <DialogDescription className="text-gray-500 pt-2">
                  Create a new department to organize your employees. Enter a name for the department below.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label 
                    htmlFor="department-name" 
                    className="text-sm font-medium text-gray-700 block"
                  >
                    Department Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="department-name"
                    type="text"
                    placeholder="e.g., Human Resources"
                    value={departmentName}
                    onChange={(e) => setDepartmentName(e.target.value)}
                    className="h-11 border-gray-300 focus:border-[#23887C] focus:ring-[#23887C] focus:ring-1 transition-all duration-200"
                    disabled={isSubmitting}
                    autoFocus
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    This name will be used to organize employees by department in your system.
                  </p>
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
                    disabled={!departmentName.trim() || isSubmitting}
                    className="bg-[#23887C] hover:bg-[#23887C]/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="mr-2">Adding...</span>
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </>
                    ) : (
                      <>
                        Add Department
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : filteredDepartments.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">
            {searchQuery ? 'No departments match your search' : 'No departments found'}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {searchQuery ? 'Try a different search term' : 'Get started by adding your first department'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDepartments.map((department: Department) => (
            <div
              key={department.id}
              className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-[#23887C]/30 hover:shadow-sm transition-all duration-200 group"
            >
              <div className="flex items-start gap-3 flex-1">
                <div className="p-2 bg-[#23887C]/10 rounded-lg group-hover:bg-[#23887C]/20 transition-colors">
                  <Building2 className="h-4 w-4 text-[#23887C]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{department.name || department.title}</p>
                  {department.description && (
                    <p className="text-sm text-gray-500 mt-1">{department.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {department.status && (
                  <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${
                    department.status === 'active' 
                      ? 'bg-green-100 text-green-700 border border-green-200' 
                      : 'bg-gray-100 text-gray-700 border border-gray-200'
                  }`}>
                    {department.status}
                  </span>
                )}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    onClick={() => handleEditClick(department)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDeleteClick(department)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={handleEditDialogOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              Edit Department
            </DialogTitle>
            <DialogDescription className="text-gray-500 pt-2">
              Update the department information below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <label 
                htmlFor="edit-department-name" 
                className="text-sm font-medium text-gray-700 block"
              >
                Department Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="edit-department-name"
                type="text"
                placeholder="e.g., Human Resources"
                value={departmentName}
                onChange={(e) => setDepartmentName(e.target.value)}
                className="h-11 border-gray-300 focus:border-[#23887C] focus:ring-[#23887C] focus:ring-1 transition-all duration-200"
                disabled={isSubmitting}
                autoFocus
                required
              />
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
                disabled={!departmentName.trim() || isSubmitting}
                className="bg-[#23887C] hover:bg-[#23887C]/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <span className="mr-2">Updating...</span>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </>
                ) : (
                  <>
                    Update Department
                  </>
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
              Delete Department
            </DialogTitle>
            <DialogDescription className="text-gray-500 pt-2">
              Are you sure you want to delete this department? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deletingDepartment && (
            <div className="py-4">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="font-medium text-gray-900">{deletingDepartment.name || deletingDepartment.title}</p>
                {deletingDepartment.description && (
                  <p className="text-sm text-gray-500 mt-1">{deletingDepartment.description}</p>
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
                  Delete Department
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

