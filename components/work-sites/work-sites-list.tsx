'use client'

import { useState } from 'react'
import { useWorkSites, WorkSite } from '@/lib/hooks/useWorkSites'
import { Skeleton } from '@/components/ui/skeleton'
import { Building2, Plus, Edit2, Trash2, MapPin, AlertTriangle } from 'lucide-react'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { format } from 'date-fns'

const getInitials = (name: string, shortHand?: string): string => {
  if (shortHand && shortHand.trim()) {
    return shortHand.trim().toUpperCase()
  }
  const words = name.trim().split(' ')
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

const getColorForInitials = (initials: string): { bg: string; text: string } => {
  const colors = [
    { bg: 'bg-blue-500', text: 'text-white' },
    { bg: 'bg-green-500', text: 'text-white' },
    { bg: 'bg-purple-500', text: 'text-white' },
    { bg: 'bg-orange-500', text: 'text-white' },
    { bg: 'bg-pink-500', text: 'text-white' },
    { bg: 'bg-indigo-500', text: 'text-white' },
    { bg: 'bg-teal-500', text: 'text-white' },
    { bg: 'bg-red-500', text: 'text-white' },
  ]
  const index = initials.charCodeAt(0) % colors.length
  return colors[index]
}

export function WorkSitesList() {
  const { workSites, loading, createWorkSite, updateWorkSite, deleteWorkSite } = useWorkSites()
  
  // Dialog state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  
  // Form state
  const [siteName, setSiteName] = useState('')
  const [location, setLocation] = useState('')
  const [shortHand, setShortHand] = useState('')
  const [status, setStatus] = useState<string>('active')
  const [editingWorkSite, setEditingWorkSite] = useState<WorkSite | null>(null)
  const [deletingWorkSite, setDeletingWorkSite] = useState<WorkSite | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!siteName.trim() || !location.trim()) {
      return
    }

    setIsSubmitting(true)
    try {
      await createWorkSite(siteName, location, status, shortHand || undefined)
      
      // Reset form and close dialog
      setSiteName('')
      setLocation('')
      setShortHand('')
      setStatus('active')
      setIsAddDialogOpen(false)
    } catch (error) {
      console.error('Error adding work site:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to add work site. Please try again.'
      alert(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!siteName.trim() || !location.trim() || !editingWorkSite) {
      return
    }

    setIsSubmitting(true)
    try {
      await updateWorkSite(editingWorkSite.id, siteName, location, status, shortHand || undefined)
      
      // Reset form and close dialog
      setSiteName('')
      setLocation('')
      setShortHand('')
      setStatus('active')
      setEditingWorkSite(null)
      setIsEditDialogOpen(false)
    } catch (error) {
      console.error('Error updating work site:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to update work site. Please try again.'
      alert(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingWorkSite) return

    setIsSubmitting(true)
    try {
      await deleteWorkSite(deletingWorkSite.id)
      
      // Reset and close dialog
      setDeletingWorkSite(null)
      setIsDeleteDialogOpen(false)
    } catch (error) {
      console.error('Error deleting work site:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete work site. Please try again.'
      alert(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddDialogOpenChange = (open: boolean) => {
    setIsAddDialogOpen(open)
    if (!open) {
      setSiteName('')
      setLocation('')
      setShortHand('')
      setStatus('active')
    }
  }

  const handleEditClick = (workSite: WorkSite) => {
    setEditingWorkSite(workSite)
    setSiteName(workSite.name)
    setLocation(workSite.location)
    setShortHand(workSite.short_hand || '')
    setStatus(workSite.status)
    setIsEditDialogOpen(true)
  }

  const handleEditDialogOpenChange = (open: boolean) => {
    setIsEditDialogOpen(open)
    if (!open) {
      setSiteName('')
      setLocation('')
      setShortHand('')
      setStatus('active')
      setEditingWorkSite(null)
    }
  }

  const handleDeleteClick = (workSite: WorkSite) => {
    setDeletingWorkSite(workSite)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteDialogOpenChange = (open: boolean) => {
    setIsDeleteDialogOpen(open)
    if (!open) {
      setDeletingWorkSite(null)
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy')
    } catch {
      return 'N/A'
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-[#23887C] text-white'
      case 'completed':
        return 'bg-green-100 text-green-700 border border-green-200'
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-700 border border-yellow-200'
      case 'cancelled':
        return 'bg-red-100 text-red-700 border border-red-200'
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-200'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-gray-900">Work Sites</h1>
          <p className="text-gray-500">Manage project sites and locations</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={handleAddDialogOpenChange}>
          <DialogTrigger asChild>
            <Button className="bg-[#23887C] hover:bg-[#23887C]/90 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add Work Site
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                Add New Work Site
              </DialogTitle>
              <DialogDescription className="text-gray-500 pt-2">
                Create a new work site entry. Enter the site name and location below.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="space-y-2">
                <label 
                  htmlFor="site-name" 
                  className="text-sm font-medium text-gray-700 block"
                >
                  Site Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="site-name"
                  type="text"
                  placeholder="e.g., Paramount Residence"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  className="h-11 border-gray-300 focus:border-[#23887C] focus:ring-[#23887C] focus:ring-1 transition-all duration-200"
                  disabled={isSubmitting}
                  autoFocus
                  required
                />
              </div>
              <div className="space-y-2">
                <label 
                  htmlFor="location" 
                  className="text-sm font-medium text-gray-700 block"
                >
                  Location <span className="text-red-500">*</span>
                </label>
                <Input
                  id="location"
                  type="text"
                  placeholder="e.g., Mumbai"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="h-11 border-gray-300 focus:border-[#23887C] focus:ring-[#23887C] focus:ring-1 transition-all duration-200"
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div className="space-y-2">
                <label 
                  htmlFor="short-hand" 
                  className="text-sm font-medium text-gray-700 block"
                >
                  Short Hand <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <Input
                  id="short-hand"
                  type="text"
                  placeholder="e.g., MVP, TH"
                  value={shortHand}
                  onChange={(e) => setShortHand(e.target.value)}
                  className="h-11 border-gray-300 focus:border-[#23887C] focus:ring-[#23887C] focus:ring-1 transition-all duration-200"
                  disabled={isSubmitting}
                  maxLength={10}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Short abbreviation for the project name (max 10 characters)
                </p>
              </div>
              <div className="space-y-2">
                <label 
                  htmlFor="status" 
                  className="text-sm font-medium text-gray-700 block"
                >
                  Status <span className="text-red-500">*</span>
                </label>
                <Select value={status} onValueChange={setStatus} disabled={isSubmitting}>
                  <SelectTrigger className="h-11 border-gray-300 focus:border-[#23887C] focus:ring-[#23887C] focus:ring-1">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
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
                  disabled={!siteName.trim() || !location.trim() || isSubmitting}
                  className="bg-[#23887C] hover:bg-[#23887C]/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <span className="mr-2">Adding...</span>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </>
                  ) : (
                    <>
                      Add Work Site
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      ) : workSites.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-lg">
          <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 font-medium text-lg">No work sites found</p>
          <p className="text-sm text-gray-400 mt-2">Get started by adding your first work site</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workSites.map((workSite: WorkSite) => {
            const initials = getInitials(workSite.name, workSite.short_hand)
            const colorClasses = getColorForInitials(initials)
            
            return (
              <div
                key={workSite.id}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all duration-200 relative group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`${colorClasses.bg} ${colorClasses.text} h-14 w-14 rounded-lg flex items-center justify-center font-semibold text-lg flex-shrink-0`}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-lg leading-tight">
                        {workSite.name}
                      </h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      onClick={() => handleEditClick(workSite)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDeleteClick(workSite)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-gray-600 mb-4">
                  <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <span className="text-sm">{workSite.location}</span>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${getStatusBadgeColor(workSite.status)}`}>
                    {workSite.status.charAt(0).toUpperCase() + workSite.status.slice(1)}
                  </span>
                  <span className="text-xs text-gray-400">
                    Created {formatDate(workSite.created_at)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={handleEditDialogOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              Edit Work Site
            </DialogTitle>
            <DialogDescription className="text-gray-500 pt-2">
              Update the work site information below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <label 
                htmlFor="edit-site-name" 
                className="text-sm font-medium text-gray-700 block"
              >
                Site Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="edit-site-name"
                type="text"
                placeholder="e.g., Paramount Residence"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                className="h-11 border-gray-300 focus:border-[#23887C] focus:ring-[#23887C] focus:ring-1 transition-all duration-200"
                disabled={isSubmitting}
                autoFocus
                required
              />
            </div>
            <div className="space-y-2">
              <label 
                htmlFor="edit-location" 
                className="text-sm font-medium text-gray-700 block"
              >
                Location <span className="text-red-500">*</span>
              </label>
              <Input
                id="edit-location"
                type="text"
                placeholder="e.g., Mumbai"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="h-11 border-gray-300 focus:border-[#23887C] focus:ring-[#23887C] focus:ring-1 transition-all duration-200"
                disabled={isSubmitting}
                required
              />
            </div>
            <div className="space-y-2">
              <label 
                htmlFor="edit-short-hand" 
                className="text-sm font-medium text-gray-700 block"
              >
                Short Hand <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <Input
                id="edit-short-hand"
                type="text"
                placeholder="e.g., MVP, TH"
                value={shortHand}
                onChange={(e) => setShortHand(e.target.value)}
                className="h-11 border-gray-300 focus:border-[#23887C] focus:ring-[#23887C] focus:ring-1 transition-all duration-200"
                disabled={isSubmitting}
                maxLength={10}
              />
              <p className="text-xs text-gray-400 mt-1">
                Short abbreviation for the project name (max 10 characters)
              </p>
            </div>
            <div className="space-y-2">
              <label 
                htmlFor="edit-status" 
                className="text-sm font-medium text-gray-700 block"
              >
                Status <span className="text-red-500">*</span>
              </label>
              <Select value={status} onValueChange={setStatus} disabled={isSubmitting}>
                <SelectTrigger className="h-11 border-gray-300 focus:border-[#23887C] focus:ring-[#23887C] focus:ring-1">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
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
                disabled={!siteName.trim() || !location.trim() || isSubmitting}
                className="bg-[#23887C] hover:bg-[#23887C]/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <span className="mr-2">Updating...</span>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </>
                ) : (
                  <>
                    Update Work Site
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
              Delete Work Site
            </DialogTitle>
            <DialogDescription className="text-gray-500 pt-2">
              Are you sure you want to delete this work site? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deletingWorkSite && (
            <div className="py-4">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="font-medium text-gray-900">{deletingWorkSite.name}</p>
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {deletingWorkSite.location}
                </p>
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
                  Delete Work Site
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

