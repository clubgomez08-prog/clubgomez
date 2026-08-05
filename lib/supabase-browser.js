import { createClient } from '@supabase/supabase-js'

const DEMO_URL = 'https://placeholder.supabase.co'
const DEMO_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTI4MDAsImV4cCI6MTk2MDc2ODgwMH0.demo'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || DEMO_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || DEMO_KEY

export const supabaseBrowser = createClient(supabaseUrl, supabaseAnonKey)
