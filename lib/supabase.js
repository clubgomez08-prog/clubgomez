import { createClient } from '@supabase/supabase-js'

/** Placeholders solo para build/demo sin env (Vercel). No usar en producción real. */
const DEMO_URL = 'https://placeholder.supabase.co'
const DEMO_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTI4MDAsImV4cCI6MTk2MDc2ODgwMH0.demo'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || DEMO_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || DEMO_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || DEMO_KEY

export const supabaseMissingEnv =
  !process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
  !process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

if (typeof window === 'undefined' && process.env.NODE_ENV === 'production' && supabaseMissingEnv) {
  console.warn(
    '[supabase] Demo mode: faltan env vars. Landing ok; APIs/admin no funcionarán hasta configurarlas.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

/** Cliente anon fresco por request (evita mezclar sesiones en signIn del servidor). */
export function createAnonAuthClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}
