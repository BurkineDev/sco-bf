// ============================================================================
// SUPABASE EDGE FUNCTION: WEBHOOK CINETPAY
// Path: supabase/functions/webhook-cinetpay/index.ts
// ============================================================================

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { createHmac, timingSafeEqual } from 'https://deno.land/std@0.177.0/node/crypto.ts';

// Configuration
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const CINETPAY_SECRET_KEY = Deno.env.get('CINETPAY_SECRET_KEY')!;
const SMS_API_URL = Deno.env.get('SMS_API_URL') || '';
const SMS_API_KEY = Deno.env.get('SMS_API_KEY') || '';

// Interface CinetPay
interface CinetPayWebhook {
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

// Vérification signature HMAC
function verifySignature(payload: string, signature: string, secret: string): boolean {
  try {
    const expectedSignature = createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    // Timing-safe comparison
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

// Générer référence paiement
function generatePaymentReference(): string {
  const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `PAY${timestamp}${random}`;
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
    `Nouveau solde dû: ${balance.toLocaleString()} FCFA. ${schoolName}`;

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
  // Seul POST est accepté
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                   req.headers.get('x-real-ip') || 'unknown';

  // Variables pour le webhook event
  let webhookEventId: string | null = null;
  let payload: CinetPayWebhook | null = null;
  let rawPayload = '';

  try {
    // 1. Parser le body
    rawPayload = await req.text();
    
    try {
      payload = JSON.parse(rawPayload) as CinetPayWebhook;
    } catch {
      // CinetPay peut envoyer en form-urlencoded
      const formData = new URLSearchParams(rawPayload);
      payload = Object.fromEntries(formData.entries()) as unknown as CinetPayWebhook;
    }

    if (!payload.cpm_trans_id || !payload.cpm_custom) {
      console.error('Invalid webhook payload:', rawPayload);
      return new Response(JSON.stringify({ status: 'ERROR', message: 'Invalid payload' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. Vérifier la signature HMAC
    const signature = req.headers.get('x-cinetpay-signature') || payload.signature || '';
    const signatureValid = signature ? verifySignature(rawPayload, signature, CINETPAY_SECRET_KEY) : null;

    // Log de sécurité si signature invalide
    if (signature && !signatureValid) {
      console.warn('Invalid webhook signature from IP:', clientIP);
      await supabase.from('audit_logs').insert({
        action: 'suspicious_activity',
        resource_type: 'webhook',
        metadata: {
          reason: 'invalid_signature',
          provider: 'cinetpay',
          ip: clientIP,
          transaction_id: payload.cpm_trans_id,
        },
        ip_address: clientIP,
      });
    }

    // 3. Vérifier l'idempotence (éviter doublons)
    const idempotencyKey = `cinetpay_${payload.cpm_trans_id}`;

    const { data: existingWebhook } = await supabase
      .from('webhook_events')
      .select('id, status')
      .eq('idempotency_key', idempotencyKey)
      .single();

    if (existingWebhook) {
      console.log('Duplicate webhook:', idempotencyKey);
      
      // Mettre à jour le statut en "duplicate"
      await supabase
        .from('webhook_events')
        .update({ status: 'duplicate' })
        .eq('id', existingWebhook.id);

      return new Response(JSON.stringify({ status: 'OK', message: 'Already processed' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 4. Créer l'entrée webhook_event
    const { data: webhookEvent, error: webhookInsertError } = await supabase
      .from('webhook_events')
      .insert({
        provider: 'cinetpay',
        event_type: payload.cpm_result === '00' ? 'payment_success' : 'payment_failed',
        provider_event_id: payload.cpm_trans_id,
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

    if (webhookInsertError) {
      console.error('Webhook insert error:', webhookInsertError);
      // Continuer le traitement malgré l'erreur de log
    } else {
      webhookEventId = webhookEvent.id;
    }

    // 5. Retrouver le payment_intent
    const paymentIntentReference = payload.cpm_custom;
    
    const { data: paymentIntent, error: piError } = await supabase
      .from('payment_intents')
      .select(`
        id,
        reference,
        tuition_account_id,
        initiated_by,
        amount,
        channel,
        provider,
        status,
        tuition_accounts!inner (
          id,
          student_id,
          total_amount,
          paid_amount,
          balance,
          students!inner (
            id,
            first_name,
            last_name,
            parent_phone,
            school_id,
            schools!inner (
              id,
              name,
              commission_rate,
              commission_fixed,
              commission_type
            )
          )
        )
      `)
      .eq('reference', paymentIntentReference)
      .single();

    if (piError || !paymentIntent) {
      console.error('Payment intent not found:', paymentIntentReference);
      
      // Mettre à jour le webhook avec l'erreur
      if (webhookEventId) {
        await supabase
          .from('webhook_events')
          .update({ 
            status: 'failed', 
            processing_error: 'Payment intent not found' 
          })
          .eq('id', webhookEventId);
      }

      return new Response(JSON.stringify({ status: 'ERROR', message: 'Payment intent not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 6. Vérifier que le payment_intent n'est pas déjà traité
    if (paymentIntent.status === 'completed' || paymentIntent.status === 'failed') {
      console.log('Payment intent already processed:', paymentIntentReference, paymentIntent.status);
      
      if (webhookEventId) {
        await supabase
          .from('webhook_events')
          .update({ 
            status: 'duplicate', 
            payment_intent_id: paymentIntent.id 
          })
          .eq('id', webhookEventId);
      }

      return new Response(JSON.stringify({ status: 'OK', message: 'Already processed' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 7. Vérifier le montant
    const webhookAmount = parseInt(payload.cpm_amount, 10);
    if (webhookAmount !== paymentIntent.amount) {
      console.error('Amount mismatch:', webhookAmount, 'vs', paymentIntent.amount);
      
      await supabase.from('audit_logs').insert({
        action: 'suspicious_activity',
        resource_type: 'payment_intents',
        resource_id: paymentIntent.id,
        metadata: {
          reason: 'amount_mismatch',
          expected: paymentIntent.amount,
          received: webhookAmount,
          provider: 'cinetpay',
        },
        ip_address: clientIP,
      });

      if (webhookEventId) {
        await supabase
          .from('webhook_events')
          .update({ 
            status: 'failed', 
            processing_error: `Amount mismatch: expected ${paymentIntent.amount}, got ${webhookAmount}` 
          })
          .eq('id', webhookEventId);
      }

      return new Response(JSON.stringify({ status: 'ERROR', message: 'Amount mismatch' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 8. Traiter selon le résultat
    const isSuccess = payload.cpm_result === '00';
    const tuitionAccount = paymentIntent.tuition_accounts;
    const student = tuitionAccount.students;
    const school = student.schools;

    if (isSuccess) {
      // 8a. Paiement réussi - Créer le payment
      const paymentReference = generatePaymentReference();
      const commission = calculateCommission(
        paymentIntent.amount,
        school.commission_rate,
        school.commission_fixed,
        school.commission_type
      );

      // Transaction: créer payment + mettre à jour tuition_account + mettre à jour payment_intent
      // Note: Dans une vraie implémentation, utiliser une transaction DB ou RPC
      
      // Créer le payment
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          reference: paymentReference,
          tuition_account_id: tuitionAccount.id,
          payment_intent_id: paymentIntent.id,
          paid_by: paymentIntent.initiated_by,
          amount: paymentIntent.amount,
          currency: 'XOF',
          channel: paymentIntent.channel,
          provider: paymentIntent.provider,
          commission_amount: commission,
          commission_rate: school.commission_rate,
          provider_transaction_id: payload.cpm_trans_id,
          provider_reference: payload.cpm_trans_id,
          provider_response: payload,
          status: 'completed',
          payer_phone: `+${payload.cpm_phone_prefixe}${payload.cpm_cel_player}`,
          metadata: {
            payment_method: payload.cpm_payment_method,
            trans_date: payload.cpm_trans_date,
          },
        })
        .select()
        .single();

      if (paymentError) {
        console.error('Payment insert error:', paymentError);
        throw new Error('Failed to create payment');
      }

      // Mettre à jour le payment_intent
      await supabase
        .from('payment_intents')
        .update({
          status: 'completed',
          provider_response: payload,
          completed_at: new Date().toISOString(),
        })
        .eq('id', paymentIntent.id);

      // Note: Le tuition_account est mis à jour automatiquement par le trigger SQL

      // Récupérer le nouveau solde
      const { data: updatedAccount } = await supabase
        .from('tuition_accounts')
        .select('balance')
        .eq('id', tuitionAccount.id)
        .single();

      // Mettre à jour le webhook event
      if (webhookEventId) {
        await supabase
          .from('webhook_events')
          .update({
            status: 'processed',
            processed_at: new Date().toISOString(),
            payment_intent_id: paymentIntent.id,
            payment_id: payment.id,
          })
          .eq('id', webhookEventId);
      }

      // Log audit
      await supabase.from('audit_logs').insert({
        user_id: paymentIntent.initiated_by,
        action: 'payment_completed',
        resource_type: 'payments',
        resource_id: payment.id,
        new_values: {
          reference: paymentReference,
          amount: paymentIntent.amount,
          commission,
          student_id: student.id,
          provider_tx: payload.cpm_trans_id,
        },
        ip_address: clientIP,
      });

      // Envoyer SMS de confirmation
      const studentFullName = `${student.first_name} ${student.last_name}`;
      const newBalance = updatedAccount?.balance || (tuitionAccount.balance - paymentIntent.amount);
      
      if (student.parent_phone) {
        await sendConfirmationSMS(
          student.parent_phone,
          studentFullName,
          paymentIntent.amount,
          newBalance,
          school.name
        );
      }

      // Aussi envoyer au numéro qui a payé si différent
      const payerPhone = `+${payload.cpm_phone_prefixe}${payload.cpm_cel_player}`;
      if (payerPhone && payerPhone !== student.parent_phone) {
        await sendConfirmationSMS(
          payerPhone,
          studentFullName,
          paymentIntent.amount,
          newBalance,
          school.name
        );
      }

      console.log('Payment processed successfully:', paymentReference);

    } else {
      // 8b. Paiement échoué
      await supabase
        .from('payment_intents')
        .update({
          status: 'failed',
          provider_response: payload,
        })
        .eq('id', paymentIntent.id);

      if (webhookEventId) {
        await supabase
          .from('webhook_events')
          .update({
            status: 'processed',
            processed_at: new Date().toISOString(),
            payment_intent_id: paymentIntent.id,
          })
          .eq('id', webhookEventId);
      }

      // Log audit
      await supabase.from('audit_logs').insert({
        user_id: paymentIntent.initiated_by,
        action: 'payment_failed',
        resource_type: 'payment_intents',
        resource_id: paymentIntent.id,
        metadata: {
          error_code: payload.cpm_result,
          error_message: payload.cpm_error_message,
          provider_tx: payload.cpm_trans_id,
        },
        ip_address: clientIP,
      });

      console.log('Payment failed:', paymentIntentReference, payload.cpm_result, payload.cpm_error_message);
    }

    return new Response(JSON.stringify({ status: 'OK' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Webhook processing error:', error);

    // Mettre à jour le webhook event avec l'erreur
    if (webhookEventId) {
      await supabase
        .from('webhook_events')
        .update({
          status: 'failed',
          processing_error: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('id', webhookEventId);
    }

    return new Response(JSON.stringify({ status: 'ERROR', message: 'Processing error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
