import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const isConfigured = supabaseUrl && supabaseAnonKey &&
  supabaseUrl !== "placeholder" && supabaseAnonKey !== "placeholder";

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any;

export const isSupabaseConfigured = isConfigured;
