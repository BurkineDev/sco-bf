import { NextRequest, NextResponse } from 'next/server';
import { verifyOTP, formatBurkinabePhone } from '@/lib/sms';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone_number, code, purpose = 'login' } = body;

    // Validation
    if (!phone_number || !code) {
      return NextResponse.json(
        { error: 'Numéro de téléphone et code requis' },
        { status: 400 }
      );
    }

    // Formater le numéro
    let formattedPhone: string;
    try {
      formattedPhone = formatBurkinabePhone(phone_number);
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // Vérifier l'OTP
    const verification = await verifyOTP(formattedPhone, code, purpose);

    if (!verification.valid) {
      // Log échec
      await supabase.from('audit_logs').insert({
        user_id: null,
        action: 'otp_failed',
        resource_type: 'authentication',
        metadata: {
          phone: formattedPhone,
          purpose,
          error: verification.error,
        },
      });

      return NextResponse.json(
        { error: verification.error || 'Code invalide' },
        { status: 401 }
      );
    }

    // Code OTP valide
    // Pour login, récupérer les infos de l'utilisateur
    if (purpose === 'login') {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select(`
          id,
          phone,
          full_name,
          role,
          is_active,
          school_id,
          schools (
            id,
            name,
            code,
            admin_phone
          )
        `)
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

      // Mettre à jour la dernière connexion
      await supabase
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', user.id);

      // Log succès
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        school_id: user.school_id,
        action: 'login',
        resource_type: 'authentication',
        metadata: {
          phone: formattedPhone,
          role: user.role,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Connexion réussie',
        user: {
          id: user.id,
          phone: user.phone,
          full_name: user.full_name,
          role: user.role,
          school_id: user.school_id,
          school: user.schools,
        },
      });
    }

    // Pour autres purposes (payment_confirmation, etc.)
    await supabase.from('audit_logs').insert({
      user_id: null,
      action: 'otp_verified',
      resource_type: 'authentication',
      metadata: {
        phone: formattedPhone,
        purpose,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Code vérifié avec succès',
    });
  } catch (error: any) {
    console.error('Error in verify-otp:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', message: error.message },
      { status: 500 }
    );
  }
}
