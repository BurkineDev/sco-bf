// ============================================================================
// UTILITAIRES - Helpers et fonctions communes
// ============================================================================

import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

// ============================================================================
// FORMAT MONÉTAIRE
// ============================================================================

/**
 * Formate un montant en FCFA
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' FCFA';
}

/**
 * Formate un montant compact (ex: 1.5M)
 */
export function formatCurrencyCompact(amount: number): string {
  if (amount >= 1000000) {
    return (amount / 1000000).toFixed(1).replace('.0', '') + 'M FCFA';
  }
  if (amount >= 1000) {
    return (amount / 1000).toFixed(0) + 'K FCFA';
  }
  return amount + ' FCFA';
}

// ============================================================================
// FORMAT TÉLÉPHONE
// ============================================================================

/**
 * Normalise un numéro de téléphone burkinabè
 */
export function normalizePhone(phone: string): string {
  // Supprimer tout sauf les chiffres
  let cleaned = phone.replace(/\D/g, '');
  
  // Ajouter le préfixe Burkina si nécessaire
  if (cleaned.length === 8) {
    cleaned = '226' + cleaned;
  }
  
  // Ajouter le +
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  
  return cleaned;
}

/**
 * Formate un numéro pour l'affichage
 */
export function formatPhone(phone: string): string {
  const normalized = normalizePhone(phone);
  // Format: +226 70 12 34 56
  return normalized.replace(/(\+226)(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
}

/**
 * Masque un numéro de téléphone
 */
export function maskPhone(phone: string): string {
  const normalized = normalizePhone(phone);
  if (normalized.length < 8) return normalized;
  return normalized.slice(0, 7) + '****' + normalized.slice(-2);
}

/**
 * Valide un numéro burkinabè
 */
export function isValidBurkinaPhone(phone: string): boolean {
  const normalized = normalizePhone(phone);
  // +226 suivi de 8 chiffres commençant par 5, 6, 7 ou 0
  return /^\+226[5670]\d{7}$/.test(normalized);
}

// ============================================================================
// FORMAT DATES
// ============================================================================

/**
 * Formate une date ISO
 */
export function formatDate(dateString: string, formatStr: string = 'dd/MM/yyyy'): string {
  try {
    return format(parseISO(dateString), formatStr, { locale: fr });
  } catch {
    return dateString;
  }
}

/**
 * Formate une date relative (il y a X)
 */
export function formatRelativeDate(dateString: string): string {
  try {
    return formatDistanceToNow(parseISO(dateString), { 
      addSuffix: true, 
      locale: fr 
    });
  } catch {
    return dateString;
  }
}

/**
 * Formate date + heure
 */
export function formatDateTime(dateString: string): string {
  try {
    return format(parseISO(dateString), "dd/MM/yyyy 'à' HH:mm", { locale: fr });
  } catch {
    return dateString;
  }
}

// ============================================================================
// PAIEMENT HELPERS
// ============================================================================

/**
 * Calcule le pourcentage payé
 */
export function calculatePaymentProgress(paid: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((paid / total) * 100));
}

/**
 * Obtient la couleur selon le statut de paiement
 */
export function getPaymentStatusColor(status: string): string {
  switch (status) {
    case 'completed':
      return '#10B981'; // success
    case 'pending':
    case 'processing':
      return '#F59E0B'; // warning
    case 'failed':
    case 'cancelled':
      return '#EF4444'; // error
    default:
      return '#8C7B6B'; // neutral
  }
}

/**
 * Traduit le statut de paiement
 */
export function translatePaymentStatus(status: string): string {
  const translations: Record<string, string> = {
    pending: 'En attente',
    processing: 'En cours',
    completed: 'Réussi',
    failed: 'Échoué',
    cancelled: 'Annulé',
    refunded: 'Remboursé',
  };
  return translations[status] || status;
}

/**
 * Traduit le canal de paiement
 */
export function translatePaymentChannel(channel: string): string {
  const translations: Record<string, string> = {
    app_mobile: 'Application',
    ussd: 'USSD',
    agent_cash: 'Agent (Cash)',
    agent_momo: 'Agent (Mobile Money)',
    bank_transfer: 'Virement',
  };
  return translations[channel] || channel;
}

/**
 * Traduit le provider
 */
export function translateProvider(provider: string): string {
  const translations: Record<string, string> = {
    cinetpay: 'CinetPay',
    orange_money: 'Orange Money',
    moov_money: 'Moov Money',
    coris_money: 'Coris Money',
    manual: 'Manuel',
  };
  return translations[provider] || provider;
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Valide un OTP (6 chiffres)
 */
export function isValidOtp(otp: string): boolean {
  return /^\d{6}$/.test(otp);
}

/**
 * Valide un montant
 */
export function isValidAmount(amount: number, min: number = 1000, max: number = 10000000): boolean {
  return amount >= min && amount <= max;
}

// ============================================================================
// TEXTE
// ============================================================================

/**
 * Capitalise la première lettre
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Obtient les initiales d'un nom
 */
export function getInitials(firstName: string, lastName: string): string {
  return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
}

/**
 * Tronque un texte
 */
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length - 3) + '...';
}

// ============================================================================
// MONTANTS SUGGÉRÉS
// ============================================================================

/**
 * Génère des montants suggérés basés sur le reliquat
 */
export function getSuggestedAmounts(balance: number): number[] {
  if (balance <= 0) return [];
  
  const suggestions: number[] = [];
  
  // Montant complet
  suggestions.push(balance);
  
  // Moitié
  if (balance >= 10000) {
    suggestions.push(Math.round(balance / 2 / 1000) * 1000);
  }
  
  // Quart
  if (balance >= 20000) {
    suggestions.push(Math.round(balance / 4 / 1000) * 1000);
  }
  
  // Montants fixes communs
  const fixedAmounts = [5000, 10000, 25000, 50000, 100000];
  fixedAmounts.forEach(amount => {
    if (amount < balance && !suggestions.includes(amount)) {
      suggestions.push(amount);
    }
  });
  
  // Trier et limiter à 4
  return [...new Set(suggestions)].sort((a, b) => a - b).slice(0, 4);
}
