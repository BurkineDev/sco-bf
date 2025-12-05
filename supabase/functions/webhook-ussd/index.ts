// ============================================================================
// SUPABASE EDGE FUNCTION: WEBHOOK USSD
// Path: supabase/functions/webhook-ussd/index.ts
// 
// Gère les paiements USSD sans Internet
// Format: *CODE*ECOLE*MATRICULE*MONTANT#
// ============================================================================

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { createHmac, timingSafeEqual } from 'https://deno.land/std@0.177.0/node/crypto.ts';

// Configuration
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const USSD_WEBHOOK_SECRET = Deno.env.get('USSD_WEBHOOK_SECRET')!;
const SMS_API_URL = Deno.env.get('SMS_API_URL') || '';
const SMS_API_KEY = Deno.env.get('SMS_API_KEY') || '';

// Interface USSD Webhook
interface USSDWebhookPayload {
  transaction_id: string;
  school_code: string;
  student_matricule: string;
  amount: number;
  payer_msisdn: string;
  timestamp: string;
  status: 'SUCCESS' | 'FAILED';
  operator?: string; // orange, moov, etc.
  raw_ussd_string?: string;
}

// Interface de réponse pour l'opérateur
interface USSDResponse {
  status: 'OK' | 'ERROR';
  message: string;
  student_name?: string;
  new_balance?: number;
  school_name?: string;
}

// Vérification signature HMAC
function verifySignature(payload: string, signature: string, secret: string): boolean {
  try {
    const expectedSignature = createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    const sigBuffer = Buffer.from(signature.replace('sha256=', ''), 'hex');
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    
    if (sigBuffer.length !== expectedBuffer.length) {
      return false;
    }
    
    return timingSafeEqual(sigBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

// Normaliser le numéro de téléphone
function normalizePhone(msisdn: string): string {
  // Supprimer tout sauf les chiffres
  let phone = msisdn.replace(/\D/g, '');
  
  // Ajouter le préfixe Burkina si nécessaire
  if (phone.length === 8) {
    phone = '226' + phone;
  }
  
  // Ajouter le +
  if (!phone.startsWith('+')) {
    phone = '+' + phone;
  }
  
  return phone;
}

// Générer référence paiement
function generatePaymentReference(): string {
  const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `USSD${timestamp}${random}`;
}

// Mapper opérateur vers provider
function mapOperatorToProvider(operator?: string): string {
  const mapping: Record<string, string> = {
    'orange': 'orange_money',
    'moov': 'moov_money',
    'coris': 'coris_money',
  };
  return mapping[operator?.toLowerCase() || ''] || 'orange_money';
}

// Envoyer SMS de confirmation
async function sendConfirmationSMS(
  phone: string,
  studentName: string,
  amount: number,
  balance: number,
  schoolName: string
): Promise<boolean> {
  if (!SMS_API_URL || !SMS_API_KEY) {
    console.warn('SMS not configured, skipping notification');
    return false;
  }

  const message = `[Scolarité BF] Paiement reçu: ${amount.toLocaleString()} FCFA pour ${studentName}. ` +
    `Reste à payer: ${balance.toLocaleString()} FCFA. ${schoolName}`;

  try {
    const response = await fetch(SMS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SMS_API_KEY}`,
      },
      body: JSON.stringify({
        to: phone,
        message,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('SMS send error:', error);
    return false;
  }
}

// Calculer commission
function calculateCommission(
  amount: number,
  commissionRate: number,
  commissionFixed: number,
  commissionType: string
): number {
  switch (commissionType) {
    case 'fixed':
      return commissionFixed;
    case 'rate':
      return Math.round(amount * commissionRate);
    case 'both':
      return commissionFixed + Math.round(amount * commissionRate);
    default:
      return Math.round(amount * commissionRate);
  }
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                   req.headers.get('x-real-ip') || 'unknown';

  let webhookEventId: string | null = null;

  try {
    // 1. Parser le payload
    const rawPayload = await req.text();
    let payload: USSDWebhookPayload;
    
    try {
      payload = JSON.parse(rawPayload);
    } catch {
      return new Response(
        JSON.stringify({ status: 'ERROR', message: 'Invalid JSON payload' } as USSDResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Vérifier la signature
    const signature = req.headers.get('x-ussd-signature') || '';
    const signatureValid = signature ? verifySignature(rawPayload, signature, USSD_WEBHOOK_SECRET) : false;

    if (!signatureValid && signature) {
      console.warn('Invalid USSD signature from IP:', clientIP);
      await supabase.from('audit_logs').insert({
        action: 'suspicious_activity',
        resource_type: 'webhook',
        metadata: {
          reason: 'invalid_signature',
          provider: 'ussd',
          ip: clientIP,
          transaction_id: payload.transaction_id,
        },
        ip_address: clientIP,
      });
    }

    // 3. Validation basique
    if (!payload.transaction_id || !payload.school_code || !payload.student_matricule || !payload.amount) {
      return new Response(
        JSON.stringify({ 
          status: 'ERROR', 
          message: 'Données incomplètes. Format: CODE_ECOLE*MATRICULE*MONTANT' 
        } as USSDResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (payload.status !== 'SUCCESS') {
      console.log('USSD transaction not successful:', payload.transaction_id);
      return new Response(
        JSON.stringify({ status: 'OK', message: 'Transaction non réussie côté opérateur' } as USSDResponse),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 4. Vérifier l'idempotence
    const idempotencyKey = `ussd_${payload.transaction_id}`;

    const { data: existingWebhook } = await supabase
      .from('webhook_events')
      .select('id')
      .eq('idempotency_key', idempotencyKey)
      .single();

    if (existingWebhook) {
      return new Response(
        JSON.stringify({ status: 'OK', message: 'Transaction déjà traitée' } as USSDResponse),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 5. Créer l'entrée webhook_event
    const provider = mapOperatorToProvider(payload.operator);
    
    const { data: webhookEvent } = await supabase
      .from('webhook_events')
      .insert({
        provider: provider,
        event_type: 'ussd_payment',
        provider_event_id: payload.transaction_id,
        idempotency_key: idempotencyKey,
        raw_payload: payload,
        headers: Object.fromEntries(req.headers.entries()),
        signature_received: signature || null,
        signature_valid: signatureValid,
        status: 'processing',
        ip_address: clientIP,
      })
      .select()
      .single();

    if (webhookEvent) {
      webhookEventId = webhookEvent.id;
    }

    // 6. Retrouver l'école par code
    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .select('id, name, code, commission_rate, commission_fixed, commission_type')
      .eq('code', payload.school_code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (schoolError || !school) {
      const errorResponse: USSDResponse = {
        status: 'ERROR',
        message: `École non trouvée: ${payload.school_code}`,
      };

      if (webhookEventId) {
        await supabase.from('webhook_events').update({
          status: 'failed',
          processing_error: 'School not found',
        }).eq('id', webhookEventId);
      }

      return new Response(
        JSON.stringify(errorResponse),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 7. Retrouver l'élève par matricule + école
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select(`
        id,
        matricule,
        first_name,
        last_name,
        parent_phone,
        class_id,
        classes!inner (
          id,
          name,
          academic_year_id,
          academic_years!inner (
            id,
            is_current
          )
        )
      `)
      .eq('school_id', school.id)
      .eq('matricule', payload.student_matricule)
      .eq('is_active', true)
      .single();

    if (studentError || !student) {
      const errorResponse: USSDResponse = {
        status: 'ERROR',
        message: `Élève non trouvé: ${payload.student_matricule}`,
        school_name: school.name,
      };

      if (webhookEventId) {
        await supabase.from('webhook_events').update({
          status: 'failed',
          processing_error: 'Student not found',
        }).eq('id', webhookEventId);
      }

      return new Response(
        JSON.stringify(errorResponse),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 8. Retrouver le tuition_account
    const academicYearId = student.classes.academic_year_id;
    
    const { data: tuitionAccount, error: taError } = await supabase
      .from('tuition_accounts')
      .select('id, total_amount, paid_amount, balance')
      .eq('student_id', student.id)
      .eq('academic_year_id', academicYearId)
      .single();

    if (taError || !tuitionAccount) {
      const errorResponse: USSDResponse = {
        status: 'ERROR',
        message: 'Compte scolarité non configuré',
        student_name: `${student.first_name} ${student.last_name}`,
        school_name: school.name,
      };

      if (webhookEventId) {
        await supabase.from('webhook_events').update({
          status: 'failed',
          processing_error: 'Tuition account not found',
        }).eq('id', webhookEventId);
      }

      return new Response(
        JSON.stringify(errorResponse),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 9. Valider le montant
    if (payload.amount < 1000) {
      const errorResponse: USSDResponse = {
        status: 'ERROR',
        message: 'Montant minimum: 1000 FCFA',
        student_name: `${student.first_name} ${student.last_name}`,
        school_name: school.name,
      };

      return new Response(
        JSON.stringify(errorResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Note: Pour USSD, on accepte un montant supérieur au reliquat (trop-perçu géré manuellement)

    // 10. Créer le paiement
    const paymentReference = generatePaymentReference();
    const commission = calculateCommission(
      payload.amount,
      school.commission_rate,
      school.commission_fixed,
      school.commission_type
    );
    const payerPhone = normalizePhone(payload.payer_msisdn);

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        reference: paymentReference,
        tuition_account_id: tuitionAccount.id,
        payment_intent_id: null, // Pas de payment_intent pour USSD
        paid_by: null, // Pas d'utilisateur identifié
        amount: payload.amount,
        currency: 'XOF',
        channel: 'ussd',
        provider: provider,
        commission_amount: commission,
        commission_rate: school.commission_rate,
        provider_transaction_id: payload.transaction_id,
        provider_response: payload,
        status: 'completed',
        payer_phone: payerPhone,
        metadata: {
          ussd_operator: payload.operator,
          ussd_raw: payload.raw_ussd_string,
          timestamp: payload.timestamp,
        },
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Payment insert error:', paymentError);
      
      if (webhookEventId) {
        await supabase.from('webhook_events').update({
          status: 'failed',
          processing_error: paymentError.message,
        }).eq('id', webhookEventId);
      }

      return new Response(
        JSON.stringify({ status: 'ERROR', message: 'Erreur enregistrement paiement' } as USSDResponse),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 11. Récupérer le nouveau solde (mis à jour par trigger)
    const { data: updatedAccount } = await supabase
      .from('tuition_accounts')
      .select('balance')
      .eq('id', tuitionAccount.id)
      .single();

    const newBalance = updatedAccount?.balance ?? Math.max(0, tuitionAccount.balance - payload.amount);

    // 12. Mettre à jour le webhook event
    if (webhookEventId) {
      await supabase.from('webhook_events').update({
        status: 'processed',
        processed_at: new Date().toISOString(),
        payment_id: payment.id,
      }).eq('id', webhookEventId);
    }

    // 13. Log audit
    await supabase.from('audit_logs').insert({
      action: 'payment_completed',
      resource_type: 'payments',
      resource_id: payment.id,
      new_values: {
        reference: paymentReference,
        amount: payload.amount,
        student_id: student.id,
        channel: 'ussd',
        provider_tx: payload.transaction_id,
      },
      metadata: {
        payer_phone: payerPhone,
        school_code: payload.school_code,
        student_matricule: payload.student_matricule,
      },
      ip_address: clientIP,
    });

    // 14. Envoyer SMS de confirmation
    const studentFullName = `${student.first_name} ${student.last_name}`;

    // Au numéro du payeur
    await sendConfirmationSMS(
      payerPhone,
      studentFullName,
      payload.amount,
      newBalance,
      school.name
    );

    // Au parent si différent
    if (student.parent_phone && student.parent_phone !== payerPhone) {
      await sendConfirmationSMS(
        student.parent_phone,
        studentFullName,
        payload.amount,
        newBalance,
        school.name
      );
    }

    // 15. Réponse pour l'écran USSD de l'opérateur
    const successResponse: USSDResponse = {
      status: 'OK',
      message: `Paiement reçu: ${payload.amount.toLocaleString()} FCFA. Nouveau solde: ${newBalance.toLocaleString()} FCFA`,
      student_name: studentFullName,
      new_balance: newBalance,
      school_name: school.name,
    };

    console.log('USSD payment processed:', paymentReference, studentFullName, payload.amount);

    return new Response(
      JSON.stringify(successResponse),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('USSD webhook error:', error);

    if (webhookEventId) {
      await supabase.from('webhook_events').update({
        status: 'failed',
        processing_error: error instanceof Error ? error.message : 'Unknown error',
      }).eq('id', webhookEventId);
    }

    return new Response(
      JSON.stringify({ status: 'ERROR', message: 'Erreur interne' } as USSDResponse),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
