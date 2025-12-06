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
  setAuth: (user: User, school: School | null) => void;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  requestOtp: (phone: string) => Promise<{ success: boolean; error?: string; otpId?: string }>;
  verifyOtp: (phone: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  fetchSchool: () => Promise<void>;
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
      setAuth: (user, school) => set({ user, school, isAuthenticated: true }),

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

      requestOtp: async (phone) => {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/auth-otp/request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, purpose: 'login' }),
          });

          const data = await response.json();

          if (!response.ok) {
            return { success: false, error: data.message || 'Erreur lors de l\'envoi de l\'OTP' };
          }

          return { success: true, otpId: data.otp_id };
        } catch (error) {
          return { success: false, error: 'Erreur de connexion. Réessayez.' };
        }
      },

      verifyOtp: async (phone, otp) => {
        set({ isLoading: true });
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/auth-otp/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone,
              otp,
              purpose: 'login',
              device_info: {
                device_id: 'dashboard-web',
                platform: 'web',
                app_version: '1.0.0',
              },
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            set({ isLoading: false });
            return { success: false, error: data.message || 'Code OTP invalide' };
          }

          // Vérifier que l'utilisateur a les droits d'accès au dashboard
          const userRole = data.user.role;
          const allowedRoles = ['school_admin', 'school_accountant', 'agent', 'platform_admin', 'platform_super_admin'];

          if (!allowedRoles.includes(userRole)) {
            set({ isLoading: false });
            return { success: false, error: 'Vous n\'avez pas accès au dashboard école' };
          }

          set({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
          });

          // Charger l'école associée
          await get().fetchSchool();

          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          return { success: false, error: 'Erreur de connexion. Réessayez.' };
        }
      },

      fetchSchool: async () => {
        const { user } = get();
        if (!user) return;

        try {
          const { data: school, error } = await supabase
            .from('schools')
            .select('*')
            .eq('admin_user_id', user.id)
            .single();

          if (error && error.code !== 'PGRST116') {
            console.error('Error fetching school:', error);
            return;
          }

          if (school) {
            set({ school });
          }
        } catch (error) {
          console.error('Error fetching school:', error);
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

// ============================================================================
// STUDENTS STORE (Extended)
// ============================================================================

interface StudentsState {
  students: Student[];
  selectedStudent: Student | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    search: string;
    classId: string | null;
    paymentStatus: 'all' | 'paid' | 'partial' | 'unpaid';
  };
}

interface StudentsActions {
  fetchStudents: () => Promise<void>;
  selectStudent: (student: Student | null) => void;
  setFilters: (filters: Partial<StudentsState['filters']>) => void;
  addStudent: (student: Partial<Student>) => Promise<{ success: boolean; error?: string }>;
  updateStudent: (id: string, updates: Partial<Student>) => Promise<{ success: boolean; error?: string }>;
  deleteStudent: (id: string) => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;
}

export const useStudentsStore = create<StudentsState & StudentsActions>((set, get) => ({
  students: [],
  selectedStudent: null,
  isLoading: false,
  error: null,
  filters: {
    search: '',
    classId: null,
    paymentStatus: 'all',
  },

  fetchStudents: async () => {
    const { school } = useAuthStore.getState();
    if (!school) return;

    set({ isLoading: true, error: null });

    try {
      const { data: students, error } = await supabase
        .from('students')
        .select(`
          id,
          school_id,
          matricule,
          first_name,
          last_name,
          display_name,
          class_id,
          date_of_birth,
          gender,
          parent_phone,
          parent_name,
          is_active,
          created_at,
          classes!inner (
            id,
            school_id,
            name,
            academic_year_id,
            tuition_amount,
            allow_installments
          ),
          tuition_accounts (
            total_amount,
            paid_amount,
            balance,
            is_fully_paid,
            last_payment_at
          )
        `)
        .eq('school_id', school.id)
        .order('first_name', { ascending: true });

      if (error) {
        set({ error: 'Impossible de charger les élèves', isLoading: false });
        return;
      }

      const formattedStudents: Student[] = (students || []).map((s: any) => ({
        id: s.id,
        school_id: s.school_id,
        matricule: s.matricule,
        first_name: s.first_name,
        last_name: s.last_name,
        display_name: s.display_name,
        class_id: s.class_id,
        date_of_birth: s.date_of_birth,
        gender: s.gender,
        parent_phone: s.parent_phone,
        parent_name: s.parent_name,
        is_active: s.is_active,
        created_at: s.created_at,
        class: s.classes ? {
          id: s.classes.id,
          school_id: s.classes.school_id,
          name: s.classes.name,
          academic_year_id: s.classes.academic_year_id,
          tuition_amount: s.classes.tuition_amount,
          allow_installments: s.classes.allow_installments,
        } : undefined,
        tuition: s.tuition_accounts?.[0] || null,
      }));

      set({ students: formattedStudents, isLoading: false });
    } catch (error) {
      set({ error: 'Erreur de connexion', isLoading: false });
    }
  },

  selectStudent: (student) => set({ selectedStudent: student }),
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),

  addStudent: async (student) => {
    const { school } = useAuthStore.getState();
    if (!school) return { success: false, error: 'École non trouvée' };

    try {
      const { error } = await supabase
        .from('students')
        .insert({
          ...student,
          school_id: school.id,
        });

      if (error) {
        return { success: false, error: 'Erreur lors de l\'ajout de l\'élève' };
      }

      await get().fetchStudents();
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Erreur de connexion' };
    }
  },

  updateStudent: async (id, updates) => {
    try {
      const { error } = await supabase
        .from('students')
        .update(updates)
        .eq('id', id);

      if (error) {
        return { success: false, error: 'Erreur lors de la mise à jour' };
      }

      await get().fetchStudents();
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Erreur de connexion' };
    }
  },

  deleteStudent: async (id) => {
    try {
      const { error } = await supabase
        .from('students')
        .update({ is_active: false })
        .eq('id', id);

      if (error) {
        return { success: false, error: 'Erreur lors de la suppression' };
      }

      await get().fetchStudents();
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Erreur de connexion' };
    }
  },

  clearError: () => set({ error: null }),
}));

// ============================================================================
// PAYMENTS STORE
// ============================================================================

interface PaymentsState {
  payments: Payment[];
  isLoading: boolean;
  error: string | null;
  filters: {
    startDate: string | null;
    endDate: string | null;
    channel: string | null;
    status: string | null;
  };
  stats: {
    totalAmount: number;
    totalCommission: number;
    totalNet: number;
    count: number;
  } | null;
}

interface PaymentsActions {
  fetchPayments: () => Promise<void>;
  setFilters: (filters: Partial<PaymentsState['filters']>) => void;
  exportPayments: (format: 'excel' | 'pdf') => Promise<{ success: boolean; url?: string; error?: string }>;
  clearError: () => void;
}

export const usePaymentsStore = create<PaymentsState & PaymentsActions>((set, get) => ({
  payments: [],
  isLoading: false,
  error: null,
  filters: {
    startDate: null,
    endDate: null,
    channel: null,
    status: null,
  },
  stats: null,

  fetchPayments: async () => {
    const { school } = useAuthStore.getState();
    if (!school) return;

    set({ isLoading: true, error: null });

    try {
      let query = supabase
        .from('payments')
        .select(`
          id,
          reference,
          tuition_account_id,
          amount,
          commission_amount,
          commission_rate,
          net_amount,
          currency,
          channel,
          provider,
          status,
          created_at,
          payer_name,
          payer_phone,
          tuition_accounts!inner (
            student_id,
            students!inner (
              id,
              matricule,
              first_name,
              last_name,
              display_name,
              school_id,
              classes!inner (
                name
              )
            )
          )
        `)
        .eq('tuition_accounts.students.school_id', school.id)
        .order('created_at', { ascending: false })
        .limit(100);

      const { data: payments, error } = await query;

      if (error) {
        set({ error: 'Impossible de charger les paiements', isLoading: false });
        return;
      }

      const formattedPayments: Payment[] = (payments || []).map((p: any) => ({
        id: p.id,
        reference: p.reference,
        tuition_account_id: p.tuition_account_id,
        amount: p.amount,
        commission_amount: p.commission_amount,
        commission_rate: p.commission_rate,
        net_amount: p.net_amount,
        channel: p.channel,
        provider: p.provider,
        status: p.status,
        created_at: p.created_at,
        payer_name: p.payer_name,
        payer_phone: p.payer_phone,
        student: {
          id: p.tuition_accounts.students.id,
          school_id: p.tuition_accounts.students.school_id,
          matricule: p.tuition_accounts.students.matricule,
          first_name: p.tuition_accounts.students.first_name,
          last_name: p.tuition_accounts.students.last_name,
          display_name: p.tuition_accounts.students.display_name,
          class_id: '',
          is_active: true,
          created_at: '',
          class: {
            id: '',
            school_id: '',
            name: p.tuition_accounts.students.classes?.name || '',
            academic_year_id: '',
            tuition_amount: 0,
            allow_installments: false,
          },
        },
      }));

      // Calculate stats
      const stats = {
        totalAmount: formattedPayments.reduce((sum, p) => sum + p.amount, 0),
        totalCommission: formattedPayments.reduce((sum, p) => sum + p.commission_amount, 0),
        totalNet: formattedPayments.reduce((sum, p) => sum + p.net_amount, 0),
        count: formattedPayments.length,
      };

      set({ payments: formattedPayments, stats, isLoading: false });
    } catch (error) {
      set({ error: 'Erreur de connexion', isLoading: false });
    }
  },

  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),

  exportPayments: async (format) => {
    try {
      const { school } = useAuthStore.getState();
      if (!school) return { success: false, error: 'École non trouvée' };

      const response = await fetch('/api/exports/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          school_id: school.id,
          format,
          filters: get().filters,
        }),
      });

      if (!response.ok) {
        return { success: false, error: 'Erreur lors de l\'export' };
      }

      const data = await response.json();
      return { success: true, url: data.url };
    } catch (error) {
      return { success: false, error: 'Erreur de connexion' };
    }
  },

  clearError: () => set({ error: null }),
}));

// ============================================================================
// AGENTS STORE
// ============================================================================

interface Agent {
  id: string;
  user_id: string;
  agent_code: string;
  first_name: string;
  last_name: string;
  phone: string;
  school_id?: string;
  daily_limit: number;
  transaction_limit: number;
  is_active: boolean;
  created_at: string;
}

interface AgentsState {
  agents: Agent[];
  isLoading: boolean;
  error: string | null;
}

interface AgentsActions {
  fetchAgents: () => Promise<void>;
  addAgent: (agent: Partial<Agent>) => Promise<{ success: boolean; error?: string }>;
  updateAgent: (id: string, updates: Partial<Agent>) => Promise<{ success: boolean; error?: string }>;
  deleteAgent: (id: string) => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;
}

export const useAgentsStore = create<AgentsState & AgentsActions>((set, get) => ({
  agents: [],
  isLoading: false,
  error: null,

  fetchAgents: async () => {
    const { school } = useAuthStore.getState();
    if (!school) return;

    set({ isLoading: true, error: null });

    try {
      const { data: agents, error } = await supabase
        .from('agents')
        .select(`
          id,
          user_id,
          agent_code,
          school_id,
          daily_limit,
          transaction_limit,
          is_active,
          created_at,
          users!inner (
            phone,
            first_name,
            last_name
          )
        `)
        .eq('school_id', school.id)
        .order('created_at', { ascending: false });

      if (error) {
        set({ error: 'Impossible de charger les agents', isLoading: false });
        return;
      }

      const formattedAgents: Agent[] = (agents || []).map((a: any) => ({
        id: a.id,
        user_id: a.user_id,
        agent_code: a.agent_code,
        first_name: a.users.first_name,
        last_name: a.users.last_name,
        phone: a.users.phone,
        school_id: a.school_id,
        daily_limit: a.daily_limit,
        transaction_limit: a.transaction_limit,
        is_active: a.is_active,
        created_at: a.created_at,
      }));

      set({ agents: formattedAgents, isLoading: false });
    } catch (error) {
      set({ error: 'Erreur de connexion', isLoading: false });
    }
  },

  addAgent: async (agent) => {
    const { school } = useAuthStore.getState();
    if (!school) return { success: false, error: 'École non trouvée' };

    try {
      // TODO: Appeler une Edge Function pour créer l'utilisateur et l'agent
      const { error } = await supabase
        .from('agents')
        .insert({
          ...agent,
          school_id: school.id,
        });

      if (error) {
        return { success: false, error: 'Erreur lors de l\'ajout de l\'agent' };
      }

      await get().fetchAgents();
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Erreur de connexion' };
    }
  },

  updateAgent: async (id, updates) => {
    try {
      const { error } = await supabase
        .from('agents')
        .update(updates)
        .eq('id', id);

      if (error) {
        return { success: false, error: 'Erreur lors de la mise à jour' };
      }

      await get().fetchAgents();
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Erreur de connexion' };
    }
  },

  deleteAgent: async (id) => {
    try {
      const { error } = await supabase
        .from('agents')
        .update({ is_active: false })
        .eq('id', id);

      if (error) {
        return { success: false, error: 'Erreur lors de la désactivation' };
      }

      await get().fetchAgents();
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Erreur de connexion' };
    }
  },

  clearError: () => set({ error: null }),
}));

// ============================================================================
// ACADEMIC YEARS STORE
// ============================================================================

interface AcademicYearsState {
  academicYears: AcademicYear[];
  currentYear: AcademicYear | null;
  isLoading: boolean;
  error: string | null;
}

interface AcademicYearsActions {
  fetchAcademicYears: () => Promise<void>;
  addAcademicYear: (year: Partial<AcademicYear>) => Promise<{ success: boolean; error?: string }>;
  updateAcademicYear: (id: string, updates: Partial<AcademicYear>) => Promise<{ success: boolean; error?: string }>;
  setCurrentYear: (id: string) => Promise<{ success: boolean; error?: string }>;
  deleteAcademicYear: (id: string) => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;
}

export const useAcademicYearsStore = create<AcademicYearsState & AcademicYearsActions>((set, get) => ({
  academicYears: [],
  currentYear: null,
  isLoading: false,
  error: null,

  fetchAcademicYears: async () => {
    const { school } = useAuthStore.getState();
    if (!school) return;

    set({ isLoading: true, error: null });

    try {
      const { data: years, error } = await supabase
        .from('academic_years')
        .select('*')
        .eq('school_id', school.id)
        .order('start_date', { ascending: false });

      if (error) {
        set({ error: 'Impossible de charger les années académiques', isLoading: false });
        return;
      }

      const currentYear = years?.find((y: AcademicYear) => y.is_current) || null;
      set({ academicYears: years || [], currentYear, isLoading: false });
    } catch (error) {
      set({ error: 'Erreur de connexion', isLoading: false });
    }
  },

  addAcademicYear: async (year) => {
    const { school } = useAuthStore.getState();
    if (!school) return { success: false, error: 'École non trouvée' };

    try {
      const { error } = await supabase
        .from('academic_years')
        .insert({
          ...year,
          school_id: school.id,
        });

      if (error) {
        return { success: false, error: 'Erreur lors de l\'ajout de l\'année' };
      }

      await get().fetchAcademicYears();
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Erreur de connexion' };
    }
  },

  updateAcademicYear: async (id, updates) => {
    try {
      const { error } = await supabase
        .from('academic_years')
        .update(updates)
        .eq('id', id);

      if (error) {
        return { success: false, error: 'Erreur lors de la mise à jour' };
      }

      await get().fetchAcademicYears();
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Erreur de connexion' };
    }
  },

  setCurrentYear: async (id) => {
    const { school } = useAuthStore.getState();
    if (!school) return { success: false, error: 'École non trouvée' };

    try {
      // Désactiver toutes les années courantes
      await supabase
        .from('academic_years')
        .update({ is_current: false })
        .eq('school_id', school.id);

      // Activer la nouvelle année courante
      const { error } = await supabase
        .from('academic_years')
        .update({ is_current: true })
        .eq('id', id);

      if (error) {
        return { success: false, error: 'Erreur lors de la mise à jour' };
      }

      await get().fetchAcademicYears();
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Erreur de connexion' };
    }
  },

  deleteAcademicYear: async (id) => {
    try {
      const { error } = await supabase
        .from('academic_years')
        .delete()
        .eq('id', id);

      if (error) {
        return { success: false, error: 'Erreur lors de la suppression' };
      }

      await get().fetchAcademicYears();
      return { success: true };
    } catch (error) {
      return { success: false, error: 'Erreur de connexion' };
    }
  },

  clearError: () => set({ error: null }),
}));
