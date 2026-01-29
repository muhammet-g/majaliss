import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with environment variables
// Make sure to add your SUPABASE_URL and SUPABASE_ANON_KEY to your .env file
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase configuration. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
