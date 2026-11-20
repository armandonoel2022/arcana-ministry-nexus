
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hfjtzmnphyizntcjzgar.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmanR6bW5waHlpem50Y2p6Z2FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAzNjUwNTEsImV4cCI6MjA2NTk0MTA1MX0.A85BzxnW8IyUPAHblGkmEr6SsJnx94OVBt-pB-9GmDg'

// Requests to the database and sign-in service never wait forever: when the
// server is slow they fail after a time limit so the app can fall back to
// cached data instead of staying on "Cargando...". File uploads and server
// functions keep a longer limit because they legitimately take more time.
const REQUEST_TIMEOUT_MS = 15000
const LONG_REQUEST_TIMEOUT_MS = 60000

const fetchWithTimeout: typeof fetch = (input, init = {}) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
  const isLong = url.includes('/storage/v1/') || url.includes('/functions/v1/')
  const timeoutMs = isLong ? LONG_REQUEST_TIMEOUT_MS : REQUEST_TIMEOUT_MS

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  const outerSignal = init.signal
  if (outerSignal) {
    if (outerSignal.aborted) controller.abort()
    else outerSignal.addEventListener('abort', () => controller.abort(), { once: true })
  }

  return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer))
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    fetch: fetchWithTimeout,
  },
})
