import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (
  typeof window === 'undefined' &&
  process.env.NODE_ENV === 'production' &&
  (!supabaseUrl?.trim() || !supabaseAnonKey?.trim() || !supabaseServiceKey?.trim())
) {
  console.error(
    '[supabase] Producción: definen NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY y SUPABASE_SERVICE_ROLE_KEY'
  )
}

// Cliente público (para el frontend)
export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
)

// Cliente admin (para API routes del servidor)
export const supabaseAdmin = createClient(
  supabaseUrl || '',
  supabaseServiceKey || ''
)
