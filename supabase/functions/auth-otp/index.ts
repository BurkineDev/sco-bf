// ============================================================================
// SUPABASE EDGE FUNCTION: OTP AUTH
// Path: supabase/functions/auth-otp/index.ts
// 
// Gestion complète OTP: envoi, vérification, rate limiting
// ============================================================================

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { createHash, randomInt } from 'https://deno.land/std@0.177.0/node/crypto.ts';

// Configuration
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const JWT_SECRET = Deno.env.get('JWT_SECRET')!;
const SMS_API_URL = Deno.env.get('SMS_API_URL')!;
const SMS_API_KEY = Deno.env.get('SMS_API_KEY')!;

// Constants
const OTP_LENGTH = 6;
const OTP_EXPIRY_SECONDS = 300; // 5 minutes
const OTP_MAX_ATTEMPTS = 3;
const RATE_LIMIT_PER_PHONE = 5; // Max OTP par heure
const RATE_LIMIT_WINDOW_SECONDS = 3600;
const JWT_ACCESS_EXPIRY = 900; // 15 minutes
const JWT_REFRESH_EXPIRY = 604800; // 7 jours
const LOCKOUT_DURATION = 1800; // 30 minutes

// CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-device-id',
};

// Types
type OtpPurpose = 'login' | 'payment_confirmation' | 'phone_verification' | 'password_reset';

interface OtpRequestPayload {
  phone: string;
  purpose: OtpPurpose;
}

interface OtpVerifyPayload {
  phone: string;
  otp: string;
  purpose: OtpPurpose;
  device_info?: {
    device_id: string;
    platform: string;
    app_version: string;
  };
}

// Hash OTP (SHA-256)
function hashOtp(otp: string): string {
  return createHash('sha256').update(otp).digest('hex');
}

// Générer OTP numérique
function generateOtp(): string {
  return String(randomInt(100000, 999999));
}

// Normaliser téléphone
function normalizePhone(phone: string): string {
  let p = phone.replace(/\D/g, '');
  if (p.length === 8) p = '226' + p;
  if (!p.startsWith('+')) p = '+' + p;
  return p;
}

// Masquer téléphone
function maskPhone(phone: string): string {
  const normalized = normalizePhone(phone);
  if (normalized.length < 8) return normalized;
  return normalized.slice(0, 6) + '****' + normalized.slice(-2);
}

// Générer JWT
async function generateTokens(userId: string, role: string): Promise<{ access: string; refresh: string }> {
  const now = Math.floor(Date.now() / 1000);
  
  // Note: En production, utiliser jose ou une lib JWT Deno
  // Ceci est une implémentation simplifiée
  const accessPayload = {
    sub: userId,
    role,
    iat: now,
    exp: now + JWT_ACCESS_EXPIRY,
    type: 'access',
  };

  const refreshPayload = {
    sub: userId,
    iat: now,
    exp: now + JWT_REFRESH_EXPIRY,
    type: 'refresh',
  };

  // En production: signer avec jose/jwt
  const access = btoa(JSON.stringify(accessPayload));
  const refresh = btoa(JSON.stringify(refreshPayload));

  return { access, refresh };
}

// Envoyer SMS
async function sendOtpSms(phone: string, otp: string): Promise<boolean> {
  const message = `[Scolarité BF] Votre code de vérification est: ${otp}. Valide 5 minutes. Ne le partagez pas.`;

  try {
    const response = await fetch(SMS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SMS_API_KEY}`,
      },
      body: JSON.stringify({ to: phone, message }),
    });
    return response.ok;
  } catch (error) {
    console.error('SMS error:', error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.split('/').pop();

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';

  // ============================================================================
  // POST /auth-otp/request - Demande OTP
  // ============================================================================
  if (path === 'request' && req.method === 'POST') {
    try {
      const payload: OtpRequestPayload = await req.json();
      
      if (!payload.phone || !payload.purpose) {
        return new Response(
          JSON.stringify({ error: 'VALIDATION_ERROR', message: 'phone et purpose requis' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const phone = normalizePhone(payload.phone);
      const validPurposes: OtpPurpose[] = ['login', 'payment_confirmation', 'phone_verification', 'password_reset'];
      
      if (!validPurposes.includes(payload.purpose)) {
        return new Response(
          JSON.stringify({ error: 'VALIDATION_ERROR', message: 'purpose invalide' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Rate limiting: compter les OTP récents pour ce téléphone
      const rateLimitWindow = new Date(Date.now() - RATE_LIMIT_WINDOW_SECONDS * 1000).toISOString();
      
      const { count: recentOtps } = await supabase
        .from('payment_otps')
        .select('id', { count: 'exact', head: true })
        .eq('phone', phone)
        .gte('created_at', rateLimitWindow);

      if ((recentOtps || 0) >= RATE_LIMIT_PER_PHONE) {
        // Log tentative
        await supabase.from('audit_logs').insert({
          action: 'suspicious_activity',
          resource_type: 'otp',
          metadata: { reason: 'rate_limit_exceeded', phone, ip: clientIP },
          ip_address: clientIP,
        });

        return new Response(
          JSON.stringify({ 
            error: 'TOO_MANY_REQUESTS', 
            message: 'Trop de demandes OTP. Réessayez dans 1 heure.',
            retry_after: RATE_LIMIT_WINDOW_SECONDS 
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Vérifier si le compte est bloqué (pour login)
      if (payload.purpose === 'login') {
        const { data: user } = await supabase
          .from('users')
          .select('id, is_blocked, lockout_until')
          .eq('phone', phone)
          .single();

        if (user?.is_blocked) {
          return new Response(
            JSON.stringify({ error: 'ACCOUNT_LOCKED', message: 'Compte bloqué. Contactez le support.' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (user?.lockout_until && new Date(user.lockout_until) > new Date()) {
          const remainingSeconds = Math.ceil((new Date(user.lockout_until).getTime() - Date.now()) / 1000);
          return new Response(
            JSON.stringify({ 
              error: 'ACCOUNT_LOCKED', 
              message: `Compte temporairement bloqué. Réessayez dans ${Math.ceil(remainingSeconds / 60)} minutes.`,
              retry_after: remainingSeconds 
            }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Générer OTP
      const otp = generateOtp();
      const otpHash = hashOtp(otp);
      const expiresAt = new Date(Date.now() + OTP_EXPIRY_SECONDS * 1000).toISOString();

      // Invalider les OTP précédents non utilisés
      await supabase
        .from('payment_otps')
        .update({ is_used: true })
        .eq('phone', phone)
        .eq('purpose', payload.purpose)
        .eq('is_used', false);

      // Récupérer user_id si existe
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('phone', phone)
        .single();

      // Créer l'OTP
      const { data: otpRecord, error: otpError } = await supabase
        .from('payment_otps')
        .insert({
          user_id: existingUser?.id || null,
          phone,
          otp_hash: otpHash,
          purpose: payload.purpose,
          expires_at: expiresAt,
          max_attempts: OTP_MAX_ATTEMPTS,
          ip_address: clientIP,
        })
        .select()
        .single();

      if (otpError) {
        console.error('OTP insert error:', otpError);
        return new Response(
          JSON.stringify({ error: 'INTERNAL_ERROR', message: 'Erreur création OTP' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Envoyer SMS
      const smsSent = await sendOtpSms(phone, otp);
      
      if (!smsSent) {
        console.error('Failed to send OTP SMS to:', phone);
        // On continue quand même pour les tests
      }

      // Log
      await supabase.from('audit_logs').insert({
        user_id: existingUser?.id,
        action: 'otp_sent',
        resource_type: 'otp',
        resource_id: otpRecord.id,
        metadata: { phone, purpose: payload.purpose, sms_sent: smsSent },
        ip_address: clientIP,
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: 'OTP envoyé',
          otp_id: otpRecord.id,
          expires_in: OTP_EXPIRY_SECONDS,
          masked_phone: maskPhone(phone),
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      console.error('OTP request error:', error);
      return new Response(
        JSON.stringify({ error: 'INTERNAL_ERROR', message: 'Erreur interne' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  // ============================================================================
  // POST /auth-otp/verify - Vérification OTP
  // ============================================================================
  if (path === 'verify' && req.method === 'POST') {
    try {
      const payload: OtpVerifyPayload = await req.json();

      if (!payload.phone || !payload.otp || !payload.purpose) {
        return new Response(
          JSON.stringify({ error: 'VALIDATION_ERROR', message: 'phone, otp et purpose requis' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const phone = normalizePhone(payload.phone);
      const otpHash = hashOtp(payload.otp);

      // Récupérer l'OTP valide le plus récent
      const { data: otpRecord, error: otpError } = await supabase
        .from('payment_otps')
        .select('*')
        .eq('phone', phone)
        .eq('purpose', payload.purpose)
        .eq('is_used', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (otpError || !otpRecord) {
        return new Response(
          JSON.stringify({ 
            error: 'INVALID_OTP', 
            message: 'Code OTP invalide ou expiré',
            attempts_remaining: 0 
          }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Vérifier le nombre de tentatives
      if (otpRecord.attempts >= otpRecord.max_attempts) {
        // Marquer comme utilisé
        await supabase
          .from('payment_otps')
          .update({ is_used: true })
          .eq('id', otpRecord.id);

        // Log
        await supabase.from('audit_logs').insert({
          user_id: otpRecord.user_id,
          action: 'otp_failed',
          resource_type: 'otp',
          resource_id: otpRecord.id,
          metadata: { reason: 'max_attempts_exceeded', phone },
          ip_address: clientIP,
        });

        return new Response(
          JSON.stringify({ 
            error: 'INVALID_OTP', 
            message: 'Nombre maximum de tentatives atteint. Demandez un nouveau code.',
            attempts_remaining: 0 
          }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Incrémenter les tentatives
      await supabase
        .from('payment_otps')
        .update({ attempts: otpRecord.attempts + 1 })
        .eq('id', otpRecord.id);

      // Vérifier le hash
      if (otpRecord.otp_hash !== otpHash) {
        const attemptsRemaining = otpRecord.max_attempts - otpRecord.attempts - 1;

        // Log
        await supabase.from('audit_logs').insert({
          user_id: otpRecord.user_id,
          action: 'otp_failed',
          resource_type: 'otp',
          resource_id: otpRecord.id,
          metadata: { reason: 'invalid_code', phone, attempts_remaining: attemptsRemaining },
          ip_address: clientIP,
        });

        // Bloquer le compte temporairement si trop de tentatives
        if (attemptsRemaining <= 0 && payload.purpose === 'login') {
          await supabase
            .from('users')
            .update({
              failed_login_attempts: otpRecord.max_attempts,
              last_failed_login_at: new Date().toISOString(),
              lockout_until: new Date(Date.now() + LOCKOUT_DURATION * 1000).toISOString(),
            })
            .eq('phone', phone);
        }

        return new Response(
          JSON.stringify({ 
            error: 'INVALID_OTP', 
            message: 'Code OTP invalide',
            attempts_remaining: Math.max(0, attemptsRemaining) 
          }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // OTP valide - marquer comme utilisé
      await supabase
        .from('payment_otps')
        .update({ is_used: true, used_at: new Date().toISOString() })
        .eq('id', otpRecord.id);

      // Pour login: récupérer ou créer l'utilisateur
      let user;
      
      if (payload.purpose === 'login') {
        const { data: existingUser } = await supabase
          .from('users')
          .select('*')
          .eq('phone', phone)
          .single();

        if (existingUser) {
          user = existingUser;
          
          // Reset failed attempts
          await supabase
            .from('users')
            .update({
              failed_login_attempts: 0,
              last_failed_login_at: null,
              lockout_until: null,
              last_login_at: new Date().toISOString(),
              phone_verified: true,
            })
            .eq('id', user.id);
        } else {
          // Créer un nouvel utilisateur (parent par défaut)
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert({
              phone,
              phone_verified: true,
              first_name: 'Utilisateur',
              last_name: 'Nouveau',
              role: 'parent',
              last_login_at: new Date().toISOString(),
            })
            .select()
            .single();

          if (createError) {
            console.error('User create error:', createError);
            return new Response(
              JSON.stringify({ error: 'INTERNAL_ERROR', message: 'Erreur création compte' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          user = newUser;
        }

        // Gérer le device
        if (payload.device_info?.device_id) {
          const { data: existingDevice } = await supabase
            .from('devices')
            .select('id, login_count')
            .eq('user_id', user.id)
            .eq('device_id', payload.device_info.device_id)
            .single();

          if (existingDevice) {
            await supabase
              .from('devices')
              .update({
                last_used_at: new Date().toISOString(),
                login_count: existingDevice.login_count + 1,
                platform: payload.device_info.platform,
                app_version: payload.device_info.app_version,
              })
              .eq('id', existingDevice.id);
          } else {
            await supabase
              .from('devices')
              .insert({
                user_id: user.id,
                device_id: payload.device_info.device_id,
                device_type: 'mobile',
                platform: payload.device_info.platform,
                app_version: payload.device_info.app_version,
              });
          }
        }

        // Générer les tokens
        const tokens = await generateTokens(user.id, user.role);

        // Log
        await supabase.from('audit_logs').insert({
          user_id: user.id,
          action: 'login',
          resource_type: 'users',
          resource_id: user.id,
          metadata: { method: 'otp', device: payload.device_info?.device_id },
          ip_address: clientIP,
        });

        return new Response(
          JSON.stringify({
            success: true,
            access_token: tokens.access,
            refresh_token: tokens.refresh,
            expires_in: JWT_ACCESS_EXPIRY,
            user: {
              id: user.id,
              phone: user.phone,
              first_name: user.first_name,
              last_name: user.last_name,
              role: user.role,
            },
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Pour autres purposes (payment_confirmation, etc.)
      await supabase.from('audit_logs').insert({
        user_id: otpRecord.user_id,
        action: 'otp_verified',
        resource_type: 'otp',
        resource_id: otpRecord.id,
        metadata: { purpose: payload.purpose, phone },
        ip_address: clientIP,
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: 'OTP vérifié',
          verified_for: payload.purpose,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      console.error('OTP verify error:', error);
      return new Response(
        JSON.stringify({ error: 'INTERNAL_ERROR', message: 'Erreur interne' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  // Route non trouvée
  return new Response(
    JSON.stringify({ error: 'NOT_FOUND', message: 'Endpoint non trouvé' }),
    { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
