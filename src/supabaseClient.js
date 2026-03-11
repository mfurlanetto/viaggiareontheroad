import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://jmepahxupsqlogtiahtq.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_NlpgcY4T3fL1SzzPULSFVw_JSfw3sX8'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
