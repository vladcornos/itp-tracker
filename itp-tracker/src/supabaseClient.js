import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://shuqoxdyblinxuwpasot.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNodXFveGR5Ymxpbnh1d3Bhc290Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyODYyNDgsImV4cCI6MjA5NTg2MjI0OH0.OfJoOGTIc7Zh7u0QX7Y-9X3gUB5vBQKtJIdlHJONlRY'

export const supabase = createClient(supabaseUrl, supabaseKey)