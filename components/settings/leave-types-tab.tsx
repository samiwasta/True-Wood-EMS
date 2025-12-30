'use client'

import { useState } from 'react'
import { useLeaveTypes } from '@/lib/hooks/useLeaveTypes'
import { Skeleton } from '@/components/ui/skeleton'
import { LeaveType } from '@/lib/models/settings.model'
import { Calendar, Plus, Edit2, Trash2, AlertTriangle } from 'lucide-react'
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

export function LeaveTypesTab() {
  const { leaveTypes, loading, createLeaveType, updateLeaveType, deleteLeaveType } = useLeaveTypes()
  
  // Add dialog state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  
  // Form state
  const [leaveTypeName, setLeaveTypeName] = useState('')
  const [leaveTypeDescription, setLeaveTypeDescription] = useState('')
  const [maxDays, setMaxDays] = useState<string>('')
  const [isPaid, setIsPaid] = useState<string>('paid') // Default to 'paid'
  const [editingLeaveType, setEditingLeaveType] = useState<LeaveType | null>(null)
  const [deletingLeaveType, setDeletingLeaveType] = useState<LeaveType | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!leaveTypeName.trim()) {
      return
    }

    setIsSubmitting(true)
    try {
      const maxDaysNum = maxDays.trim() ? parseInt(maxDays, 10) : undefined
      const isPaidBool = isPaid === 'paid'
      await createLeaveType(leaveTypeName, leaveTypeDescription, maxDaysNum, isPaidBool)
      
      // Reset form and close dialog
      setLeaveTypeName('')
      setLeaveTypeDescription('')
      setMaxDays('')
      setIsPaid('paid')
      setIsAddDialogOpen(false)
    } catch (error) {
      console.error('Error adding leave type:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to add leave type. Please try again.'
      alert(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!leaveTypeName.trim() || !editingLeaveType) {
      return
    }

    setIsSubmitting(true)
    try {
      const descriptionToUpdate = leaveTypeDescription.trim() || undefined
      const maxDaysNum = maxDays.trim() ? parseInt(maxDays, 10) : undefined
      const isPaidBool = isPaid === 'paid'
      await updateLeaveType(editingLeaveType.id, leaveTypeName, descriptionToUpdate, maxDaysNum, isPaidBool)
      
      // Reset form and close dialog
      setLeaveTypeName('')
      setLeaveTypeDescription('')
      setMaxDays('')
      setIsPaid('paid')
      setEditingLeaveType(null)
      setIsEditDialogOpen(false)
    } catch (error) {
      console.error('Error updating leave type:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to update leave type. Please try again.'
      alert(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingLeaveType) return

    setIsSubmitting(true)
    try {
      await deleteLeaveType(deletingLeaveType.id)
      
      // Reset and close dialog
      setDeletingLeaveType(null)
      setIsDeleteDialogOpen(false)
    } catch (error) {
      console.error('Error deleting leave type:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete leave type. Please try again.'
      alert(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddDialogOpenChange = (open: boolean) => {
    setIsAddDialogOpen(open)
    if (!open) {
      setLeaveTypeName('')
      setLeaveTypeDescription('')
      setMaxDays('')
      setIsPaid('paid')
    }
  }

  const handleEditClick = (leaveType: LeaveType) => {
    setEditingLeaveType(leaveType)
    setLeaveTypeName(leaveType.name || leaveType.title || '')
    setLeaveTypeDescription(leaveType.description || '')
    setMaxDays(leaveType.max_days?.toString() || '')
    setIsPaid(leaveType.is_paid === true ? 'paid' : leaveType.is_paid === false ? 'unpaid' : 'paid')
    setIsEditDialogOpen(true)
  }

  const handleEditDialogOpenChange = (open: boolean) => {
    setIsEditDialogOpen(open)
    if (!open) {
      setLeaveTypeName('')
      setLeaveTypeDescription('')
      setMaxDays('')
      setIsPaid('paid')
      setEditingLeaveType(null)
    }
  }

  const handleDeleteClick = (leaveType: LeaveType) => {
    setDeletingLeaveType(leaveType)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteDialogOpenChange = (open: boolean) => {
    setIsDeleteDialogOpen(open)
    if (!open) {
      setDeletingLeaveType(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-[#23887C]" />
          <h3 className="text-lg font-semibold text-gray-900">Leave Types</h3>
          {!loading && leaveTypes.length > 0 && (
            <span className="text-sm text-gray-500">({leaveTypes.length})</span>
          )}
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={handleAddDialogOpenChange}>
          <DialogTrigger asChild>
            <Button className="bg-[#23887C] hover:bg-[#23887C]/90 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add Leave Type
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                Add New Leave Type
              </DialogTitle>
              <DialogDescription className="text-gray-500 pt-2">
                Create a new leave type to categorize employee leaves. Enter the details below.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="space-y-2">
                <label 
                  htmlFor="leave-type-name" 
                  className="text-sm font-medium text-gray-700 block"
                >
                  Leave Type Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="leave-type-name"
                  type="text"
                  placeholder="e.g., Sick Leave, Annual Leave"
                  value={leaveTypeName}
                  onChange={(e) => setLeaveTypeName(e.target.value)}
                  className="h-11 border-gray-300 focus:border-[#23887C] focus:ring-[#23887C] focus:ring-1 transition-all duration-200"
                  disabled={isSubmitting}
                  autoFocus
                  required
                />
              </div>
              <div className="space-y-2">
                <label 
                  htmlFor="max-days" 
                  className="text-sm font-medium text-gray-700 block"
                >
                  Maximum Days (Optional)
                </label>
                <Input
                  id="max-days"
                  type="number"
                  min="0"
                  placeholder="e.g., 10"
                  value={maxDays}
                  onChange={(e) => setMaxDays(e.target.value)}
                  className="h-11 border-gray-300 focus:border-[#23887C] focus:ring-[#23887C] focus:ring-1 transition-all duration-200"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Maximum number of days allowed for this leave type per year.
                </p>
              </div>
              <div className="space-y-2">
                <label 
                  htmlFor="is-paid" 
                  className="text-sm font-medium text-gray-700 block"
                >
                  Leave Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="is-paid"
                  value={isPaid}
                  onChange={(e) => setIsPaid(e.target.value)}
                  className="h-11 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#23887C] focus:ring-[#23887C] focus:ring-1 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                  required
                >
                  <option value="paid">Paid Leave</option>
                  <option value="unpaid">Unpaid Leave</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Select whether this leave type is paid or unpaid.
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
                  disabled={!leaveTypeName.trim() || isSubmitting}
                  className="bg-[#23887C] hover:bg-[#23887C]/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <span className="mr-2">Adding...</span>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </>
                  ) : (
                    <>
                      Add Leave Type
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : leaveTypes.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No leave types found</p>
          <p className="text-sm text-gray-400 mt-1">Get started by adding your first leave type</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaveTypes.map((leaveType: LeaveType) => (
            <div
              key={leaveType.id}
              className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-[#23887C]/30 hover:shadow-sm transition-all duration-200 group"
            >
              <div className="flex items-start gap-3 flex-1">
                <div className="p-2 bg-[#23887C]/10 rounded-lg group-hover:bg-[#23887C]/20 transition-colors">
                  <Calendar className="h-4 w-4 text-[#23887C]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-900">{leaveType.name || leaveType.title}</p>
                    {leaveType.is_paid !== undefined && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        leaveType.is_paid 
                          ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                          : 'bg-orange-100 text-orange-700 border border-orange-200'
                      }`}>
                        {leaveType.is_paid ? 'Paid' : 'Unpaid'}
                      </span>
                    )}
                  </div>
                  {leaveType.description && (
                    <p className="text-sm text-gray-500 mt-1">{leaveType.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5">
                    {leaveType.max_days && (
                      <p className="text-xs text-gray-400 font-medium">Max days: {leaveType.max_days}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {leaveType.status && (
                  <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${
                    leaveType.status === 'active' 
                      ? 'bg-green-100 text-green-700 border border-green-200' 
                      : 'bg-gray-100 text-gray-700 border border-gray-200'
                  }`}>
                    {leaveType.status}
                  </span>
                )}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    onClick={() => handleEditClick(leaveType)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDeleteClick(leaveType)}
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
              Edit Leave Type
            </DialogTitle>
            <DialogDescription className="text-gray-500 pt-2">
              Update the leave type information below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <label 
                htmlFor="edit-leave-type-name" 
                className="text-sm font-medium text-gray-700 block"
              >
                Leave Type Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="edit-leave-type-name"
                type="text"
                placeholder="e.g., Sick Leave, Annual Leave"
                value={leaveTypeName}
                onChange={(e) => setLeaveTypeName(e.target.value)}
                className="h-11 border-gray-300 focus:border-[#23887C] focus:ring-[#23887C] focus:ring-1 transition-all duration-200"
                disabled={isSubmitting}
                autoFocus
                required
              />
            </div>
            <div className="space-y-2">
              <label 
                htmlFor="edit-max-days" 
                className="text-sm font-medium text-gray-700 block"
              >
                Maximum Days (Optional)
              </label>
              <Input
                id="edit-max-days"
                type="number"
                min="0"
                placeholder="e.g., 10"
                value={maxDays}
                onChange={(e) => setMaxDays(e.target.value)}
                className="h-11 border-gray-300 focus:border-[#23887C] focus:ring-[#23887C] focus:ring-1 transition-all duration-200"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <label 
                htmlFor="edit-is-paid" 
                className="text-sm font-medium text-gray-700 block"
              >
                Leave Type <span className="text-red-500">*</span>
              </label>
              <select
                id="edit-is-paid"
                value={isPaid}
                onChange={(e) => setIsPaid(e.target.value)}
                className="h-11 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-[#23887C] focus:ring-[#23887C] focus:ring-1 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
                required
              >
                <option value="paid">Paid Leave</option>
                <option value="unpaid">Unpaid Leave</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">
                Select whether this leave type is paid or unpaid.
              </p>
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
                disabled={!leaveTypeName.trim() || isSubmitting}
                className="bg-[#23887C] hover:bg-[#23887C]/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <span className="mr-2">Updating...</span>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </>
                ) : (
                  <>
                    Update Leave Type
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
              Delete Leave Type
            </DialogTitle>
            <DialogDescription className="text-gray-500 pt-2">
              Are you sure you want to delete this leave type? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deletingLeaveType && (
            <div className="py-4">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-gray-900">{deletingLeaveType.name || deletingLeaveType.title}</p>
                  {deletingLeaveType.is_paid !== undefined && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      deletingLeaveType.is_paid 
                        ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                        : 'bg-orange-100 text-orange-700 border border-orange-200'
                    }`}>
                      {deletingLeaveType.is_paid ? 'Paid' : 'Unpaid'}
                    </span>
                  )}
                </div>
                {deletingLeaveType.description && (
                  <p className="text-sm text-gray-500 mt-1">{deletingLeaveType.description}</p>
                )}
                {deletingLeaveType.max_days && (
                  <p className="text-xs text-gray-400 font-medium mt-1.5">Max days: {deletingLeaveType.max_days}</p>
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
                  Delete Leave Type
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

