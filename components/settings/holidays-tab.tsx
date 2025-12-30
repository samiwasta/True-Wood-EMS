'use client'

import { useState, useEffect, useRef } from 'react'
import { useHolidays } from '@/lib/hooks/useHolidays'
import { Skeleton } from '@/components/ui/skeleton'
import { Holiday } from '@/lib/models/settings.model'
import { CalendarDays, Plus, Edit2, Trash2, AlertTriangle, CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { format } from 'date-fns'

export function HolidaysTab() {
  const { holidays, loading, createHoliday, updateHoliday, deleteHoliday } = useHolidays()
  
  // Get current year
  const currentYear = new Date().getFullYear()
  
  // Dialog state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  
  // Form state
  const [holidayName, setHolidayName] = useState('')
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null)
  const [deletingHoliday, setDeletingHoliday] = useState<Holiday | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showStartCalendar, setShowStartCalendar] = useState(false)
  const [showEndCalendar, setShowEndCalendar] = useState(false)
  const startCalendarRef = useRef<HTMLDivElement>(null)
  const endCalendarRef = useRef<HTMLDivElement>(null)

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (startCalendarRef.current && !startCalendarRef.current.contains(event.target as Node)) {
        setShowStartCalendar(false)
      }
      if (endCalendarRef.current && !endCalendarRef.current.contains(event.target as Node)) {
        setShowEndCalendar(false)
      }
    }

    if (showStartCalendar || showEndCalendar) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showStartCalendar, showEndCalendar])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const formatDateRange = (startDateString: string, endDateString: string) => {
    const start = new Date(startDateString)
    const end = new Date(endDateString)
    
    if (startDateString === endDateString) {
      return formatDate(startDateString)
    }
    
    return `${formatDate(startDateString)} - ${formatDate(endDateString)}`
  }

  const isUpcoming = (startDateString: string) => {
    const date = new Date(startDateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date >= today
  }

  const formatDateForDB = (date: Date | undefined): string => {
    if (!date) return ''
    return format(date, 'yyyy-MM-dd')
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!holidayName.trim() || !startDate || !endDate) {
      return
    }

    setIsSubmitting(true)
    try {
      const startDateStr = formatDateForDB(startDate)
      const endDateStr = formatDateForDB(endDate)
      await createHoliday(holidayName, startDateStr, endDateStr)
      
      // Reset form and close dialog
      setHolidayName('')
      setStartDate(undefined)
      setEndDate(undefined)
      setIsAddDialogOpen(false)
    } catch (error) {
      console.error('Error adding holiday:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to add holiday. Please try again.'
      alert(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!holidayName.trim() || !startDate || !endDate || !editingHoliday) {
      return
    }

    setIsSubmitting(true)
    try {
      const startDateStr = formatDateForDB(startDate)
      const endDateStr = formatDateForDB(endDate)
      await updateHoliday(editingHoliday.id, holidayName, startDateStr, endDateStr)
      
      // Reset form and close dialog
      setHolidayName('')
      setStartDate(undefined)
      setEndDate(undefined)
      setEditingHoliday(null)
      setIsEditDialogOpen(false)
    } catch (error) {
      console.error('Error updating holiday:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to update holiday. Please try again.'
      alert(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingHoliday) return

    setIsSubmitting(true)
    try {
      await deleteHoliday(deletingHoliday.id)
      
      // Reset and close dialog
      setDeletingHoliday(null)
      setIsDeleteDialogOpen(false)
    } catch (error) {
      console.error('Error deleting holiday:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete holiday. Please try again.'
      alert(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddDialogOpenChange = (open: boolean) => {
    setIsAddDialogOpen(open)
    if (!open) {
      setHolidayName('')
      setStartDate(undefined)
      setEndDate(undefined)
      setShowStartCalendar(false)
      setShowEndCalendar(false)
    }
  }

  const handleEditClick = (holiday: Holiday) => {
    setEditingHoliday(holiday)
    setHolidayName(holiday.name || holiday.title || '')
    setStartDate(holiday.start_date ? new Date(holiday.start_date) : undefined)
    setEndDate(holiday.end_date ? new Date(holiday.end_date) : undefined)
    setIsEditDialogOpen(true)
  }

  const handleEditDialogOpenChange = (open: boolean) => {
    setIsEditDialogOpen(open)
    if (!open) {
      setHolidayName('')
      setStartDate(undefined)
      setEndDate(undefined)
      setEditingHoliday(null)
      setShowStartCalendar(false)
      setShowEndCalendar(false)
    }
  }

  const handleDeleteClick = (holiday: Holiday) => {
    setDeletingHoliday(holiday)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteDialogOpenChange = (open: boolean) => {
    setIsDeleteDialogOpen(open)
    if (!open) {
      setDeletingHoliday(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-[#23887C]" />
          <h3 className="text-lg font-semibold text-gray-900">Holidays</h3>
          {!loading && holidays.length > 0 && (
            <span className="text-sm text-gray-500">({holidays.length})</span>
          )}
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={handleAddDialogOpenChange}>
          <DialogTrigger asChild>
            <Button className="bg-[#23887C] hover:bg-[#23887C]/90 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add Holiday
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                Add New Holiday
              </DialogTitle>
              <DialogDescription className="text-gray-500 pt-2">
                Create a new holiday entry. Enter the holiday name and date range below.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="space-y-2">
                <label 
                  htmlFor="holiday-name" 
                  className="text-sm font-medium text-gray-700 block"
                >
                  Holiday Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="holiday-name"
                  type="text"
                  placeholder="e.g., New Year's Day"
                  value={holidayName}
                  onChange={(e) => setHolidayName(e.target.value)}
                  className="h-11 border-gray-300 focus:border-[#23887C] focus:ring-[#23887C] focus:ring-1 transition-all duration-200"
                  disabled={isSubmitting}
                  autoFocus
                  required
                />
              </div>
              <div className="space-y-2">
                <label 
                  htmlFor="start-date-input"
                  className="text-sm font-medium text-gray-700 block"
                >
                  Start Date <span className="text-red-500">*</span>
                </label>
                <div className="relative" ref={startCalendarRef}>
                  <Input
                    id="start-date-input"
                    type="text"
                    placeholder="Select start date"
                    value={startDate ? format(startDate, 'PPP') : ''}
                    readOnly
                    onClick={() => setShowStartCalendar(!showStartCalendar)}
                    className="h-11 border-gray-300 focus:border-[#23887C] focus:ring-[#23887C] focus:ring-1 transition-all duration-200 cursor-pointer pr-10"
                    disabled={isSubmitting}
                    required
                  />
                  <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  {showStartCalendar && (
                    <div className="absolute z-10 mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-3">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => {
                          setStartDate(date)
                          setShowStartCalendar(false)
                        }}
                        disabled={isSubmitting}
                        captionLayout="dropdown"
                        fromYear={currentYear}
                        toYear={2100}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <label 
                  htmlFor="end-date-input"
                  className="text-sm font-medium text-gray-700 block"
                >
                  End Date <span className="text-red-500">*</span>
                </label>
                <div className="relative" ref={endCalendarRef}>
                  <Input
                    id="end-date-input"
                    type="text"
                    placeholder="Select end date"
                    value={endDate ? format(endDate, 'PPP') : ''}
                    readOnly
                    onClick={() => !startDate ? alert('Please select start date first') : setShowEndCalendar(!showEndCalendar)}
                    className="h-11 border-gray-300 focus:border-[#23887C] focus:ring-[#23887C] focus:ring-1 transition-all duration-200 cursor-pointer pr-10"
                    disabled={isSubmitting || !startDate}
                    required
                  />
                  <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  {showEndCalendar && startDate && (
                    <div className="absolute z-10 mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-3">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={(date) => {
                          setEndDate(date)
                          setShowEndCalendar(false)
                        }}
                        disabled={(date) => isSubmitting || (startDate ? date < startDate : false)}
                        captionLayout="dropdown"
                        fromYear={1900}
                        toYear={2100}
                      />
                    </div>
                  )}
                </div>
                {startDate && endDate && startDate > endDate && (
                  <p className="text-xs text-red-500 mt-1">
                    End date must be after or equal to start date
                  </p>
                )}
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
                  disabled={!holidayName.trim() || !startDate || !endDate || isSubmitting || (startDate && endDate && startDate > endDate)}
                  className="bg-[#23887C] hover:bg-[#23887C]/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <span className="mr-2">Adding...</span>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </>
                  ) : (
                    <>
                      Add Holiday
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
      ) : holidays.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
          <CalendarDays className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No holidays found</p>
          <p className="text-sm text-gray-400 mt-1">Get started by adding your first holiday</p>
        </div>
      ) : (
        <div className="space-y-3">
          {holidays.map((holiday: Holiday) => (
            <div
              key={holiday.id}
              className={`flex items-center justify-between p-4 bg-white border rounded-lg hover:shadow-sm transition-all duration-200 group ${
                isUpcoming(holiday.start_date) 
                  ? 'border-blue-300 bg-blue-50/50' 
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-start gap-3 flex-1">
                <div className={`p-2 rounded-lg transition-colors ${
                  isUpcoming(holiday.start_date)
                    ? 'bg-blue-100 group-hover:bg-blue-200'
                    : 'bg-gray-100'
                }`}>
                  <CalendarDays className={`h-4 w-4 ${
                    isUpcoming(holiday.start_date) ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{holiday.name || holiday.title}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatDateRange(holiday.start_date, holiday.end_date)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {isUpcoming(holiday.start_date) && (
                  <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                    Upcoming
                  </span>
                )}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    onClick={() => handleEditClick(holiday)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDeleteClick(holiday)}
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
              Edit Holiday
            </DialogTitle>
            <DialogDescription className="text-gray-500 pt-2">
              Update the holiday information below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <label 
                htmlFor="edit-holiday-name" 
                className="text-sm font-medium text-gray-700 block"
              >
                Holiday Name <span className="text-red-500">*</span>
              </label>
              <Input
                id="edit-holiday-name"
                type="text"
                placeholder="e.g., New Year's Day"
                value={holidayName}
                onChange={(e) => setHolidayName(e.target.value)}
                className="h-11 border-gray-300 focus:border-[#23887C] focus:ring-[#23887C] focus:ring-1 transition-all duration-200"
                disabled={isSubmitting}
                autoFocus
                required
              />
            </div>
            <div className="space-y-2">
              <label 
                htmlFor="edit-start-date-input"
                className="text-sm font-medium text-gray-700 block"
              >
                Start Date <span className="text-red-500">*</span>
              </label>
              <div className="relative" ref={startCalendarRef}>
                <Input
                  id="edit-start-date-input"
                  type="text"
                  placeholder="Select start date"
                  value={startDate ? format(startDate, 'PPP') : ''}
                  readOnly
                  onClick={() => setShowStartCalendar(!showStartCalendar)}
                  className="h-11 border-gray-300 focus:border-[#23887C] focus:ring-[#23887C] focus:ring-1 transition-all duration-200 cursor-pointer pr-10"
                  disabled={isSubmitting}
                  required
                />
                <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                {showStartCalendar && (
                  <div className="absolute z-10 mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-3">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => {
                        setStartDate(date)
                        setShowStartCalendar(false)
                      }}
                      disabled={isSubmitting}
                      captionLayout="dropdown"
                      fromYear={1900}
                      toYear={2100}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label 
                htmlFor="edit-end-date-input"
                className="text-sm font-medium text-gray-700 block"
              >
                End Date <span className="text-red-500">*</span>
              </label>
              <div className="relative" ref={endCalendarRef}>
                <Input
                  id="edit-end-date-input"
                  type="text"
                  placeholder="Select end date"
                  value={endDate ? format(endDate, 'PPP') : ''}
                  readOnly
                  onClick={() => !startDate ? alert('Please select start date first') : setShowEndCalendar(!showEndCalendar)}
                  className="h-11 border-gray-300 focus:border-[#23887C] focus:ring-[#23887C] focus:ring-1 transition-all duration-200 cursor-pointer pr-10"
                  disabled={isSubmitting || !startDate}
                  required
                />
                <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                {showEndCalendar && startDate && (
                  <div className="absolute z-10 mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-3">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => {
                        setEndDate(date)
                        setShowEndCalendar(false)
                      }}
                      disabled={(date) => isSubmitting || (startDate ? date < startDate : false)}
                      captionLayout="dropdown"
                      fromYear={1900}
                      toYear={2100}
                    />
                  </div>
                )}
              </div>
              {startDate && endDate && startDate > endDate && (
                <p className="text-xs text-red-500 mt-1">
                  End date must be after or equal to start date
                </p>
              )}
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
                disabled={!holidayName.trim() || !startDate || !endDate || isSubmitting || (startDate && endDate && startDate > endDate)}
                className="bg-[#23887C] hover:bg-[#23887C]/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <span className="mr-2">Updating...</span>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </>
                ) : (
                  <>
                    Update Holiday
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
              Delete Holiday
            </DialogTitle>
            <DialogDescription className="text-gray-500 pt-2">
              Are you sure you want to delete this holiday? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deletingHoliday && (
            <div className="py-4">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="font-medium text-gray-900">{deletingHoliday.name || deletingHoliday.title}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {formatDateRange(deletingHoliday.start_date, deletingHoliday.end_date)}
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
                  Delete Holiday
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
