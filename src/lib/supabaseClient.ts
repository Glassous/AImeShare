import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase URL or Key in environment variables');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

export type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export type Conversation = {
  id: string;
  created_at: string;
  title: string | null;
  model: string | null;
  messages: Message[];
};
