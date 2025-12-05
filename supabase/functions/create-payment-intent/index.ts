// ============================================================================
// SUPABASE EDGE FUNCTION: CREATE PAYMENT INTENT
// Path: supabase/functions/create-payment-intent/index.ts
// ============================================================================

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { 
  CreatePaymentIntentPayload, 
  PaymentIntentResponse,
  PaymentChannel,
  PaymentProvider 
} from '../../../src/types/database.types.ts';

// Configuration
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const CINETPAY_API_KEY = Deno.env.get('CINETPAY_API_KEY')!;
const CINETPAY_SITE_ID = Deno.env.get('CINETPAY_SITE_ID')!;
const CINETPAY_API_URL = 'https://api-checkout.cinetpay.com/v2/payment';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-device-id',
};

// Génération de référence unique
function generateReference(prefix: string = 'INT'): string {
  const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

// Validation du payload
function validatePayload(payload: CreatePaymentIntentPayload): string | null {
  if (!payload.student_id) return 'student_id requis';
  if (!payload.amount || payload.amount < 1000) return 'Montant minimum: 1000 FCFA';
  if (payload.amount > 10000000) return 'Montant maximum: 10,000,000 FCFA';
  if (!payload.channel) return 'channel requis';
  if (!payload.provider) return 'provider requis';
  
  const validChannels: PaymentChannel[] = ['app_mobile', 'ussd', 'agent_cash', 'agent_momo'];
  if (!validChannels.includes(payload.channel)) return 'channel invalide';
  
  const validProviders: PaymentProvider[] = ['cinetpay', 'paygate', 'orange_money', 'moov_money'];
  if (!validProviders.includes(payload.provider)) return 'provider invalide';
  
  return null;
}

// Appel API CinetPay
async function initCinetPayPayment(
  reference: string,
  amount: number,
  studentName: string,
  returnUrl: string
): Promise<{ payment_url: string; transaction_id: string }> {
  const response = await fetch(CINETPAY_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      apikey: CINETPAY_API_KEY,
      site_id: CINETPAY_SITE_ID,
      transaction_id: reference,
      amount: amount,
      currency: 'XOF',
      description: `Paiement scolarité - ${studentName}`,
      return_url: returnUrl,
      notify_url: `${SUPABASE_URL}/functions/v1/webhook-cinetpay`,
      channels: 'ALL',
      metadata: reference,
      customer_name: studentName,
      customer_surname: '',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('CinetPay API error:', error);
    throw new Error('Erreur initialisation paiement CinetPay');
  }

  const data = await response.json();
  
  if (data.code !== '201') {
    console.error('CinetPay error:', data);
    throw new Error(data.message || 'Erreur CinetPay');
  }

  return {
    payment_url: data.data.payment_url,
    transaction_id: data.data.payment_token,
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Vérifier le JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'UNAUTHORIZED', message: 'Token manquant' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const jwt = authHeader.replace('Bearer ', '');
    
    // Créer le client Supabase avec le JWT de l'utilisateur
    const supabaseUser = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });

    // Vérifier l'utilisateur
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser(jwt);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'UNAUTHORIZED', message: 'Token invalide' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parser le body
    const payload: CreatePaymentIntentPayload = await req.json();

    // Valider
    const validationError = validatePayload(payload);
    if (validationError) {
      return new Response(
        JSON.stringify({ error: 'VALIDATION_ERROR', message: validationError }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Client admin pour les opérations DB
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // 1. Vérifier que l'utilisateur a accès à cet élève
    const { data: parentStudent, error: psError } = await supabaseAdmin
      .from('parent_students')
      .select('id, can_make_payments')
      .eq('parent_user_id', user.id)
      .eq('student_id', payload.student_id)
      .single();

    if (psError || !parentStudent) {
      return new Response(
        JSON.stringify({ 
          error: 'FORBIDDEN', 
          message: 'Vous n\'êtes pas autorisé à payer pour cet élève' 
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!parentStudent.can_make_payments) {
      return new Response(
        JSON.stringify({ 
          error: 'FORBIDDEN', 
          message: 'Vous n\'avez pas la permission de faire des paiements' 
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Récupérer les infos élève + tuition_account
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select(`
        id,
        matricule,
        first_name,
        last_name,
        school_id,
        class_id,
        schools!inner (
          id,
          code,
          name,
          commission_rate,
          commission_fixed,
          commission_type
        ),
        classes!inner (
          id,
          name,
          academic_year_id,
          min_installment_amount
        )
      `)
      .eq('id', payload.student_id)
      .eq('is_active', true)
      .single();

    if (studentError || !student) {
      return new Response(
        JSON.stringify({ error: 'STUDENT_NOT_FOUND', message: 'Élève non trouvé' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Récupérer le tuition_account
    const { data: tuitionAccount, error: taError } = await supabaseAdmin
      .from('tuition_accounts')
      .select('id, total_amount, paid_amount, balance')
      .eq('student_id', payload.student_id)
      .eq('academic_year_id', student.classes.academic_year_id)
      .single();

    if (taError || !tuitionAccount) {
      return new Response(
        JSON.stringify({ 
          error: 'NOT_FOUND', 
          message: 'Compte de scolarité non trouvé pour cette année' 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Vérifier le montant minimum
    const minAmount = student.classes.min_installment_amount || 5000;
    if (payload.amount < minAmount) {
      return new Response(
        JSON.stringify({ 
          error: 'INSUFFICIENT_AMOUNT', 
          message: `Montant minimum: ${minAmount} FCFA` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Vérifier que le montant ne dépasse pas le reliquat
    if (payload.amount > tuitionAccount.balance) {
      return new Response(
        JSON.stringify({ 
          error: 'VALIDATION_ERROR', 
          message: `Montant supérieur au reliquat (${tuitionAccount.balance} FCFA)` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. Générer la référence unique
    const reference = generateReference('INT');

    // 7. Calculer l'expiration (30 minutes)
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    // 8. Initialiser le paiement avec CinetPay (si provider = cinetpay)
    let paymentUrl: string | undefined;
    let providerTransactionId: string | undefined;
    
    const returnUrl = payload.return_url || 'https://app.scolarite-bf.com/payment/callback';
    const studentFullName = `${student.first_name} ${student.last_name}`;

    if (payload.provider === 'cinetpay') {
      try {
        const cinetpayResult = await initCinetPayPayment(
          reference,
          payload.amount,
          studentFullName,
          returnUrl
        );
        paymentUrl = cinetpayResult.payment_url;
        providerTransactionId = cinetpayResult.transaction_id;
      } catch (error) {
        console.error('CinetPay init error:', error);
        return new Response(
          JSON.stringify({ 
            error: 'PAYMENT_FAILED', 
            message: 'Impossible d\'initialiser le paiement' 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 9. Créer le payment_intent en DB
    const deviceId = req.headers.get('x-device-id');
    const userAgent = req.headers.get('user-agent');
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                     req.headers.get('x-real-ip');

    const { data: paymentIntent, error: insertError } = await supabaseAdmin
      .from('payment_intents')
      .insert({
        reference,
        tuition_account_id: tuitionAccount.id,
        initiated_by: user.id,
        amount: payload.amount,
        currency: 'XOF',
        channel: payload.channel,
        provider: payload.provider,
        status: 'pending',
        provider_transaction_id: providerTransactionId,
        expires_at: expiresAt,
        metadata: payload.metadata || {},
        ip_address: clientIP,
        user_agent: userAgent,
        device_id: deviceId,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert payment_intent error:', insertError);
      return new Response(
        JSON.stringify({ error: 'INTERNAL_ERROR', message: 'Erreur création paiement' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 10. Log audit
    await supabaseAdmin.from('audit_logs').insert({
      user_id: user.id,
      action: 'payment_initiated',
      resource_type: 'payment_intents',
      resource_id: paymentIntent.id,
      new_values: {
        reference,
        amount: payload.amount,
        student_id: payload.student_id,
        provider: payload.provider,
      },
      ip_address: clientIP,
      user_agent: userAgent,
      device_id: deviceId,
    });

    // 11. Réponse
    const response: PaymentIntentResponse = {
      id: paymentIntent.id,
      reference: paymentIntent.reference,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
      expires_at: paymentIntent.expires_at,
      payment_url: paymentUrl,
      provider_data: providerTransactionId ? { transaction_id: providerTransactionId } : undefined,
    };

    return new Response(
      JSON.stringify(response),
      { 
        status: 201, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'INTERNAL_ERROR', message: 'Erreur interne' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
