import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://shuqoxdyblinxuwpasot.supabase.co'
const supabaseKey = 'sb_publishable_GaghEvL0sU2AuH2EZ4V4Wg_zAPFBLBM'

export const supabase = createClient(supabaseUrl, supabaseKey)