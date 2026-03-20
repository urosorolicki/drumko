import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://vwnardpvoctwztnqrusa.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_1NaIelHbstpbfQPZoamIRQ_J2j7vAMO'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
