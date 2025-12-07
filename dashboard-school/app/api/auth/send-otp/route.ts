import { NextRequest, NextResponse } from 'next/server';
import { sendOTP, formatBurkinabePhone } from '@/lib/sms';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone_number, purpose = 'login' } = body;

    // Validation
    if (!phone_number) {
      return NextResponse.json(
        { error: 'Numéro de téléphone requis' },
        { status: 400 }
      );
    }

    // Formater le numéro pour le Burkina Faso
    let formattedPhone: string;
    try {
      formattedPhone = formatBurkinabePhone(phone_number);
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur existe (pour login uniquement)
    if (purpose === 'login') {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, role, is_active')
        .eq('phone', formattedPhone)
        .single();

      if (userError || !user) {
        return NextResponse.json(
          { error: 'Utilisateur non trouvé' },
          { status: 404 }
        );
      }

      if (!user.is_active) {
        return NextResponse.json(
          { error: 'Compte désactivé' },
          { status: 403 }
        );
      }
    }

    // Limiter les tentatives (rate limiting basique)
    // Vérifier combien d'OTP ont été envoyés dans les 5 dernières minutes
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

    const { data: recentOTPs, error: countError } = await supabase
      .from('otp_codes')
      .select('id')
      .eq('phone_number', formattedPhone)
      .gte('created_at', fiveMinutesAgo.toISOString());

    if (countError) {
      console.error('Error checking OTP rate limit:', countError);
    } else if (recentOTPs && recentOTPs.length >= 3) {
      return NextResponse.json(
        { error: 'Trop de tentatives. Veuillez réessayer dans 5 minutes.' },
        { status: 429 }
      );
    }

    // Envoyer l'OTP
    const result = await sendOTP(formattedPhone, purpose);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Échec de l\'envoi du SMS' },
        { status: 500 }
      );
    }

    // Log audit
    await supabase.from('audit_logs').insert({
      user_id: null,
      action: 'otp_sent',
      resource_type: 'authentication',
      metadata: {
        phone: formattedPhone,
        purpose,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Code OTP envoyé par SMS',
      phone: formattedPhone,
      expires_at: result.expires_at,
      // OTP visible en développement pour faciliter les tests
      ...(result.otp && { otp: result.otp }),
    });
  } catch (error: any) {
    console.error('Error in send-otp:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', message: error.message },
      { status: 500 }
    );
  }
}

// GET endpoint pour vérifier la configuration SMS
export async function GET() {
  const isConfigured = !!(
    process.env.AFRICASTALKING_API_KEY &&
    process.env.AFRICASTALKING_USERNAME
  );

  return NextResponse.json({
    configured: isConfigured,
    provider: 'Africa\'s Talking',
    environment: process.env.AFRICASTALKING_USERNAME || 'unknown',
  });
}
