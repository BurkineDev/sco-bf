// ============================================================================
// ZUSTAND STORE - État global Dashboard
// ============================================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, School, AcademicYear, DashboardStats, Class, Student, Payment } from '@/types';
import { supabase } from '@/lib/supabase';

// ============================================================================
// AUTH STORE
// ============================================================================

interface AuthState {
  user: User | null;
  school: School | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthActions {
  setUser: (user: User | null) => void;
  setSchool: (school: School | null) => void;
  setLoading: (loading: boolean) => void;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      user: null,
      school: null,
      isLoading: true,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setSchool: (school) => set({ school }),
      setLoading: (isLoading) => set({ isLoading }),

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            set({ isLoading: false });
            return { success: false, error: error.message };
          }

          // Récupérer les infos utilisateur et école
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (userData) {
            // Récupérer l'école associée
            const { data: schoolData } = await supabase
              .from('schools')
              .select('*')
              .eq('admin_user_id', userData.id)
              .single();

            set({
              user: userData,
              school: schoolData,
              isAuthenticated: true,
              isLoading: false,
            });
          }

          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, error: 'Erreur de connexion' };
        }
      },

      logout: async () => {
        await supabase.auth.signOut();
        set({ user: null, school: null, isAuthenticated: false });
      },

      checkSession: async () => {
        set({ isLoading: true });
        try {
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user) {
            const { data: userData } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (userData) {
              const { data: schoolData } = await supabase
                .from('schools')
                .select('*')
                .eq('admin_user_id', userData.id)
                .single();

              set({
                user: userData,
                school: schoolData,
                isAuthenticated: true,
              });
            }
          }
        } catch (error) {
          console.error('Session check error:', error);
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, school: state.school }),
    }
  )
);

// ============================================================================
// DASHBOARD STORE
// ============================================================================

interface DashboardState {
  stats: DashboardStats | null;
  classes: Class[];
  recentPayments: Payment[];
  isLoading: boolean;
  error: string | null;
  selectedAcademicYear: AcademicYear | null;
  academicYears: AcademicYear[];
}

interface DashboardActions {
  fetchStats: (schoolId: string) => Promise<void>;
  fetchClasses: (schoolId: string) => Promise<void>;
  fetchRecentPayments: (schoolId: string, limit?: number) => Promise<void>;
  fetchAcademicYears: (schoolId: string) => Promise<void>;
  setSelectedAcademicYear: (year: AcademicYear | null) => void;
  clearError: () => void;
}

export const useDashboardStore = create<DashboardState & DashboardActions>((set, get) => ({
  stats: null,
  classes: [],
  recentPayments: [],
  isLoading: false,
  error: null,
  selectedAcademicYear: null,
  academicYears: [],

  fetchStats: async (schoolId) => {
    set({ isLoading: true, error: null });
    try {
      // Statistiques agrégées
      const { data: students } = await supabase
        .from('students')
        .select(`
          id,
          tuition_accounts (
            total_amount,
            paid_amount,
            balance,
            is_fully_paid
          )
        `)
        .eq('school_id', schoolId)
        .eq('is_active', true);

      const stats: DashboardStats = {
        total_students: students?.length || 0,
        active_students: students?.length || 0,
        total_collected: 0,
        total_expected: 0,
        total_balance: 0,
        fully_paid_count: 0,
        partially_paid_count: 0,
        not_paid_count: 0,
        collection_rate: 0,
        payments_today: 0,
        payments_this_week: 0,
        payments_this_month: 0,
      };

      students?.forEach((s: any) => {
        const tuition = s.tuition_accounts?.[0];
        if (tuition) {
          stats.total_expected += tuition.total_amount;
          stats.total_collected += tuition.paid_amount;
          stats.total_balance += tuition.balance;
          
          if (tuition.is_fully_paid) {
            stats.fully_paid_count++;
          } else if (tuition.paid_amount > 0) {
            stats.partially_paid_count++;
          } else {
            stats.not_paid_count++;
          }
        }
      });

      stats.collection_rate = stats.total_expected > 0 
        ? (stats.total_collected / stats.total_expected) * 100 
        : 0;

      set({ stats, isLoading: false });
    } catch (error) {
      set({ error: 'Erreur lors du chargement des statistiques', isLoading: false });
    }
  },

  fetchClasses: async (schoolId) => {
    try {
      const { data } = await supabase
        .from('classes')
        .select(`
          *,
          students (count),
          academic_years!inner (is_current)
        `)
        .eq('school_id', schoolId)
        .eq('academic_years.is_current', true)
        .order('name');

      set({ classes: data || [] });
    } catch (error) {
      console.error('Fetch classes error:', error);
    }
  },

  fetchRecentPayments: async (schoolId, limit = 10) => {
    try {
      const { data } = await supabase
        .from('payments')
        .select(`
          *,
          tuition_accounts!inner (
            students!inner (
              id,
              first_name,
              last_name,
              matricule,
              school_id
            )
          )
        `)
        .eq('tuition_accounts.students.school_id', schoolId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(limit);

      const payments = data?.map((p: any) => ({
        ...p,
        student: p.tuition_accounts?.students,
      })) || [];

      set({ recentPayments: payments });
    } catch (error) {
      console.error('Fetch recent payments error:', error);
    }
  },

  fetchAcademicYears: async (schoolId) => {
    try {
      const { data } = await supabase
        .from('academic_years')
        .select('*')
        .eq('school_id', schoolId)
        .order('start_date', { ascending: false });

      const years = data || [];
      const current = years.find((y: AcademicYear) => y.is_current) || years[0];

      set({ academicYears: years, selectedAcademicYear: current });
    } catch (error) {
      console.error('Fetch academic years error:', error);
    }
  },

  setSelectedAcademicYear: (year) => set({ selectedAcademicYear: year }),
  clearError: () => set({ error: null }),
}));

// ============================================================================
// UI STORE
// ============================================================================

interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  notifications: Array<{ id: string; type: string; message: string }>;
}

interface UIActions {
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleTheme: () => void;
  addNotification: (type: string, message: string) => void;
  removeNotification: (id: string) => void;
}

export const useUIStore = create<UIState & UIActions>()(
  persist(
    (set, get) => ({
      sidebarOpen: true,
      theme: 'light',
      notifications: [],

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
      addNotification: (type, message) => {
        const id = Date.now().toString();
        set((state) => ({
          notifications: [...state.notifications, { id, type, message }],
        }));
        // Auto-remove après 5 secondes
        setTimeout(() => get().removeNotification(id), 5000);
      },
      removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      })),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({ theme: state.theme, sidebarOpen: state.sidebarOpen }),
    }
  )
);
