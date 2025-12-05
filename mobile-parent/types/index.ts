// ============================================================================
// TYPES - Application Mobile Parent
// ============================================================================

// User & Auth
export interface User {
  id: string;
  phone: string;
  first_name: string;
  last_name: string;
  role: 'parent' | 'school_admin' | 'agent' | 'platform_admin';
  email?: string;
  preferred_language: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  accessToken: string | null;
  refreshToken: string | null;
}

// OTP
export interface OtpRequestResponse {
  success: boolean;
  message: string;
  otp_id: string;
  expires_in: number;
  masked_phone: string;
}

export interface OtpVerifyResponse {
  success: boolean;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: User;
}

// Schools & Students
export interface School {
  id: string;
  code: string;
  name: string;
  logo_url?: string;
}

export interface Class {
  id: string;
  name: string;
  level?: string;
}

export interface Student {
  id: string;
  matricule: string;
  first_name: string;
  last_name: string;
  school: School;
  class: Class;
  academic_year: string;
  tuition: TuitionAccount | null;
}

export interface TuitionAccount {
  total_amount: number;
  paid_amount: number;
  balance: number;
  is_fully_paid: boolean;
  last_payment_at?: string;
}

// Payments
export type PaymentStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type PaymentChannel = 
  | 'app_mobile'
  | 'ussd'
  | 'agent_cash'
  | 'agent_momo';

export type PaymentProvider = 
  | 'cinetpay'
  | 'orange_money'
  | 'moov_money';

export interface Payment {
  id: string;
  reference: string;
  amount: number;
  channel: PaymentChannel;
  provider: PaymentProvider;
  status: PaymentStatus;
  created_at: string;
  receipt_url?: string;
}

export interface PaymentIntent {
  id: string;
  reference: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  expires_at: string;
  payment_url?: string;
  provider_data?: Record<string, unknown>;
}

export interface CreatePaymentIntentRequest {
  student_id: string;
  amount: number;
  channel: PaymentChannel;
  provider: PaymentProvider;
  return_url?: string;
}

// API Pagination
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// Navigation params
export type RootStackParamList = {
  '(auth)': undefined;
  '(tabs)': undefined;
  'payment/[studentId]': { studentId: string };
  'payment/status/[intentId]': { intentId: string };
  'student/[studentId]': { studentId: string };
};

// Form states
export interface PhoneInputState {
  value: string;
  isValid: boolean;
  error?: string;
}

export interface OtpInputState {
  value: string;
  isComplete: boolean;
}

// UI States
export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface ErrorState {
  hasError: boolean;
  message?: string;
  code?: string;
  retry?: () => void;
}
