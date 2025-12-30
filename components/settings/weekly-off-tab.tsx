'use client'

import { useState, useEffect } from 'react'
import { useWeeklyOff } from '@/lib/hooks/useWeeklyOff'
import { Save, CalendarX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function WeeklyOffTab() {
  const { weeklyOff, saveWeeklyOff } = useWeeklyOff()
  const [selectedDay, setSelectedDay] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const dayOptions = [
    { value: '0', label: 'Sunday' },
    { value: '1', label: 'Monday' },
    { value: '2', label: 'Tuesday' },
    { value: '3', label: 'Wednesday' },
    { value: '4', label: 'Thursday' },
    { value: '5', label: 'Friday' },
    { value: '6', label: 'Saturday' },
  ]

  // Set initial selected day from existing weekly off data
  useEffect(() => {
    if (weeklyOff.length > 0 && !selectedDay) {
      const activeDay = weeklyOff.find(day => day.is_active)
      if (activeDay && activeDay.day_order !== undefined) {
        setSelectedDay(activeDay.day_order.toString())
      }
    }
  }, [weeklyOff, selectedDay])

  const handleSave = async () => {
    if (!selectedDay) {
      alert('Please select a day')
      return
    }

    setIsSubmitting(true)
    try {
      const dayOrder = parseInt(selectedDay, 10)
      await saveWeeklyOff(dayOrder)
      alert('Weekly off saved successfully!')
    } catch (error) {
      console.error('Error saving weekly off:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to save weekly off. Please try again.'
      alert(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start gap-2">
        <div className="flex items-center gap-2">
          <CalendarX className="h-5 w-5 text-[#23887C]" />
          <h3 className="text-lg font-semibold text-gray-900">Weekly Off</h3>
        </div>
        <p className="text-sm text-gray-500">
          Set the day that is off every week (displayed differently in reports).
        </p>
      </div>

      <div className="max-w-sm flex items-center gap-2">
        <Select
          value={selectedDay}
          onValueChange={(value) => setSelectedDay(value)}
        >
          <SelectTrigger className="w-full h-11">
            <SelectValue placeholder="Select a day" />
          </SelectTrigger>
          <SelectContent>
            {dayOptions.map((day) => (
              <SelectItem key={day.value} value={day.value}>
                {day.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleSave} disabled={isSubmitting} className="bg-[#23887C] hover:bg-[#23887C]/90 text-white disabled:opacity-50 disabled:cursor-not-allowed">
          {isSubmitting ? (
            <>
              <span className="mr-2">Saving...</span>
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save
            </>
          )}
        </Button>
      </div>
        
    </div>
  )
}

