import { NextRequest, NextResponse } from 'next/server';
import { FedaPay, Transaction } from 'fedapay';
import { supabase } from '@/lib/supabase';

// Configuration FedaPay
FedaPay.setApiKey(process.env.FEDAPAY_SECRET_KEY!);
FedaPay.setEnvironment(process.env.NEXT_PUBLIC_FEDAPAY_ENVIRONMENT || 'live');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      student_id,
      amount,
      description,
      payment_type,
      academic_year_id,
      school_id,
    } = body;

    // Validation
    if (!student_id || !amount || !school_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Récupérer les infos de l'élève
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select(`
        *,
        classes!inner (
          name,
          academic_year_id
        )
      `)
      .eq('id', student_id)
      .single();

    if (studentError || !student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Créer le payment_intent dans Supabase d'abord
    const { data: paymentIntent, error: intentError } = await supabase
      .from('payment_intents')
      .insert({
        student_id,
        amount,
        currency: 'XOF',
        payment_provider: 'fedapay',
        payment_channel: 'app_mobile',
        status: 'pending',
        metadata: {
          description,
          payment_type,
          academic_year_id,
          school_id,
        },
      })
      .select()
      .single();

    if (intentError) {
      console.error('Error creating payment intent:', intentError);
      return NextResponse.json(
        { error: 'Failed to create payment intent' },
        { status: 500 }
      );
    }

    // Créer la transaction FedaPay
    const transaction = await Transaction.create({
      description: description || `Paiement scolarité - ${student.display_name}`,
      amount: amount,
      currency: {
        iso: 'XOF',
      },
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/fedapay`,
      customer: {
        firstname: student.first_name,
        lastname: student.last_name,
        email: student.parent_email || `parent_${student.id}@placeholder.com`,
        phone_number: {
          number: student.parent_phone,
          country: 'BF', // Burkina Faso
        },
      },
      custom_metadata: {
        payment_intent_id: paymentIntent.id,
        student_id: student.id,
        school_id: school_id,
      },
    });

    // Générer le token de paiement
    const token = await transaction.generateToken();

    // Mettre à jour le payment_intent avec l'ID FedaPay
    await supabase
      .from('payment_intents')
      .update({
        provider_transaction_id: transaction.id.toString(),
        provider_reference: token.token,
      })
      .eq('id', paymentIntent.id);

    return NextResponse.json({
      success: true,
      payment_intent_id: paymentIntent.id,
      transaction_id: transaction.id,
      token: token.token,
      payment_url: token.url,
      qr_code_url: token.qr_code_url,
    });
  } catch (error: any) {
    console.error('FedaPay payment creation error:', error);
    return NextResponse.json(
      {
        error: 'Payment creation failed',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
