import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

if (typeof window !== 'undefined') {
  console.log('🔌 Supabase Connection (Client):', {
    url: supabaseUrl || 'Not configured',
    hasAnonKey: !!supabaseAnonKey,
    client: supabase,
  })
} else {
  console.log('🔌 Supabase Connection (Server):', {
    url: supabaseUrl || 'Not configured',
    hasAnonKey: !!supabaseAnonKey,
  })
}

