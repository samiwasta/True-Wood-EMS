export interface Category {
  id: string
  name?: string
  title?: string
  description?: string
  status?: 'active' | 'inactive' | string
}

export interface Department {
  id: string
  name?: string
  title?: string
  description?: string
  status?: 'active' | 'inactive' | string
}

export interface LeaveType {
  id: string
  name?: string
  title?: string
  description?: string
  max_days?: number
  is_paid?: boolean
  status?: 'active' | 'inactive' | string
}

export interface WeeklyOff {
  id: string
  day_name?: string
  name?: string
  day_order?: number
  description?: string
  is_active?: boolean
}

export interface Holiday {
  id: string
  name?: string
  title?: string
  start_date: string
  end_date: string
  description?: string
  created_at?: string
}

