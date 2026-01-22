import { supabase } from '@/lib/supabase'

const generateShortHand = (name: string): string => {
  const words = name.trim().split(' ')
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

export class WorkSiteService {
  static async getActiveWorkSitesCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('work_sites')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

      if (error) {
        console.error('Error fetching active work sites count:', error)
        throw error
      }

      return count ?? 0
    } catch (error) {
      console.error('Error fetching active work sites count:', error)
      throw error
    }
  }

  static async getAllWorkSites() {
    try {
      const { data, error } = await supabase
        .from('work_sites')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching work sites:', error)
        throw error
      }

      return data ?? []
    } catch (error) {
      console.error('Error fetching work sites:', error)
      throw error
    }
  }

  static async createWorkSite(
    name: string, 
    location: string, 
    status: string = 'active', 
    shortHand?: string,
    startDate?: string,
    endDate?: string,
    timeIn?: string,
    timeOut?: string
  ) {
    try {
      const trimmedName = name.trim()
      const trimmedLocation = location.trim()
      const trimmedShortHand = shortHand?.trim()

      if (!trimmedName) {
        throw new Error('Work site name is required')
      }

      if (!trimmedLocation) {
        throw new Error('Location is required')
      }

      const payload: Record<string, unknown> = {
        name: trimmedName,
        location: trimmedLocation,
        status: status,
        short_hand: trimmedShortHand || generateShortHand(trimmedName),
      }

      if (startDate) {
        payload.start_date = startDate
      }
      if (endDate) {
        payload.end_date = endDate
      }
      if (timeIn) {
        payload.time_in = timeIn
      }
      if (timeOut) {
        payload.time_out = timeOut
      }

      const { data, error } = await supabase
        .from('work_sites')
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
        console.error('Error creating work site:', errorInfo)
        console.error('Full error object:', error)
        console.error('Payload sent:', payload)
        
        const errorMessage = error.message || error.details || 'Failed to create work site'
        throw new Error(errorMessage)
      }

      return data
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      const errorMessage = typeof error === 'string' ? error : 'Unknown error occurred'
      console.error('Error creating work site:', errorMessage, error)
      throw new Error(errorMessage)
    }
  }

  static async updateWorkSite(
    id: string, 
    name: string, 
    location: string, 
    status: string, 
    shortHand?: string,
    startDate?: string,
    endDate?: string,
    timeIn?: string,
    timeOut?: string
  ) {
    try {
      if (!id) {
        throw new Error('Work site ID is required')
      }

      const trimmedName = name.trim()
      const trimmedLocation = location.trim()
      const trimmedShortHand = shortHand?.trim()

      if (!trimmedName) {
        throw new Error('Work site name is required')
      }

      if (!trimmedLocation) {
        throw new Error('Location is required')
      }

      // If shortHand is provided but empty, or not provided at all, generate it
      const finalShortHand = trimmedShortHand || generateShortHand(trimmedName)

      const payload: Record<string, unknown> = {
        name: trimmedName,
        location: trimmedLocation,
        status: status,
        short_hand: finalShortHand,
      }

      if (startDate) {
        payload.start_date = startDate
      } else {
        payload.start_date = null
      }
      if (endDate) {
        payload.end_date = endDate
      } else {
        payload.end_date = null
      }
      if (timeIn) {
        payload.time_in = timeIn
      } else {
        payload.time_in = null
      }
      if (timeOut) {
        payload.time_out = timeOut
      } else {
        payload.time_out = null
      }

      const { data, error } = await supabase
        .from('work_sites')
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
        console.error('Error updating work site:', errorInfo)
        console.error('Full error object:', error)
        console.error('Work site ID:', id)
        console.error('Payload sent:', payload)
        
        const errorMessage = error.message || error.details || 'Failed to update work site'
        throw new Error(errorMessage)
      }

      return data
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      const errorMessage = typeof error === 'string' ? error : 'Unknown error occurred'
      console.error('Error updating work site:', errorMessage, error)
      throw new Error(errorMessage)
    }
  }

  static async deleteWorkSite(id: string) {
    try {
      if (!id) {
        throw new Error('Work site ID is required')
      }

      const { error } = await supabase
        .from('work_sites')
        .delete()
        .eq('id', id)

      if (error) {
        const errorInfo = {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        }
        console.error('Error deleting work site:', errorInfo)
        console.error('Full error object:', error)
        console.error('Work site ID:', id)
        
        const errorMessage = error.message || error.details || 'Failed to delete work site'
        throw new Error(errorMessage)
      }

      return true
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      const errorMessage = typeof error === 'string' ? error : 'Unknown error occurred'
      console.error('Error deleting work site:', errorMessage, error)
      throw new Error(errorMessage)
    }
  }
}

