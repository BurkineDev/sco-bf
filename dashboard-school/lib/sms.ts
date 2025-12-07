/**
 * SMS & OTP Helper - Africa's Talking Integration
 *
 * Gestion de l'envoi de SMS et codes OTP
 * Fournisseur: Africa's Talking (Burkina Faso)
 */

import AfricasTalking from 'africastalking';
import { supabase } from './supabase';

// Configuration Africa's Talking
const credentials = {
  apiKey: process.env.AFRICASTALKING_API_KEY!,
  username: process.env.AFRICASTALKING_USERNAME || 'sandbox',
};

let africastalking: ReturnType<typeof AfricasTalking> | null = null;

/**
 * Initialiser Africa's Talking
 */
export function initAfricasTalking() {
  if (!africastalking) {
    if (!credentials.apiKey) {
      throw new Error('AFRICASTALKING_API_KEY is not configured');
    }
    africastalking = AfricasTalking(credentials);
  }
  return africastalking;
}

/**
 * Générer un code OTP à 6 chiffres
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Envoyer un SMS via Africa's Talking
 */
export async function sendSMS(phoneNumber: string, message: string) {
  const at = initAfricasTalking();
  const sms = at.SMS;

  try {
    const result = await sms.send({
      to: [phoneNumber],
      message: message,
      from: process.env.NEXT_PUBLIC_AFRICASTALKING_SENDER_ID || 'ScolariteBF',
    });

    console.log('SMS sent successfully:', result);
    return {
      success: true,
      result,
    };
  } catch (error: any) {
    console.error('Error sending SMS:', error);
    throw new Error(`Failed to send SMS: ${error.message}`);
  }
}

/**
 * Envoyer un code OTP par SMS
 */
export async function sendOTP(
  phoneNumber: string,
  purpose: 'login' | 'payment_confirmation' | 'phone_verification' | 'password_reset' = 'login'
): Promise<{ success: boolean; otp?: string; expires_at?: string }> {
  try {
    // Nettoyer le numéro de téléphone
    const cleanPhone = phoneNumber.trim().replace(/\s/g, '');

    // Générer le code OTP
    const otp = generateOTP();

    // Calculer l'expiration (5 minutes)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    // Sauvegarder l'OTP dans Supabase
    const { error: dbError } = await supabase.from('otp_codes').insert({
      phone_number: cleanPhone,
      code: otp,
      purpose,
      expires_at: expiresAt.toISOString(),
      is_used: false,
    });

    if (dbError) {
      console.error('Error saving OTP to database:', dbError);
      throw new Error('Failed to save OTP');
    }

    // Préparer le message selon le contexte
    let message = '';
    switch (purpose) {
      case 'login':
        message = `ScolaritéBF: Votre code de connexion est ${otp}. Valide 5 minutes.`;
        break;
      case 'payment_confirmation':
        message = `ScolaritéBF: Confirmez le paiement avec le code ${otp}. Valide 5 minutes.`;
        break;
      case 'phone_verification':
        message = `ScolaritéBF: Votre code de vérification est ${otp}. Valide 5 minutes.`;
        break;
      case 'password_reset':
        message = `ScolaritéBF: Votre code de réinitialisation est ${otp}. Valide 5 minutes.`;
        break;
    }

    // Envoyer le SMS
    await sendSMS(cleanPhone, message);

    return {
      success: true,
      otp: process.env.NODE_ENV === 'development' ? otp : undefined, // OTP visible seulement en dev
      expires_at: expiresAt.toISOString(),
    };
  } catch (error: any) {
    console.error('Error in sendOTP:', error);
    return {
      success: false,
    };
  }
}

/**
 * Vérifier un code OTP
 */
export async function verifyOTP(
  phoneNumber: string,
  code: string,
  purpose: 'login' | 'payment_confirmation' | 'phone_verification' | 'password_reset' = 'login'
): Promise<{ valid: boolean; error?: string }> {
  try {
    const cleanPhone = phoneNumber.trim().replace(/\s/g, '');

    // Récupérer l'OTP de la base de données
    const { data: otpRecord, error: fetchError } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('phone_number', cleanPhone)
      .eq('code', code)
      .eq('purpose', purpose)
      .eq('is_used', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !otpRecord) {
      return {
        valid: false,
        error: 'Code invalide',
      };
    }

    // Vérifier l'expiration
    const now = new Date();
    const expiresAt = new Date(otpRecord.expires_at);

    if (now > expiresAt) {
      return {
        valid: false,
        error: 'Code expiré',
      };
    }

    // Marquer comme utilisé
    const { error: updateError } = await supabase
      .from('otp_codes')
      .update({
        is_used: true,
        used_at: new Date().toISOString(),
      })
      .eq('id', otpRecord.id);

    if (updateError) {
      console.error('Error marking OTP as used:', updateError);
    }

    return {
      valid: true,
    };
  } catch (error: any) {
    console.error('Error in verifyOTP:', error);
    return {
      valid: false,
      error: 'Erreur de vérification',
    };
  }
}

/**
 * Nettoyer les anciens OTP expirés (à exécuter périodiquement)
 */
export async function cleanupExpiredOTPs() {
  const { error } = await supabase
    .from('otp_codes')
    .delete()
    .lt('expires_at', new Date().toISOString());

  if (error) {
    console.error('Error cleaning up expired OTPs:', error);
  }
}

/**
 * Vérifier si Africa's Talking est configuré
 */
export function isSMSConfigured(): boolean {
  return !!(
    process.env.AFRICASTALKING_API_KEY &&
    process.env.AFRICASTALKING_USERNAME
  );
}

/**
 * Formater un numéro de téléphone pour le Burkina Faso
 * Accepte: 70123456, +22670123456, 0022670123456
 * Retourne: +22670123456
 */
export function formatBurkinabePhone(phone: string): string {
  // Supprimer espaces et tirets
  let cleaned = phone.replace(/[\s-]/g, '');

  // Si commence par 00226, remplacer par +226
  if (cleaned.startsWith('00226')) {
    cleaned = '+' + cleaned.substring(2);
  }
  // Si commence par 226 sans +, ajouter +
  else if (cleaned.startsWith('226') && !cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  // Si commence par 0 (format local), remplacer par +226
  else if (cleaned.startsWith('0')) {
    cleaned = '+226' + cleaned.substring(1);
  }
  // Si c'est juste 8 chiffres, ajouter +226
  else if (cleaned.length === 8 && /^\d{8}$/.test(cleaned)) {
    cleaned = '+226' + cleaned;
  }

  // Validation finale
  if (!cleaned.startsWith('+226') || cleaned.length !== 12) {
    throw new Error('Numéro de téléphone invalide pour le Burkina Faso');
  }

  return cleaned;
}

/**
 * Obtenir le solde SMS Africa's Talking (pour monitoring)
 */
export async function getSMSBalance() {
  try {
    const at = initAfricasTalking();
    const app = at.APPLICATION;

    const data = await app.fetchApplicationData();
    return {
      balance: data.UserData?.balance || 'Unknown',
    };
  } catch (error: any) {
    console.error('Error fetching SMS balance:', error);
    return {
      balance: 'Error',
      error: error.message,
    };
  }
}
