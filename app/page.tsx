'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function Home() {
  useEffect(() => {
    console.log('🔌 Supabase Client:', supabase)
    console.log('🔌 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not configured')
    console.log('🔌 Has Anon Key:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to Regrind</h1>
      <p className="text-gray-600 text-lg">Employee Management System</p>
    </div>
  )
}
