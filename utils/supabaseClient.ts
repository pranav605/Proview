import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Use the Expo public env variables so they can be read in client code
const supabaseUrl: string = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey: string = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
