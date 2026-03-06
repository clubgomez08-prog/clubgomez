import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Cliente público (para el frontend)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Cliente admin (para API routes del servidor)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
