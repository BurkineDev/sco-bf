// ============================================================================
// TYPES TYPESCRIPT - SYSTÈME DE PAIEMENT SCOLARITÉ BF
// ============================================================================

// ----------------------------------------------------------------------------
// ENUMS
// ----------------------------------------------------------------------------

export type UserRole = 
  | 'parent'
  | 'school_admin'
  | 'school_accountant'
  | 'agent'
  | 'platform_admin'
  | 'platform_super_admin';

export type PaymentStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'refunded';

export type PaymentChannel = 
  | 'app_mobile'
  | 'ussd'
  | 'agent_cash'
  | 'agent_momo'
  | 'bank_transfer'
  | 'other';

export type PaymentProvider = 
  | 'cinetpay'
  | 'paygate'
  | 'corispay'
  | 'orange_money'
  | 'moov_money'
  | 'coris_money'
  | 'manual';

export type AcademicYearStatus = 
  | 'upcoming'
  | 'active'
  | 'completed'
  | 'archived';

export type OtpPurpose = 
  | 'login'
  | 'payment_confirmation'
  | 'phone_verification'
  | 'password_reset';

export type WebhookStatus = 
  | 'received'
  | 'processing'
  | 'processed'
  | 'failed'
  | 'duplicate';

export type AuditAction = 
  | 'create'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'payment_initiated'
  | 'payment_completed'
  | 'payment_failed'
  | 'webhook_received'
  | 'otp_sent'
  | 'otp_verified'
  | 'otp_failed'
  | 'permission_denied'
  | 'suspicious_activity';

// ----------------------------------------------------------------------------
// DATABASE MODELS (correspond au schéma SQL)
// ----------------------------------------------------------------------------

export interface User {
  id: string;
  phone: string;
  phone_verified: boolean;
  email?: string | null;
  email_verified: boolean;
  first_name: string;
  last_name: string;
  display_name: string;
  password_hash?: string | null;
  role: UserRole;
  is_active: boolean;
  is_blocked: boolean;
  blocked_reason?: string | null;
  blocked_at?: string | null;
  blocked_by?: string | null;
  failed_login_attempts: number;
  last_failed_login_at?: string | null;
  lockout_until?: string | null;
  preferred_language: string;
  timezone: string;
  created_at: string;
  updated_at: string;
  last_login_at?: string | null;
}

export interface School {
  id: string;
  code: string;
  name: string;
  short_name?: string | null;
  region?: string | null;
  province?: string | null;
  commune?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  logo_url?: string | null;
  is_active: boolean;
  commission_rate: number;
  commission_fixed: number;
  commission_type: 'rate' | 'fixed' | 'both';
  admin_user_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AcademicYear {
  id: string;
  school_id: string;
  label: string;
  start_date: string;
  end_date: string;
  status: AcademicYearStatus;
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

export interface Class {
  id: string;
  school_id: string;
  academic_year_id: string;
  name: string;
  level?: string | null;
  section?: string | null;
  tuition_amount: number;
  allow_installments: boolean;
  min_installment_amount: number;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  school_id: string;
  class_id: string;
  matricule: string;
  first_name: string;
  last_name: string;
  display_name: string;
  date_of_birth?: string | null;
  gender?: 'M' | 'F' | null;
  parent_user_id?: string | null;
  parent_phone?: string | null;
  parent_name?: string | null;
  is_active: boolean;
  enrolled_at: string;
  created_at: string;
  updated_at: string;
}

export interface TuitionAccount {
  id: string;
  student_id: string;
  academic_year_id: string;
  total_amount: number;
  paid_amount: number;
  balance: number; // computed
  discount_amount: number;
  discount_reason?: string | null;
  is_fully_paid: boolean; // computed
  created_at: string;
  updated_at: string;
  last_payment_at?: string | null;
}

export interface PaymentIntent {
  id: string;
  reference: string;
  tuition_account_id: string;
  initiated_by: string;
  amount: number;
  currency: string;
  channel: PaymentChannel;
  provider: PaymentProvider;
  status: PaymentStatus;
  provider_transaction_id?: string | null;
  provider_response?: Record<string, unknown> | null;
  expires_at: string;
  metadata: Record<string, unknown>;
  ip_address?: string | null;
  user_agent?: string | null;
  device_id?: string | null;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
}

export interface Payment {
  id: string;
  reference: string;
  tuition_account_id: string;
  payment_intent_id?: string | null;
  paid_by?: string | null;
  recorded_by?: string | null;
  amount: number;
  currency: string;
  channel: PaymentChannel;
  provider: PaymentProvider;
  commission_amount: number;
  commission_rate?: number | null;
  net_amount: number; // computed
  provider_transaction_id?: string | null;
  provider_reference?: string | null;
  provider_response?: Record<string, unknown> | null;
  status: PaymentStatus;
  payer_phone?: string | null;
  payer_name?: string | null;
  metadata: Record<string, unknown>;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Agent {
  id: string;
  user_id: string;
  school_id?: string | null;
  agent_code: string;
  daily_limit: number;
  transaction_limit: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ParentStudent {
  id: string;
  parent_user_id: string;
  student_id: string;
  relationship: string;
  is_primary: boolean;
  can_view_payments: boolean;
  can_make_payments: boolean;
  created_at: string;
}

export interface PaymentOtp {
  id: string;
  user_id?: string | null;
  phone: string;
  otp_hash: string;
  purpose: OtpPurpose;
  payment_intent_id?: string | null;
  expires_at: string;
  is_used: boolean;
  used_at?: string | null;
  attempts: number;
  max_attempts: number;
  ip_address?: string | null;
  created_at: string;
}

export interface WebhookEvent {
  id: string;
  provider: PaymentProvider;
  event_type: string;
  provider_event_id?: string | null;
  idempotency_key: string;
  raw_payload: Record<string, unknown>;
  headers?: Record<string, unknown> | null;
  signature_received?: string | null;
  signature_valid?: boolean | null;
  status: WebhookStatus;
  processing_error?: string | null;
  processed_at?: string | null;
  payment_intent_id?: string | null;
  payment_id?: string | null;
  ip_address?: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string | null;
  user_role?: UserRole | null;
  ip_address?: string | null;
  user_agent?: string | null;
  device_id?: string | null;
  action: AuditAction;
  resource_type: string;
  resource_id?: string | null;
  old_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  request_id?: string | null;
  session_id?: string | null;
  created_at: string;
}

export interface Device {
  id: string;
  user_id: string;
  device_id: string;
  device_type?: string | null;
  device_name?: string | null;
  platform?: string | null;
  app_version?: string | null;
  os_version?: string | null;
  is_trusted: boolean;
  trust_score: number;
  last_used_at: string;
  login_count: number;
  created_at: string;
}

// ----------------------------------------------------------------------------
// API REQUEST/RESPONSE TYPES
// ----------------------------------------------------------------------------

// Auth
export interface OtpRequestPayload {
  phone: string;
  purpose: OtpPurpose;
}

export interface OtpVerifyPayload {
  phone: string;
  otp: string;
  purpose: OtpPurpose;
  device_info?: {
    device_id: string;
    platform: string;
    app_version: string;
  };
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface AuthResponse extends AuthTokens {
  user: Pick<User, 'id' | 'phone' | 'first_name' | 'last_name' | 'role'>;
}

// Payments
export interface CreatePaymentIntentPayload {
  student_id: string;
  amount: number;
  channel: PaymentChannel;
  provider: PaymentProvider;
  return_url?: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentIntentResponse {
  id: string;
  reference: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  expires_at: string;
  payment_url?: string;
  provider_data?: Record<string, unknown>;
}

export interface AgentPaymentPayload {
  student_id: string;
  amount: number;
  channel: 'agent_cash' | 'agent_momo';
  payer_name?: string;
  payer_phone?: string;
  notes?: string;
  otp?: string;
}

// Webhooks
export interface CinetPayWebhookPayload {
  cpm_trans_id: string;
  cpm_site_id: string;
  cpm_trans_date: string;
  cpm_amount: string;
  cpm_currency: string;
  cpm_custom: string; // Notre référence payment_intent
  cpm_designation: string;
  cpm_payment_method: string;
  cpm_phone_prefixe: string;
  cpm_cel_player: string;
  cpm_result: string; // "00" = succès
  cpm_error_message: string;
  signature?: string;
}

export interface USSDWebhookPayload {
  transaction_id: string;
  school_code: string;
  student_matricule: string;
  amount: number;
  payer_msisdn: string;
  timestamp: string;
  status: 'SUCCESS' | 'FAILED';
  operator?: string;
}

// Students & Tuition
export interface StudentWithTuition extends Student {
  school: Pick<School, 'id' | 'code' | 'name'>;
  class: Pick<Class, 'id' | 'name'>;
  academic_year: string;
  tuition: {
    total_amount: number;
    paid_amount: number;
    balance: number;
    is_fully_paid: boolean;
    last_payment_at?: string | null;
  } | null;
}

export interface PaymentWithDetails extends Payment {
  student?: {
    matricule: string;
    name: string;
    class: string;
  };
  receipt_url?: string;
}

// School Dashboard
export interface SchoolStats {
  total_students: number;
  total_classes: number;
  total_collected: number;
  total_outstanding: number;
  collection_rate: number;
}

export interface ClassStats {
  id: string;
  name: string;
  level?: string | null;
  section?: string | null;
  tuition_amount: number;
  student_count: number;
  stats: {
    total_expected: number;
    total_collected: number;
    collection_rate: number;
  };
}

// Agent
export interface AgentInfo extends Agent {
  user: Pick<User, 'first_name' | 'last_name'>;
  school?: Pick<School, 'id' | 'name'> | null;
  limits: {
    daily_limit: number;
    transaction_limit: number;
    daily_used: number;
    daily_remaining: number;
  };
  today_stats: {
    transactions: number;
    total_amount: number;
  };
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
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

// ----------------------------------------------------------------------------
// API ERROR TYPES
// ----------------------------------------------------------------------------

export type ApiErrorCode = 
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'TOO_MANY_REQUESTS'
  | 'PAYMENT_FAILED'
  | 'DUPLICATE_PAYMENT'
  | 'INSUFFICIENT_AMOUNT'
  | 'STUDENT_NOT_FOUND'
  | 'SCHOOL_NOT_FOUND'
  | 'INVALID_OTP'
  | 'OTP_EXPIRED'
  | 'ACCOUNT_LOCKED'
  | 'INTERNAL_ERROR';

export interface ApiError {
  error: ApiErrorCode;
  message: string;
  details?: Record<string, string>;
  retry_after?: number;
}

// ----------------------------------------------------------------------------
// SUPABASE DATABASE TYPES (pour le client)
// ----------------------------------------------------------------------------

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'display_name' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id' | 'display_name' | 'created_at'>>;
      };
      schools: {
        Row: School;
        Insert: Omit<School, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<School, 'id' | 'created_at'>>;
      };
      academic_years: {
        Row: AcademicYear;
        Insert: Omit<AcademicYear, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<AcademicYear, 'id' | 'created_at'>>;
      };
      classes: {
        Row: Class;
        Insert: Omit<Class, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Class, 'id' | 'created_at'>>;
      };
      students: {
        Row: Student;
        Insert: Omit<Student, 'id' | 'display_name' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Student, 'id' | 'display_name' | 'created_at'>>;
      };
      tuition_accounts: {
        Row: TuitionAccount;
        Insert: Omit<TuitionAccount, 'id' | 'balance' | 'is_fully_paid' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<TuitionAccount, 'id' | 'balance' | 'is_fully_paid' | 'created_at'>>;
      };
      payment_intents: {
        Row: PaymentIntent;
        Insert: Omit<PaymentIntent, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<PaymentIntent, 'id' | 'created_at'>>;
      };
      payments: {
        Row: Payment;
        Insert: Omit<Payment, 'id' | 'net_amount' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Payment, 'id' | 'net_amount' | 'created_at'>>;
      };
      agents: {
        Row: Agent;
        Insert: Omit<Agent, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Agent, 'id' | 'created_at'>>;
      };
      parent_students: {
        Row: ParentStudent;
        Insert: Omit<ParentStudent, 'id' | 'created_at'>;
        Update: Partial<Omit<ParentStudent, 'id' | 'created_at'>>;
      };
      payment_otps: {
        Row: PaymentOtp;
        Insert: Omit<PaymentOtp, 'id' | 'created_at'>;
        Update: Partial<Omit<PaymentOtp, 'id' | 'created_at'>>;
      };
      webhook_events: {
        Row: WebhookEvent;
        Insert: Omit<WebhookEvent, 'id' | 'created_at'>;
        Update: Partial<Omit<WebhookEvent, 'id' | 'created_at'>>;
      };
      audit_logs: {
        Row: AuditLog;
        Insert: Omit<AuditLog, 'id' | 'created_at'>;
        Update: never; // Append-only
      };
      devices: {
        Row: Device;
        Insert: Omit<Device, 'id' | 'created_at'>;
        Update: Partial<Omit<Device, 'id' | 'created_at'>>;
      };
    };
    Functions: {
      calculate_commission: {
        Args: { p_amount: number; p_school_id: string };
        Returns: number;
      };
      generate_payment_reference: {
        Args: { p_prefix?: string };
        Returns: string;
      };
    };
  };
}
