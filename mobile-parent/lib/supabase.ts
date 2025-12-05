// ============================================================================
// SUPABASE CLIENT - Configuration
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

// Custom storage adapter pour React Native
const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return await SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Types pour les réponses API
export type ApiResponse<T> = {
  data: T | null;
  error: ApiError | null;
};

export type ApiError = {
  error: string;
  message: string;
  details?: Record<string, string>;
  retry_after?: number;
};

// URL de base pour les Edge Functions
export const FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

// Helper pour appeler les Edge Functions avec auth
export async function callFunction<T>(
  functionName: string,
  body: Record<string, unknown>,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'POST'
): Promise<ApiResponse<T>> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const response = await fetch(`${FUNCTIONS_URL}/${functionName}`, {
      method,
      headers,
      body: method !== 'GET' ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (!response.ok) {
      return { data: null, error: data as ApiError };
    }

    return { data: data as T, error: null };
  } catch (error) {
    return {
      data: null,
      error: {
        error: 'NETWORK_ERROR',
        message: 'Erreur de connexion. Vérifiez votre connexion Internet.',
      },
    };
  }
}
