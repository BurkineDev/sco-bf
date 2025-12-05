// ============================================================================
// ZUSTAND STORE - État Global Application
// ============================================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { User, Student, AuthState } from '@/types';
import { supabase, callFunction } from '@/lib/supabase';

// Storage adapter pour persistence
const zustandStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(name);
    }
    return await SecureStore.getItemAsync(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.setItem(name, value);
      return;
    }
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(name);
      return;
    }
    await SecureStore.deleteItemAsync(name);
  },
};

// ============================================================================
// AUTH STORE
// ============================================================================

interface AuthStore extends AuthState {
  // Actions
  setUser: (user: User | null) => void;
  setTokens: (access: string | null, refresh: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  logout: () => Promise<void>;
  
  // OTP Actions
  requestOtp: (phone: string) => Promise<{ success: boolean; error?: string; otpId?: string }>;
  verifyOtp: (phone: string, otp: string) => Promise<{ success: boolean; error?: string }>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      accessToken: null,
      refreshToken: null,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      
      setTokens: (access, refresh) => set({ 
        accessToken: access, 
        refreshToken: refresh,
        isAuthenticated: !!access,
      }),
      
      setLoading: (isLoading) => set({ isLoading }),

      logout: async () => {
        try {
          await supabase.auth.signOut();
        } catch (error) {
          console.error('Logout error:', error);
        }
        set({
          user: null,
          isAuthenticated: false,
          accessToken: null,
          refreshToken: null,
        });
      },

      requestOtp: async (phone) => {
        try {
          const response = await callFunction<{ 
            success: boolean; 
            otp_id: string; 
            message: string;
          }>('auth-otp/request', { phone, purpose: 'login' });

          if (response.error) {
            return { success: false, error: response.error.message };
          }

          return { 
            success: true, 
            otpId: response.data?.otp_id 
          };
        } catch (error) {
          return { 
            success: false, 
            error: 'Erreur de connexion. Réessayez.' 
          };
        }
      },

      verifyOtp: async (phone, otp) => {
        try {
          const response = await callFunction<{
            success: boolean;
            access_token: string;
            refresh_token: string;
            user: User;
          }>('auth-otp/verify', { 
            phone, 
            otp, 
            purpose: 'login',
            device_info: {
              device_id: 'mobile-app',
              platform: Platform.OS,
              app_version: '1.0.0',
            },
          });

          if (response.error) {
            return { success: false, error: response.error.message };
          }

          if (response.data) {
            set({
              user: response.data.user,
              accessToken: response.data.access_token,
              refreshToken: response.data.refresh_token,
              isAuthenticated: true,
            });
            return { success: true };
          }

          return { success: false, error: 'Erreur inattendue' };
        } catch (error) {
          return { 
            success: false, 
            error: 'Erreur de connexion. Réessayez.' 
          };
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// ============================================================================
// STUDENTS STORE
// ============================================================================

interface StudentsStore {
  students: Student[];
  selectedStudent: Student | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchStudents: () => Promise<void>;
  selectStudent: (student: Student | null) => void;
  refreshStudent: (studentId: string) => Promise<void>;
}

export const useStudentsStore = create<StudentsStore>((set, get) => ({
  students: [],
  selectedStudent: null,
  isLoading: false,
  error: null,

  fetchStudents: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await callFunction<{ data: Student[] }>('parent-students', {}, 'GET');
      
      if (response.error) {
        set({ error: response.error.message, isLoading: false });
        return;
      }

      // Fallback: appel direct Supabase si Edge Function pas dispo
      const { data: students, error } = await supabase
        .from('students')
        .select(`
          id,
          matricule,
          first_name,
          last_name,
          schools!inner (
            id,
            code,
            name,
            logo_url
          ),
          classes!inner (
            id,
            name,
            level,
            academic_year_id
          ),
          tuition_accounts (
            total_amount,
            paid_amount,
            balance,
            is_fully_paid,
            last_payment_at
          )
        `)
        .eq('is_active', true);

      if (error) {
        set({ error: 'Impossible de charger les élèves', isLoading: false });
        return;
      }

      // Transformer les données
      const formattedStudents: Student[] = (students || []).map((s: any) => ({
        id: s.id,
        matricule: s.matricule,
        first_name: s.first_name,
        last_name: s.last_name,
        school: {
          id: s.schools.id,
          code: s.schools.code,
          name: s.schools.name,
          logo_url: s.schools.logo_url,
        },
        class: {
          id: s.classes.id,
          name: s.classes.name,
          level: s.classes.level,
        },
        academic_year: '2024-2025', // TODO: récupérer dynamiquement
        tuition: s.tuition_accounts?.[0] || null,
      }));

      set({ students: formattedStudents, isLoading: false });
    } catch (error) {
      set({ error: 'Erreur de connexion', isLoading: false });
    }
  },

  selectStudent: (student) => set({ selectedStudent: student }),

  refreshStudent: async (studentId) => {
    const { students } = get();
    // TODO: Implémenter le refresh d'un seul étudiant
    await get().fetchStudents();
  },
}));

// ============================================================================
// PAYMENTS STORE
// ============================================================================

interface PaymentsStore {
  payments: Record<string, Payment[]>; // Par studentId
  currentIntent: PaymentIntent | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchPayments: (studentId: string) => Promise<void>;
  createPaymentIntent: (request: {
    studentId: string;
    amount: number;
    provider: string;
  }) => Promise<{ success: boolean; intent?: PaymentIntent; error?: string }>;
  checkPaymentStatus: (intentId: string) => Promise<PaymentIntent | null>;
  clearCurrentIntent: () => void;
}

interface Payment {
  id: string;
  reference: string;
  amount: number;
  channel: string;
  provider: string;
  status: string;
  created_at: string;
}

interface PaymentIntent {
  id: string;
  reference: string;
  amount: number;
  currency: string;
  status: string;
  expires_at: string;
  payment_url?: string;
}

export const usePaymentsStore = create<PaymentsStore>((set, get) => ({
  payments: {},
  currentIntent: null,
  isLoading: false,
  error: null,

  fetchPayments: async (studentId) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data: payments, error } = await supabase
        .from('payments')
        .select(`
          id,
          reference,
          amount,
          channel,
          provider,
          status,
          created_at
        `)
        .eq('tuition_account_id', studentId) // Note: ajuster selon le schéma
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        set({ error: 'Impossible de charger les paiements', isLoading: false });
        return;
      }

      set((state) => ({
        payments: { ...state.payments, [studentId]: payments || [] },
        isLoading: false,
      }));
    } catch (error) {
      set({ error: 'Erreur de connexion', isLoading: false });
    }
  },

  createPaymentIntent: async ({ studentId, amount, provider }) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await callFunction<PaymentIntent>('create-payment-intent', {
        student_id: studentId,
        amount,
        channel: 'app_mobile',
        provider,
        return_url: 'scolaritebf://payment/callback',
      });

      if (response.error) {
        set({ error: response.error.message, isLoading: false });
        return { success: false, error: response.error.message };
      }

      if (response.data) {
        set({ currentIntent: response.data, isLoading: false });
        return { success: true, intent: response.data };
      }

      return { success: false, error: 'Erreur inattendue' };
    } catch (error) {
      set({ error: 'Erreur de connexion', isLoading: false });
      return { success: false, error: 'Erreur de connexion' };
    }
  },

  checkPaymentStatus: async (intentId) => {
    try {
      const { data: intent, error } = await supabase
        .from('payment_intents')
        .select('id, reference, amount, currency, status, expires_at')
        .eq('id', intentId)
        .single();

      if (error || !intent) return null;

      set({ currentIntent: intent });
      return intent;
    } catch {
      return null;
    }
  },

  clearCurrentIntent: () => set({ currentIntent: null }),
}));
