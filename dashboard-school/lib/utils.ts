// ============================================================================
// UTILITIES - Fonctions utilitaires
// ============================================================================

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

// ============================================================================
// CLASSNAMES
// ============================================================================

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================================
// FORMAT MONÉTAIRE
// ============================================================================

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' FCFA';
}

export function formatCurrencyCompact(amount: number): string {
  if (amount >= 1000000) {
    return (amount / 1000000).toFixed(1).replace('.0', '') + 'M';
  }
  if (amount >= 1000) {
    return (amount / 1000).toFixed(0) + 'K';
  }
  return String(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('fr-FR').format(num);
}

export function formatPercent(value: number, decimals: number = 1): string {
  return value.toFixed(decimals) + '%';
}

// ============================================================================
// FORMAT DATES
// ============================================================================

export function formatDate(dateString: string, formatStr: string = 'dd/MM/yyyy'): string {
  try {
    return format(parseISO(dateString), formatStr, { locale: fr });
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string): string {
  try {
    return format(parseISO(dateString), "dd/MM/yyyy 'à' HH:mm", { locale: fr });
  } catch {
    return dateString;
  }
}

export function formatRelative(dateString: string): string {
  try {
    return formatDistanceToNow(parseISO(dateString), { addSuffix: true, locale: fr });
  } catch {
    return dateString;
  }
}

export function formatDateLong(dateString: string): string {
  try {
    return format(parseISO(dateString), "EEEE d MMMM yyyy", { locale: fr });
  } catch {
    return dateString;
  }
}

// ============================================================================
// FORMAT TÉLÉPHONE
// ============================================================================

export function formatPhone(phone: string): string {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11 && cleaned.startsWith('226')) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 7)} ${cleaned.slice(7, 9)} ${cleaned.slice(9)}`;
  }
  if (cleaned.length === 8) {
    return `+226 ${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6)}`;
  }
  return phone;
}

// ============================================================================
// STATUS HELPERS
// ============================================================================

export function getPaymentStatusConfig(status: string): { label: string; color: string; bgColor: string } {
  const configs: Record<string, { label: string; color: string; bgColor: string }> = {
    completed: { label: 'Réussi', color: 'text-success-600', bgColor: 'bg-success-50' },
    pending: { label: 'En attente', color: 'text-warning-600', bgColor: 'bg-warning-50' },
    processing: { label: 'En cours', color: 'text-info-600', bgColor: 'bg-info-50' },
    failed: { label: 'Échoué', color: 'text-error-600', bgColor: 'bg-error-50' },
    cancelled: { label: 'Annulé', color: 'text-earth-600', bgColor: 'bg-earth-100' },
    refunded: { label: 'Remboursé', color: 'text-info-600', bgColor: 'bg-info-50' },
  };
  return configs[status] || { label: status, color: 'text-earth-600', bgColor: 'bg-earth-100' };
}

export function getChannelConfig(channel: string): { label: string; icon: string } {
  const configs: Record<string, { label: string; icon: string }> = {
    app_mobile: { label: 'Application', icon: 'smartphone' },
    ussd: { label: 'USSD', icon: 'hash' },
    agent_cash: { label: 'Agent (Cash)', icon: 'users' },
    agent_momo: { label: 'Agent (MoMo)', icon: 'users' },
    bank_transfer: { label: 'Virement', icon: 'building' },
    other: { label: 'Autre', icon: 'circle' },
  };
  return configs[channel] || { label: channel, icon: 'circle' };
}

export function getProviderConfig(provider: string): { label: string; color: string } {
  const configs: Record<string, { label: string; color: string }> = {
    orange_money: { label: 'Orange Money', color: '#FF6600' },
    moov_money: { label: 'Moov Money', color: '#00A0E9' },
    cinetpay: { label: 'CinetPay', color: '#0066CC' },
    coris_money: { label: 'Coris Money', color: '#8B0000' },
    manual: { label: 'Manuel', color: '#6B5B4D' },
  };
  return configs[provider] || { label: provider, color: '#6B5B4D' };
}

export function getPaymentProgressStatus(paid: number, total: number): 'paid' | 'partial' | 'unpaid' {
  if (paid >= total) return 'paid';
  if (paid > 0) return 'partial';
  return 'unpaid';
}

export function getProgressStatusConfig(status: 'paid' | 'partial' | 'unpaid'): { label: string; color: string; bgColor: string } {
  const configs = {
    paid: { label: 'Soldé', color: 'text-success-600', bgColor: 'bg-success-50' },
    partial: { label: 'Partiel', color: 'text-warning-600', bgColor: 'bg-warning-50' },
    unpaid: { label: 'Non payé', color: 'text-error-600', bgColor: 'bg-error-50' },
  };
  return configs[status];
}

// ============================================================================
// CALCULATIONS
// ============================================================================

export function calculateProgress(paid: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((paid / total) * 100));
}

export function calculateCommission(amount: number, rate: number, fixed: number, type: 'rate' | 'fixed' | 'both'): number {
  switch (type) {
    case 'fixed':
      return fixed;
    case 'rate':
      return Math.round(amount * rate);
    case 'both':
      return Math.round(fixed + amount * rate);
    default:
      return 0;
  }
}

// ============================================================================
// VALIDATION
// ============================================================================

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return /^(226)?[5670]\d{7}$/.test(cleaned);
}

export function isValidMatricule(matricule: string): boolean {
  return /^[A-Z0-9]{4,20}$/i.test(matricule);
}

// ============================================================================
// TEXT HELPERS
// ============================================================================

export function getInitials(firstName: string, lastName: string): string {
  return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length - 3) + '...';
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ============================================================================
// FILE HELPERS
// ============================================================================

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2).toLowerCase();
}

// ============================================================================
// ARRAY HELPERS
// ============================================================================

export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

export function sortBy<T>(array: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
}

// ============================================================================
// DOWNLOAD HELPERS
// ============================================================================

export function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadCSV(data: Record<string, unknown>[], filename: string): void {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(h => `"${row[h] ?? ''}"`).join(','))
  ].join('\n');
  
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadFile(blob, filename);
}
