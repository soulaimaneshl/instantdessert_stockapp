import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const serviceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY

// Client standard pour les tables stock (anon avec policies ouvertes)
export const supabase = createClient(url, anonKey)

// Client service role pour lire toutes les commandes du site (bypass RLS)
export const supabaseAdmin = createClient(url, serviceKey)
