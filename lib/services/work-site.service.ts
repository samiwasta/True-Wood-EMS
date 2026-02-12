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
    timeOut?: string,
    breakHours?: number | string | null
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
      if (breakHours !== undefined && breakHours !== null && breakHours !== '') {
        const num = typeof breakHours === 'string' ? parseFloat(breakHours) : breakHours
        if (!Number.isNaN(num)) payload.break_hours = num
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

      // Store initial time_in/time_out/break_hours in history for correct overtime on past dates
      if (data && (timeIn || timeOut || breakHours !== undefined)) {
        const effectiveFrom = startDate || new Date().toISOString().slice(0, 10)
        const bh = breakHours !== undefined && breakHours !== null && breakHours !== '' ? (typeof breakHours === 'string' ? parseFloat(breakHours) : breakHours) : null
        await supabase.from('work_site_time_history').insert({
          work_site_id: data.id,
          effective_from: effectiveFrom,
          time_in: timeIn || null,
          time_out: timeOut || null,
          break_hours: !Number.isNaN(bh as number) ? bh : null,
        })
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
    timeOut?: string,
    breakHours?: number | string | null
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
      if (breakHours !== undefined) {
        const num = typeof breakHours === 'string' ? parseFloat(breakHours) : breakHours
        payload.break_hours = num !== null && num !== undefined && !Number.isNaN(num) ? num : null
      }

      // When time_in/time_out/break_hours change, store new values in history (effective from today) so overtime for past dates uses previous times
      const hasTimeChange = timeIn !== undefined || timeOut !== undefined || breakHours !== undefined
      if (hasTimeChange) {
        const today = new Date().toISOString().slice(0, 10)
        await supabase.from('work_site_time_history').insert({
          work_site_id: id,
          effective_from: today,
          time_in: payload.time_in ?? null,
          time_out: payload.time_out ?? null,
          break_hours: payload.break_hours ?? null,
        })
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

  /**
   * Get time_in and time_out for a work site on a given date (for correct overtime calculation).
   * Uses work_site_time_history when available; otherwise falls back to current work_sites times.
   */
  static async getWorkSiteTimesOnDate(
    workSiteId: string,
    date: string
  ): Promise<{ time_in: string | null; time_out: string | null; break_hours: number | null }> {
    try {
      const { data: historyRow, error: historyError } = await supabase
        .from('work_site_time_history')
        .select('time_in, time_out, break_hours')
        .eq('work_site_id', workSiteId)
        .lte('effective_from', date)
        .order('effective_from', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!historyError && historyRow) {
        const bh = historyRow.break_hours != null ? Number(historyRow.break_hours) : null
        return {
          time_in: historyRow.time_in ?? null,
          time_out: historyRow.time_out ?? null,
          break_hours: bh != null && !Number.isNaN(bh) ? bh : null,
        }
      }

      const { data: site, error: siteError } = await supabase
        .from('work_sites')
        .select('time_in, time_out, break_hours')
        .eq('id', workSiteId)
        .maybeSingle()

      if (siteError || !site) {
        return { time_in: null, time_out: null, break_hours: null }
      }
      const bh = site.break_hours != null ? Number(site.break_hours) : null
      return {
        time_in: site.time_in ?? null,
        time_out: site.time_out ?? null,
        break_hours: bh != null && !Number.isNaN(bh) ? bh : null,
      }
    } catch (error) {
      console.error('Error fetching work site times for date:', error)
      return { time_in: null, time_out: null, break_hours: null }
    }
  }

  /**
   * Get time_in/time_out/break_hours for all work sites on a given date (e.g. for timesheet overtime).
   */
  static async getWorkSiteTimesForAllSitesOnDate(
    date: string
  ): Promise<Record<string, { time_in: string | null; time_out: string | null; break_hours: number | null }>> {
    try {
      const { data: historyRows, error: historyError } = await supabase
        .from('work_site_time_history')
        .select('work_site_id, time_in, time_out, break_hours, effective_from')
        .lte('effective_from', date)
        .order('effective_from', { ascending: false })

      if (historyError) {
        console.error('Error fetching work site time history:', historyError)
      }

      const bySite: Record<string, { time_in: string | null; time_out: string | null; break_hours: number | null }> = {}
      if (historyRows && historyRows.length > 0) {
        for (const row of historyRows) {
          const id = row.work_site_id as string
          if (id && !bySite[id]) {
            const bh = row.break_hours != null ? Number(row.break_hours) : null
            bySite[id] = {
              time_in: row.time_in ?? null,
              time_out: row.time_out ?? null,
              break_hours: bh != null && !Number.isNaN(bh) ? bh : null,
            }
          }
        }
      }

      const { data: sites, error: sitesError } = await supabase
        .from('work_sites')
        .select('id, time_in, time_out, break_hours')

      if (!sitesError && sites) {
        for (const site of sites) {
          const id = site.id as string
          if (id && !bySite[id]) {
            const bh = site.break_hours != null ? Number(site.break_hours) : null
            bySite[id] = {
              time_in: site.time_in ?? null,
              time_out: site.time_out ?? null,
              break_hours: bh != null && !Number.isNaN(bh) ? bh : null,
            }
          }
        }
      }

      return bySite
    } catch (error) {
      console.error('Error fetching work site times for date:', error)
      return {}
    }
  }

  /**
   * Get full time history for a work site (for "View history" on the card).
   */
  static async getWorkSiteTimeHistory(
    workSiteId: string
  ): Promise<Array<{ effective_from: string; time_in: string | null; time_out: string | null; break_hours: number | null; created_at: string }>> {
    try {
      const { data, error } = await supabase
        .from('work_site_time_history')
        .select('effective_from, time_in, time_out, break_hours, created_at')
        .eq('work_site_id', workSiteId)
        .order('effective_from', { ascending: false })

      if (error) {
        console.error('Error fetching work site time history:', error)
        return []
      }
      return (data ?? []).map((row) => ({
        effective_from: row.effective_from as string,
        time_in: row.time_in ?? null,
        time_out: row.time_out ?? null,
        break_hours: row.break_hours != null ? Number(row.break_hours) : null,
        created_at: row.created_at as string,
      }))
    } catch (error) {
      console.error('Error fetching work site time history:', error)
      return []
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

