// ============================================================================
// TYPES - Dashboard École
// ============================================================================

// User & Auth
export interface User {
  id: string;
  email: string;
  phone?: string;
  first_name: string;
  last_name: string;
  role: 'school_admin' | 'school_accountant' | 'platform_admin';
  avatar_url?: string;
}

export interface School {
  id: string;
  code: string;
  name: string;
  logo_url?: string;
  region: string;
  province: string;
  commune?: string;
  address?: string;
  phone?: string;
  email?: string;
  commission_rate: number;
  commission_fixed: number;
  commission_type: 'rate' | 'fixed' | 'both';
  created_at: string;
}

// Academic
export interface AcademicYear {
  id: string;
  school_id: string;
  label: string;
  start_date: string;
  end_date: string;
  status: 'upcoming' | 'active' | 'completed' | 'archived';
  is_current: boolean;
}

export interface Class {
  id: string;
  school_id: string;
  academic_year_id: string;
  name: string;
  level?: string;
  section?: string;
  tuition_amount: number;
  allow_installments: boolean;
  min_installment_amount?: number;
  student_count?: number;
  paid_count?: number;
  total_collected?: number;
}

// Students
export interface Student {
  id: string;
  school_id: string;
  class_id: string;
  matricule: string;
  first_name: string;
  last_name: string;
  display_name?: string;
  date_of_birth?: string;
  gender?: 'M' | 'F';
  parent_phone?: string;
  parent_name?: string;
  parent_email?: string;
  is_active: boolean;
  created_at: string;
  class?: Class;
  tuition?: TuitionAccount;
}

export interface TuitionAccount {
  id: string;
  student_id: string;
  academic_year_id: string;
  total_amount: number;
  paid_amount: number;
  balance: number;
  discount_amount: number;
  is_fully_paid: boolean;
  last_payment_at?: string;
}

// Payments
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
export type PaymentChannel = 'app_mobile' | 'ussd' | 'agent_cash' | 'agent_momo' | 'bank_transfer' | 'other';
export type PaymentProvider = 'cinetpay' | 'orange_money' | 'moov_money' | 'coris_money' | 'manual';

export interface Payment {
  id: string;
  reference: string;
  tuition_account_id: string;
  amount: number;
  commission_amount: number;
  commission_rate: number;
  net_amount: number;
  channel: PaymentChannel;
  provider: PaymentProvider;
  status: PaymentStatus;
  payer_phone?: string;
  payer_name?: string;
  created_at: string;
  student?: Student;
}

// Stats & Analytics
export interface DashboardStats {
  total_students: number;
  active_students: number;
  total_collected: number;
  total_expected: number;
  total_balance: number;
  fully_paid_count: number;
  partially_paid_count: number;
  not_paid_count: number;
  collection_rate: number;
  payments_today: number;
  payments_this_week: number;
  payments_this_month: number;
}

export interface ClassStats {
  class_id: string;
  class_name: string;
  student_count: number;
  fully_paid: number;
  partially_paid: number;
  not_paid: number;
  total_expected: number;
  total_collected: number;
  collection_rate: number;
}

export interface MonthlyRevenue {
  month: string;
  year: number;
  amount: number;
  transaction_count: number;
}

export interface PaymentByChannel {
  channel: PaymentChannel;
  count: number;
  amount: number;
  percentage: number;
}

// Import
export interface ImportStudent {
  matricule: string;
  first_name: string;
  last_name: string;
  class_name: string;
  date_of_birth?: string;
  gender?: string;
  parent_name?: string;
  parent_phone?: string;
  parent_email?: string;
  tuition_amount?: number;
  discount_amount?: number;
}

export interface ImportResult {
  success: boolean;
  total: number;
  imported: number;
  skipped: number;
  errors: ImportError[];
}

export interface ImportError {
  row: number;
  matricule?: string;
  field: string;
  message: string;
}

// Tables & Pagination
export interface PaginationParams {
  page: number;
  limit: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// Filters
export interface StudentFilters {
  search?: string;
  class_id?: string;
  payment_status?: 'paid' | 'partial' | 'unpaid' | 'all';
  gender?: 'M' | 'F';
}

export interface PaymentFilters {
  search?: string;
  status?: PaymentStatus;
  channel?: PaymentChannel;
  date_from?: string;
  date_to?: string;
  class_id?: string;
}

// Export
export type ExportFormat = 'csv' | 'xlsx' | 'pdf';

export interface ExportOptions {
  format: ExportFormat;
  filters?: StudentFilters | PaymentFilters;
  columns?: string[];
}

// Notifications
export interface Notification {
  id: string;
  type: 'payment' | 'import' | 'alert' | 'info';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  data?: Record<string, unknown>;
}
