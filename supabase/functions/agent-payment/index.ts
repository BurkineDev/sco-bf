// ============================================================================
// SUPABASE EDGE FUNCTION: AGENT PAYMENT
// Path: supabase/functions/agent-payment/index.ts
// 
// Permet aux agents/caissiers d'enregistrer des paiements (cash ou mobile money)
// ============================================================================

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

// Configuration
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SMS_API_URL = Deno.env.get('SMS_API_URL') || '';
const SMS_API_KEY = Deno.env.get('SMS_API_KEY') || '';

// CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-device-id',
};

// Interface
interface AgentPaymentPayload {
  student_id: string;
  amount: number;
  channel: 'agent_cash' | 'agent_momo';
  payer_name?: string;
  payer_phone?: string;
  notes?: string;
  otp?: string; // OTP optionnel pour double validation
}

// Générer référence paiement
function generatePaymentReference(): string {
  const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `AGT${timestamp}${random}`;
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

// Normaliser téléphone
function normalizePhone(phone?: string): string | null {
  if (!phone) return null;
  let p = phone.replace(/\D/g, '');
  if (p.length === 8) p = '226' + p;
  if (!p.startsWith('+')) p = '+' + p;
  return p;
}

// Envoyer SMS
async function sendConfirmationSMS(
  phone: string,
  studentName: string,
  amount: number,
  balance: number,
  schoolName: string,
  agentCode: string
): Promise<boolean> {
  if (!SMS_API_URL || !SMS_API_KEY) return false;

  const message = `[Scolarité BF] Paiement reçu: ${amount.toLocaleString()} FCFA pour ${studentName}. ` +
    `Reste: ${balance.toLocaleString()} FCFA. Agent: ${agentCode}. ${schoolName}`;

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
  } catch {
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  const userAgent = req.headers.get('user-agent') || '';
  const deviceId = req.headers.get('x-device-id') || '';

  try {
    // 1. Vérifier le JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'UNAUTHORIZED', message: 'Token manquant' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const jwt = authHeader.replace('Bearer ', '');
    
    // Vérifier l'utilisateur
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(jwt);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'UNAUTHORIZED', message: 'Token invalide' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Vérifier que l'utilisateur est un agent actif
    const { data: agent, error: agentError } = await supabaseAdmin
      .from('agents')
      .select(`
        id,
        agent_code,
        school_id,
        daily_limit,
        transaction_limit,
        is_active,
        users!inner (
          id,
          role,
          first_name,
          last_name
        )
      `)
      .eq('user_id', user.id)
      .single();

    if (agentError || !agent || !agent.is_active) {
      return new Response(
        JSON.stringify({ error: 'FORBIDDEN', message: 'Accès agent non autorisé' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Parser le payload
    const payload: AgentPaymentPayload = await req.json();

    // 4. Validation
    if (!payload.student_id) {
      return new Response(
        JSON.stringify({ error: 'VALIDATION_ERROR', message: 'student_id requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!payload.amount || payload.amount < 1000) {
      return new Response(
        JSON.stringify({ error: 'VALIDATION_ERROR', message: 'Montant minimum: 1000 FCFA' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!['agent_cash', 'agent_momo'].includes(payload.channel)) {
      return new Response(
        JSON.stringify({ error: 'VALIDATION_ERROR', message: 'Channel invalide' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Vérifier la limite par transaction de l'agent
    if (payload.amount > agent.transaction_limit) {
      return new Response(
        JSON.stringify({ 
          error: 'VALIDATION_ERROR', 
          message: `Montant dépasse la limite par transaction (${agent.transaction_limit.toLocaleString()} FCFA)` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. Vérifier la limite journalière
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: todayPayments } = await supabaseAdmin
      .from('payments')
      .select('amount')
      .eq('recorded_by', user.id)
      .gte('created_at', today.toISOString())
      .in('channel', ['agent_cash', 'agent_momo']);

    const todayTotal = (todayPayments || []).reduce((sum, p) => sum + p.amount, 0);

    if (todayTotal + payload.amount > agent.daily_limit) {
      return new Response(
        JSON.stringify({ 
          error: 'VALIDATION_ERROR', 
          message: `Limite journalière dépassée. Utilisé: ${todayTotal.toLocaleString()}, Limite: ${agent.daily_limit.toLocaleString()} FCFA` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 7. Récupérer l'élève
    const studentQuery = supabaseAdmin
      .from('students')
      .select(`
        id,
        matricule,
        first_name,
        last_name,
        parent_phone,
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
          academic_year_id
        )
      `)
      .eq('id', payload.student_id)
      .eq('is_active', true);

    // Si l'agent est rattaché à une école, vérifier que l'élève en fait partie
    if (agent.school_id) {
      studentQuery.eq('school_id', agent.school_id);
    }

    const { data: student, error: studentError } = await studentQuery.single();

    if (studentError || !student) {
      return new Response(
        JSON.stringify({ 
          error: 'STUDENT_NOT_FOUND', 
          message: agent.school_id 
            ? 'Élève non trouvé dans votre école' 
            : 'Élève non trouvé' 
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 8. Récupérer le tuition_account
    const { data: tuitionAccount, error: taError } = await supabaseAdmin
      .from('tuition_accounts')
      .select('id, total_amount, paid_amount, balance')
      .eq('student_id', student.id)
      .eq('academic_year_id', student.classes.academic_year_id)
      .single();

    if (taError || !tuitionAccount) {
      return new Response(
        JSON.stringify({ error: 'NOT_FOUND', message: 'Compte scolarité non trouvé' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 9. Créer le paiement
    const paymentReference = generatePaymentReference();
    const school = student.schools;
    const commission = calculateCommission(
      payload.amount,
      school.commission_rate,
      school.commission_fixed,
      school.commission_type
    );

    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert({
        reference: paymentReference,
        tuition_account_id: tuitionAccount.id,
        payment_intent_id: null,
        paid_by: null,
        recorded_by: user.id,
        amount: payload.amount,
        currency: 'XOF',
        channel: payload.channel,
        provider: 'manual',
        commission_amount: commission,
        commission_rate: school.commission_rate,
        status: 'completed',
        payer_phone: normalizePhone(payload.payer_phone),
        payer_name: payload.payer_name,
        notes: payload.notes,
        metadata: {
          agent_code: agent.agent_code,
          agent_name: `${agent.users.first_name} ${agent.users.last_name}`,
        },
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Payment insert error:', paymentError);
      return new Response(
        JSON.stringify({ error: 'INTERNAL_ERROR', message: 'Erreur enregistrement paiement' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 10. Récupérer le nouveau solde
    const { data: updatedAccount } = await supabaseAdmin
      .from('tuition_accounts')
      .select('balance')
      .eq('id', tuitionAccount.id)
      .single();

    const newBalance = updatedAccount?.balance ?? Math.max(0, tuitionAccount.balance - payload.amount);

    // 11. Log audit
    await supabaseAdmin.from('audit_logs').insert({
      user_id: user.id,
      user_role: 'agent',
      action: 'payment_completed',
      resource_type: 'payments',
      resource_id: payment.id,
      new_values: {
        reference: paymentReference,
        amount: payload.amount,
        student_id: student.id,
        channel: payload.channel,
        agent_code: agent.agent_code,
      },
      ip_address: clientIP,
      user_agent: userAgent,
      device_id: deviceId,
    });

    // 12. Envoyer SMS
    const studentFullName = `${student.first_name} ${student.last_name}`;

    // Au payeur si numéro fourni
    if (payload.payer_phone) {
      await sendConfirmationSMS(
        normalizePhone(payload.payer_phone)!,
        studentFullName,
        payload.amount,
        newBalance,
        school.name,
        agent.agent_code
      );
    }

    // Au parent si différent
    if (student.parent_phone && student.parent_phone !== normalizePhone(payload.payer_phone)) {
      await sendConfirmationSMS(
        student.parent_phone,
        studentFullName,
        payload.amount,
        newBalance,
        school.name,
        agent.agent_code
      );
    }

    // 13. Réponse
    return new Response(
      JSON.stringify({
        id: payment.id,
        reference: paymentReference,
        amount: payload.amount,
        status: 'completed',
        student: {
          matricule: student.matricule,
          name: studentFullName,
        },
        tuition_balance: newBalance,
        agent: {
          code: agent.agent_code,
          daily_used: todayTotal + payload.amount,
          daily_remaining: agent.daily_limit - (todayTotal + payload.amount),
        },
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Agent payment error:', error);
    return new Response(
      JSON.stringify({ error: 'INTERNAL_ERROR', message: 'Erreur interne' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
