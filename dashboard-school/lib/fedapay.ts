/**
 * FedaPay Integration Helper
 *
 * Configuration et fonctions utilitaires pour FedaPay
 * Supporte: Orange Money, Moov Money, Coris Money, Visa/Mastercard
 */

import { FedaPay, Transaction } from 'fedapay';

// Configuration
export function configureFedaPay() {
  const secretKey = process.env.FEDAPAY_SECRET_KEY;
  const environment = process.env.NEXT_PUBLIC_FEDAPAY_ENVIRONMENT || 'live';

  if (!secretKey) {
    throw new Error('FEDAPAY_SECRET_KEY is not configured');
  }

  FedaPay.setApiKey(secretKey);
  FedaPay.setEnvironment(environment);
}

// Types
export interface CreatePaymentParams {
  amount: number;
  description: string;
  customer: {
    firstname: string;
    lastname: string;
    email: string;
    phone: string;
  };
  metadata?: Record<string, any>;
  callbackUrl?: string;
}

export interface PaymentResult {
  transactionId: string | number;
  token: string;
  paymentUrl: string;
  qrCodeUrl?: string;
}

/**
 * Créer une transaction de paiement FedaPay
 */
export async function createPayment(
  params: CreatePaymentParams
): Promise<PaymentResult> {
  configureFedaPay();

  const transaction = await Transaction.create({
    description: params.description,
    amount: params.amount,
    currency: {
      iso: 'XOF',
    },
    callback_url: params.callbackUrl || `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/fedapay`,
    customer: {
      firstname: params.customer.firstname,
      lastname: params.customer.lastname,
      email: params.customer.email,
      phone_number: {
        number: params.customer.phone,
        country: 'BF', // Burkina Faso
      },
    },
    custom_metadata: params.metadata || {},
  });

  const token = await transaction.generateToken();

  return {
    transactionId: transaction.id,
    token: token.token,
    paymentUrl: token.url,
    qrCodeUrl: token.qr_code_url,
  };
}

/**
 * Récupérer le statut d'une transaction
 */
export async function getTransactionStatus(transactionId: string | number) {
  configureFedaPay();

  try {
    const transaction = await Transaction.retrieve(transactionId);
    return {
      id: transaction.id,
      status: transaction.status,
      amount: transaction.amount,
      currency: transaction.currency,
      customer: transaction.customer,
      approved_at: transaction.approved_at,
      transferred_at: transaction.transferred_at,
      description: transaction.description,
      custom_metadata: transaction.custom_metadata,
    };
  } catch (error: any) {
    console.error('Error retrieving transaction:', error);
    throw new Error(`Failed to retrieve transaction: ${error.message}`);
  }
}

/**
 * Mapper les statuts FedaPay vers nos statuts internes
 */
export function mapFedaPayStatus(
  fedapayStatus: string
): 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' {
  switch (fedapayStatus) {
    case 'approved':
    case 'transferred':
      return 'completed';
    case 'pending':
      return 'pending';
    case 'canceled':
    case 'cancelled':
      return 'cancelled';
    case 'declined':
      return 'failed';
    default:
      return 'processing';
  }
}

/**
 * Vérifier si FedaPay est configuré correctement
 */
export function isFedaPayConfigured(): boolean {
  return !!(
    process.env.FEDAPAY_SECRET_KEY &&
    process.env.NEXT_PUBLIC_FEDAPAY_PUBLIC_KEY
  );
}

/**
 * Obtenir la configuration publique pour le frontend
 */
export function getFedaPayPublicConfig() {
  return {
    publicKey: process.env.NEXT_PUBLIC_FEDAPAY_PUBLIC_KEY,
    environment: process.env.NEXT_PUBLIC_FEDAPAY_ENVIRONMENT || 'live',
    isConfigured: isFedaPayConfigured(),
  };
}

/**
 * Méthodes de paiement supportées
 */
export const SUPPORTED_PAYMENT_METHODS = [
  {
    id: 'orange_money',
    name: 'Orange Money',
    icon: '🟠',
    description: 'Paiement via Orange Money Burkina Faso',
  },
  {
    id: 'moov_money',
    name: 'Moov Money',
    icon: '🔵',
    description: 'Paiement via Moov Money Burkina Faso',
  },
  {
    id: 'coris_money',
    name: 'Coris Money',
    icon: '🟢',
    description: 'Paiement via Coris Money',
  },
  {
    id: 'card',
    name: 'Carte bancaire',
    icon: '💳',
    description: 'Visa, Mastercard',
  },
] as const;

/**
 * Formater un montant en FCFA
 */
export function formatCFA(amount: number): string {
  return new Intl.NumberFormat('fr-BF', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
