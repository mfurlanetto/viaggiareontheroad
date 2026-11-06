import { createClient } from '@supabase/supabase-js'

// Chiave pubblica (publishable key, formato sb_publishable_...). Le vecchie chiavi
// JWT "anon" del progetto sono disattivate, quindi non sono piu' accettate qui.
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

const missing = []
if (!url) missing.push('VITE_SUPABASE_URL')
if (!key) missing.push('VITE_SUPABASE_PUBLISHABLE_KEY')

// Messaggio leggibile invece di un'eccezione all'import che lascia la pagina bianca.
export const supabaseConfigError = missing.length
  ? `Configurazione Supabase mancante: ${missing.join(', ')}. Vedi .env.example.`
  : null

export const supabase = supabaseConfigError ? null : createClient(url, key)
