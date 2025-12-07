import { NextRequest, NextResponse } from 'next/server';
import { FedaPay } from 'fedapay';
import { supabase } from '@/lib/supabase';

// Configuration FedaPay
FedaPay.setApiKey(process.env.FEDAPAY_SECRET_KEY!);
FedaPay.setEnvironment(process.env.NEXT_PUBLIC_FEDAPAY_ENVIRONMENT || 'live');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Log le webhook pour audit
    await supabase.from('webhooks').insert({
      provider: 'fedapay',
      event_type: body.entity?.transaction?.status || 'unknown',
      payload: body,
      status: 'received',
    });

    // Vérifier que c'est un événement de transaction
    if (!body.entity || !body.entity.transaction) {
      return NextResponse.json({ received: true });
    }

    const transaction = body.entity.transaction;
    const transactionId = transaction.id;
    const status = transaction.status;
    const customMetadata = transaction.custom_metadata || {};

    console.log('FedaPay Webhook:', {
      transactionId,
      status,
      metadata: customMetadata,
    });

    // Récupérer le payment_intent
    const { data: paymentIntent, error: intentError } = await supabase
      .from('payment_intents')
      .select('*')
      .eq('provider_transaction_id', transactionId.toString())
      .single();

    if (intentError || !paymentIntent) {
      console.error('Payment intent not found:', transactionId);
      return NextResponse.json(
        { error: 'Payment intent not found' },
        { status: 404 }
      );
    }

    // Mapper les statuts FedaPay vers nos statuts
    let paymentStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

    switch (status) {
      case 'approved':
      case 'transferred':
        paymentStatus = 'completed';
        break;
      case 'pending':
        paymentStatus = 'pending';
        break;
      case 'canceled':
      case 'cancelled':
        paymentStatus = 'cancelled';
        break;
      case 'declined':
        paymentStatus = 'failed';
        break;
      default:
        paymentStatus = 'processing';
    }

    // Mettre à jour le payment_intent
    await supabase
      .from('payment_intents')
      .update({
        status: paymentStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentIntent.id);

    // Si le paiement est approuvé, créer l'enregistrement de paiement
    if (paymentStatus === 'completed') {
      // Vérifier si le paiement n'existe pas déjà
      const { data: existingPayment } = await supabase
        .from('payments')
        .select('id')
        .eq('payment_intent_id', paymentIntent.id)
        .single();

      if (!existingPayment) {
        // Récupérer le compte de scolarité
        const { data: tuitionAccount } = await supabase
          .from('tuition_accounts')
          .select('id')
          .eq('student_id', paymentIntent.student_id)
          .single();

        if (tuitionAccount) {
          // Créer le paiement
          await supabase.from('payments').insert({
            tuition_account_id: tuitionAccount.id,
            payment_intent_id: paymentIntent.id,
            amount: paymentIntent.amount,
            payment_date: new Date().toISOString(),
            payment_method: 'mobile_money',
            payment_provider: 'fedapay',
            payment_channel: 'app_mobile',
            status: 'completed',
            transaction_reference: transactionId.toString(),
            metadata: {
              fedapay_transaction: transaction,
              custom_metadata: customMetadata,
            },
          });

          console.log('Payment created successfully for transaction:', transactionId);

          // Log audit
          await supabase.from('audit_logs').insert({
            user_id: null, // Système
            school_id: customMetadata.school_id || null,
            action: 'payment_completed',
            resource_type: 'payment',
            resource_id: transactionId.toString(),
            metadata: {
              amount: paymentIntent.amount,
              student_id: paymentIntent.student_id,
              provider: 'fedapay',
            },
          });
        }
      }
    }

    // Mettre à jour le statut du webhook
    await supabase
      .from('webhooks')
      .update({ status: 'processed' })
      .eq('provider', 'fedapay')
      .eq('payload->entity->transaction->id', transactionId);

    return NextResponse.json({ received: true, processed: true });
  } catch (error: any) {
    console.error('Webhook processing error:', error);

    // Log l'erreur dans webhooks
    try {
      await supabase.from('webhooks').insert({
        provider: 'fedapay',
        event_type: 'error',
        payload: { error: error.message },
        status: 'failed',
      });
    } catch (logError) {
      console.error('Failed to log webhook error:', logError);
    }

    return NextResponse.json(
      { error: 'Webhook processing failed', message: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint pour vérifier le statut d'un webhook
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    message: 'FedaPay webhook endpoint is active',
  });
}
