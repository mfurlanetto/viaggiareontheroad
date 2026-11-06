import { createClient } from '@supabase/supabase-js'

// Supabase sta dismettendo la chiave "anon" in favore della "publishable key".
// Accettiamo entrambe: la nuova ha la precedenza.
const url = import.meta.env.VITE_SUPABASE_URL
const key =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY

const missing = []
if (!url) missing.push('VITE_SUPABASE_URL')
if (!key) missing.push('VITE_SUPABASE_PUBLISHABLE_KEY (oppure VITE_SUPABASE_ANON_KEY)')

// Messaggio leggibile invece di un'eccezione all'import che lascia la pagina bianca.
export const supabaseConfigError = missing.length
  ? `Configurazione Supabase mancante: ${missing.join(', ')}. Vedi .env.example.`
  : null

export const supabase = supabaseConfigError ? null : createClient(url, key)
