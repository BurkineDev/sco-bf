// ============================================================================
// SUPABASE CLIENT - Configuration Next.js
// ============================================================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Client côté serveur avec service role (pour les actions admin)
export function createServerClient() {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// ============================================================================
// API HELPERS
// ============================================================================

export type ApiResponse<T> = {
  data: T | null;
  error: { message: string; code?: string } | null;
};

export async function fetchWithAuth<T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    const headers = {
      'Content-Type': 'application/json',
      ...(session?.access_token && { Authorization: `Bearer ${session.access_token}` }),
      ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });
    const data = await response.json();

    if (!response.ok) {
      return { data: null, error: { message: data.message || 'Erreur serveur', code: data.error } };
    }

    return { data, error: null };
  } catch (error) {
    return { data: null, error: { message: 'Erreur de connexion' } };
  }
}
