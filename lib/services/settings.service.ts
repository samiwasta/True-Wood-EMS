import { supabase } from '@/lib/supabase'

export class SettingsService {
  static async getCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        console.error('Error fetching categories:', error)
        throw error
      }

      return data ?? []
    } catch (error) {
      console.error('Error fetching categories:', error)
      throw error
    }
  }

  static async createCategory(name: string, description?: string, timeIn?: string, timeOut?: string, breakHours?: number | string | null) {
    try {
      const trimmedName = name.trim()
      if (!trimmedName) {
        throw new Error('Category name is required')
      }

      // Build payload - only use columns that exist in the table
      const payload: Record<string, unknown> = {
        name: trimmedName,
      }

      if (description?.trim()) {
        payload.description = description.trim()
      }

      if (timeIn?.trim()) {
        payload.time_in = timeIn.trim()
      }

      if (timeOut?.trim()) {
        payload.time_out = timeOut.trim()
      }
      if (breakHours !== undefined && breakHours !== null && breakHours !== '') {
        const num = typeof breakHours === 'string' ? parseFloat(breakHours) : breakHours
        if (!Number.isNaN(num)) payload.break_hours = num
      }

      const { data, error } = await supabase
        .from('categories')
        .insert(payload)
        .select()
        .single()

      if (error) {
        // Log detailed error information
        const errorInfo = {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        }
        console.error('Error creating category:', errorInfo)
        console.error('Full error object:', error)
        console.error('Payload sent:', payload)
        
        // Create a more descriptive error message
        const errorMessage = error.message || error.details || 'Failed to create category'
        throw new Error(errorMessage)
      }

      return data
    } catch (error) {
      // Re-throw if it's already an Error with a message
      if (error instanceof Error) {
        throw error
      }
      // Otherwise create a new error
      const errorMessage = typeof error === 'string' ? error : 'Unknown error occurred'
      console.error('Error creating category:', errorMessage, error)
      throw new Error(errorMessage)
    }
  }

  static async updateCategory(id: string, name: string, description?: string, timeIn?: string, timeOut?: string, breakHours?: number | string | null) {
    try {
      const trimmedName = name.trim()
      if (!trimmedName) {
        throw new Error('Category name is required')
      }

      if (!id) {
        throw new Error('Category ID is required')
      }

      // Build update payload - only use columns that exist in the table
      // Only include description if it's provided (don't set to null to preserve existing)
      const payload: Record<string, unknown> = {
        name: trimmedName,
      }

      // Only include description if it's explicitly provided
      // If not provided, don't include it in the update (preserves existing value)
      if (description !== undefined) {
        payload.description = description?.trim() || null
      }

      if (timeIn !== undefined) {
        payload.time_in = timeIn?.trim() || null
      }

      if (timeOut !== undefined) {
        payload.time_out = timeOut?.trim() || null
      }
      if (breakHours !== undefined) {
        const num = typeof breakHours === 'string' ? parseFloat(breakHours) : breakHours
        payload.break_hours = num !== null && num !== undefined && !Number.isNaN(num) ? num : null
      }

      const { data, error } = await supabase
        .from('categories')
        .update(payload)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        const errorInfo = {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        }
        console.error('Error updating category:', errorInfo)
        console.error('Full error object:', error)
        console.error('Payload sent:', payload)
        console.error('Category ID:', id)
        
        const errorMessage = error.message || error.details || 'Failed to update category'
        throw new Error(errorMessage)
      }

      return data
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      const errorMessage = typeof error === 'string' ? error : 'Unknown error occurred'
      console.error('Error updating category:', errorMessage, error)
      throw new Error(errorMessage)
    }
  }

  static async deleteCategory(id: string) {
    try {
      if (!id) {
        throw new Error('Category ID is required')
      }

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)

      if (error) {
        const errorInfo = {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        }
        console.error('Error deleting category:', errorInfo)
        console.error('Full error object:', error)
        console.error('Category ID:', id)
        
        const errorMessage = error.message || error.details || 'Failed to delete category'
        throw new Error(errorMessage)
      }

      return true
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      const errorMessage = typeof error === 'string' ? error : 'Unknown error occurred'
      console.error('Error deleting category:', errorMessage, error)
      throw new Error(errorMessage)
    }
  }

  static async getDepartments() {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        console.error('Error fetching departments:', error)
        throw error
      }

      return data ?? []
    } catch (error) {
      console.error('Error fetching departments:', error)
      throw error
    }
  }

  static async createDepartment(name: string, description?: string) {
    try {
      const trimmedName = name.trim()
      if (!trimmedName) {
        throw new Error('Department name is required')
      }

      // Build payload - only use columns that exist in the table
      const payload: Record<string, unknown> = {
        name: trimmedName,
      }

      if (description?.trim()) {
        payload.description = description.trim()
      }

      const { data, error } = await supabase
        .from('departments')
        .insert(payload)
        .select()
        .single()

      if (error) {
        // Log detailed error information
        const errorInfo = {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        }
        console.error('Error creating department:', errorInfo)
        console.error('Full error object:', error)
        console.error('Payload sent:', payload)
        
        // Create a more descriptive error message
        const errorMessage = error.message || error.details || 'Failed to create department'
        throw new Error(errorMessage)
      }

      return data
    } catch (error) {
      // Re-throw if it's already an Error with a message
      if (error instanceof Error) {
        throw error
      }
      // Otherwise create a new error
      const errorMessage = typeof error === 'string' ? error : 'Unknown error occurred'
      console.error('Error creating department:', errorMessage, error)
      throw new Error(errorMessage)
    }
  }

  static async updateDepartment(id: string, name: string, description?: string) {
    try {
      const trimmedName = name.trim()
      if (!trimmedName) {
        throw new Error('Department name is required')
      }

      if (!id) {
        throw new Error('Department ID is required')
      }

      // Build update payload - only use columns that exist in the table
      // Only include description if it's provided (don't set to null to preserve existing)
      const payload: Record<string, unknown> = {
        name: trimmedName,
      }

      // Only include description if it's explicitly provided
      // If not provided, don't include it in the update (preserves existing value)
      if (description !== undefined) {
        payload.description = description?.trim() || null
      }

      const { data, error } = await supabase
        .from('departments')
        .update(payload)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        const errorInfo = {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        }
        console.error('Error updating department:', errorInfo)
        console.error('Full error object:', error)
        console.error('Payload sent:', payload)
        console.error('Department ID:', id)
        
        const errorMessage = error.message || error.details || 'Failed to update department'
        throw new Error(errorMessage)
      }

      return data
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      const errorMessage = typeof error === 'string' ? error : 'Unknown error occurred'
      console.error('Error updating department:', errorMessage, error)
      throw new Error(errorMessage)
    }
  }

  static async deleteDepartment(id: string) {
    try {
      if (!id) {
        throw new Error('Department ID is required')
      }

      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', id)

      if (error) {
        const errorInfo = {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        }
        console.error('Error deleting department:', errorInfo)
        console.error('Full error object:', error)
        console.error('Department ID:', id)
        
        const errorMessage = error.message || error.details || 'Failed to delete department'
        throw new Error(errorMessage)
      }

      return true
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      const errorMessage = typeof error === 'string' ? error : 'Unknown error occurred'
      console.error('Error deleting department:', errorMessage, error)
      throw new Error(errorMessage)
    }
  }

  static async getLeaveTypes() {
    try {
      const { data, error } = await supabase
        .from('leave_types')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        console.error('Error fetching leave types:', error)
        throw error
      }

      return data ?? []
    } catch (error) {
      console.error('Error fetching leave types:', error)
      throw error
    }
  }

  static async createLeaveType(name: string, description?: string, maxDays?: number, isPaid?: boolean) {
    try {
      const trimmedName = name.trim()
      if (!trimmedName) {
        throw new Error('Leave type name is required')
      }

      // Build payload - only use columns that exist in the table
      const payload: Record<string, unknown> = {
        name: trimmedName,
      }

      if (description?.trim()) {
        payload.description = description.trim()
      }

      if (maxDays !== undefined && maxDays !== null) {
        payload.max_days = maxDays
      }

      if (isPaid !== undefined) {
        payload.is_paid = isPaid
      }

      const { data, error } = await supabase
        .from('leave_types')
        .insert(payload)
        .select()
        .single()

      if (error) {
        // Log detailed error information
        const errorInfo = {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        }
        console.error('Error creating leave type:', errorInfo)
        console.error('Full error object:', error)
        console.error('Payload sent:', payload)
        
        // Create a more descriptive error message
        const errorMessage = error.message || error.details || 'Failed to create leave type'
        throw new Error(errorMessage)
      }

      return data
    } catch (error) {
      // Re-throw if it's already an Error with a message
      if (error instanceof Error) {
        throw error
      }
      // Otherwise create a new error
      const errorMessage = typeof error === 'string' ? error : 'Unknown error occurred'
      console.error('Error creating leave type:', errorMessage, error)
      throw new Error(errorMessage)
    }
  }

  static async updateLeaveType(id: string, name: string, description?: string, maxDays?: number, isPaid?: boolean) {
    try {
      const trimmedName = name.trim()
      if (!trimmedName) {
        throw new Error('Leave type name is required')
      }

      if (!id) {
        throw new Error('Leave type ID is required')
      }

      // Build update payload - only use columns that exist in the table
      const payload: Record<string, unknown> = {
        name: trimmedName,
      }

      // Only include description if it's explicitly provided
      if (description !== undefined) {
        payload.description = description?.trim() || null
      }

      // Only include max_days if it's explicitly provided
      if (maxDays !== undefined) {
        payload.max_days = maxDays || null
      }

      // Only include is_paid if it's explicitly provided
      if (isPaid !== undefined) {
        payload.is_paid = isPaid
      }

      const { data, error } = await supabase
        .from('leave_types')
        .update(payload)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        const errorInfo = {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        }
        console.error('Error updating leave type:', errorInfo)
        console.error('Full error object:', error)
        console.error('Payload sent:', payload)
        console.error('Leave type ID:', id)
        
        const errorMessage = error.message || error.details || 'Failed to update leave type'
        throw new Error(errorMessage)
      }

      return data
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      const errorMessage = typeof error === 'string' ? error : 'Unknown error occurred'
      console.error('Error updating leave type:', errorMessage, error)
      throw new Error(errorMessage)
    }
  }

  static async deleteLeaveType(id: string) {
    try {
      if (!id) {
        throw new Error('Leave type ID is required')
      }

      const { error } = await supabase
        .from('leave_types')
        .delete()
        .eq('id', id)

      if (error) {
        const errorInfo = {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        }
        console.error('Error deleting leave type:', errorInfo)
        console.error('Full error object:', error)
        console.error('Leave type ID:', id)
        
        const errorMessage = error.message || error.details || 'Failed to delete leave type'
        throw new Error(errorMessage)
      }

      return true
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      const errorMessage = typeof error === 'string' ? error : 'Unknown error occurred'
      console.error('Error deleting leave type:', errorMessage, error)
      throw new Error(errorMessage)
    }
  }

  static async getWeeklyOff() {
    try {
      const { data, error } = await supabase
        .from('weekly_off')
        .select('*')
        .order('day_order', { ascending: true })

      if (error) {
        console.error('Error fetching weekly off:', error)
        throw error
      }

      return data ?? []
    } catch (error) {
      console.error('Error fetching weekly off:', error)
      throw error
    }
  }

  static async saveWeeklyOff(dayOrder: number) {
    try {
      if (dayOrder < 0 || dayOrder > 6) {
        throw new Error('Invalid day order. Must be between 0 (Sunday) and 6 (Saturday)')
      }

      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

      // First, deactivate all existing weekly off days
      const { error: updateError } = await supabase
        .from('weekly_off')
        .update({ is_active: false })
        .eq('is_active', true)

      if (updateError) {
        const errorInfo = {
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
          code: updateError.code,
        }
        console.error('Error deactivating existing weekly off:', errorInfo)
        // Don't throw here, continue with the save operation
      }

      // Check if this day already exists
      const { data: existing, error: checkError } = await supabase
        .from('weekly_off')
        .select('*')
        .eq('day_order', dayOrder)
        .maybeSingle()

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is fine
        const errorInfo = {
          message: checkError.message,
          details: checkError.details,
          hint: checkError.hint,
          code: checkError.code,
        }
        console.error('Error checking existing weekly off:', errorInfo)
        // Continue anyway, we'll try to insert
      }

      let result
      if (existing) {
        // Update existing record
        const { data, error } = await supabase
          .from('weekly_off')
          .update({
            is_active: true,
            day_order: dayOrder,
            day_name: dayNames[dayOrder],
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single()

        if (error) {
          const errorInfo = {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          }
          console.error('Error updating weekly off:', errorInfo)
          console.error('Full error object:', error)
          console.error('Existing record:', existing)
          throw new Error(error.message || error.details || 'Failed to update weekly off')
        }
        result = data
      } else {
        // Create new record
        const payload = {
          day_order: dayOrder,
          day_name: dayNames[dayOrder],
          is_active: true,
        }

        const { data, error } = await supabase
          .from('weekly_off')
          .insert(payload)
          .select()
          .single()

        if (error) {
          const errorInfo = {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          }
          console.error('Error creating weekly off:', errorInfo)
          console.error('Full error object:', error)
          console.error('Payload sent:', payload)
          throw new Error(error.message || error.details || 'Failed to create weekly off')
        }
        result = data
      }

      return result
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error saving weekly off:', error.message, error)
        throw error
      }
      const errorMessage = typeof error === 'string' ? error : 'Unknown error occurred'
      console.error('Error saving weekly off:', errorMessage, error)
      throw new Error(errorMessage)
    }
  }

  static async getHolidays() {
    try {
      const { data, error } = await supabase
        .from('holidays')
        .select('*')
        .order('start_date', { ascending: true })

      if (error) {
        console.error('Error fetching holidays:', error)
        throw error
      }

      return data ?? []
    } catch (error) {
      console.error('Error fetching holidays:', error)
      throw error
    }
  }

  static async createHoliday(name: string, startDate: string, endDate: string) {
    try {
      const trimmedName = name.trim()
      if (!trimmedName) {
        throw new Error('Holiday name is required')
      }

      if (!startDate || !endDate) {
        throw new Error('Start date and end date are required')
      }

      const start = new Date(startDate)
      const end = new Date(endDate)

      if (start > end) {
        throw new Error('Start date must be before or equal to end date')
      }

      const payload = {
        name: trimmedName,
        start_date: startDate,
        end_date: endDate,
      }

      const { data, error } = await supabase
        .from('holidays')
        .insert(payload)
        .select()
        .single()

      if (error) {
        const errorInfo = {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        }
        console.error('Error creating holiday:', errorInfo)
        console.error('Full error object:', error)
        console.error('Payload sent:', payload)
        
        const errorMessage = error.message || error.details || 'Failed to create holiday'
        throw new Error(errorMessage)
      }

      return data
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      const errorMessage = typeof error === 'string' ? error : 'Unknown error occurred'
      console.error('Error creating holiday:', errorMessage, error)
      throw new Error(errorMessage)
    }
  }

  static async updateHoliday(id: string, name: string, startDate: string, endDate: string) {
    try {
      if (!id) {
        throw new Error('Holiday ID is required')
      }

      const trimmedName = name.trim()
      if (!trimmedName) {
        throw new Error('Holiday name is required')
      }

      if (!startDate || !endDate) {
        throw new Error('Start date and end date are required')
      }

      const start = new Date(startDate)
      const end = new Date(endDate)

      if (start > end) {
        throw new Error('Start date must be before or equal to end date')
      }

      const payload = {
        name: trimmedName,
        start_date: startDate,
        end_date: endDate,
      }

      const { data, error } = await supabase
        .from('holidays')
        .update(payload)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        const errorInfo = {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        }
        console.error('Error updating holiday:', errorInfo)
        console.error('Full error object:', error)
        console.error('Holiday ID:', id)
        console.error('Payload sent:', payload)
        
        const errorMessage = error.message || error.details || 'Failed to update holiday'
        throw new Error(errorMessage)
      }

      return data
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      const errorMessage = typeof error === 'string' ? error : 'Unknown error occurred'
      console.error('Error updating holiday:', errorMessage, error)
      throw new Error(errorMessage)
    }
  }

  static async deleteHoliday(id: string) {
    try {
      if (!id) {
        throw new Error('Holiday ID is required')
      }

      const { error } = await supabase
        .from('holidays')
        .delete()
        .eq('id', id)

      if (error) {
        const errorInfo = {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        }
        console.error('Error deleting holiday:', errorInfo)
        console.error('Full error object:', error)
        console.error('Holiday ID:', id)
        
        const errorMessage = error.message || error.details || 'Failed to delete holiday'
        throw new Error(errorMessage)
      }

      return true
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      const errorMessage = typeof error === 'string' ? error : 'Unknown error occurred'
      console.error('Error deleting holiday:', errorMessage, error)
      throw new Error(errorMessage)
    }
  }
}

