import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import jsPDF from 'jspdf'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export async function GET(
  request: NextRequest,
  { params }: { params: { payment_id: string } }
) {
  try {
    const { payment_id } = params

    if (!payment_id) {
      return NextResponse.json(
        { error: 'payment_id requis' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Récupérer les détails du paiement
    const { data: payment, error } = await supabase
      .from('payments')
      .select(`
        *,
        tuition_accounts!inner (
          id,
          total_amount,
          paid_amount,
          balance,
          students!inner (
            id,
            matricule,
            first_name,
            last_name,
            display_name,
            date_of_birth,
            parent_name,
            parent_phone,
            school_id,
            classes!inner (
              name,
              level,
              tuition_amount
            ),
            schools!inner (
              id,
              name,
              short_name,
              address,
              phone,
              email,
              region,
              province,
              commune
            )
          ),
          academic_years!inner (
            label,
            start_date,
            end_date
          )
        )
      `)
      .eq('id', payment_id)
      .single()

    if (error || !payment) {
      console.error('Payment fetch error:', error)
      return NextResponse.json(
        { error: 'Paiement introuvable' },
        { status: 404 }
      )
    }

    const student = payment.tuition_accounts?.students
    const school = student?.schools
    const classe = student?.classes
    const tuitionAccount = payment.tuition_accounts
    const academicYear = tuitionAccount?.academic_years

    // Créer le document PDF
    const doc = new jsPDF()

    // Configuration des couleurs
    const primaryColor = [59, 130, 246] // blue-600
    const textColor = [31, 41, 55] // gray-800
    const lightGray = [243, 244, 246] // gray-100

    // En-tête avec logo/nom de l'école
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.rect(0, 0, 210, 40, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.text(school?.short_name || school?.name || 'École', 105, 20, { align: 'center' })

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    if (school?.address) {
      doc.text(school.address, 105, 28, { align: 'center' })
    }
    if (school?.phone || school?.email) {
      doc.text(
        `${school?.phone || ''} • ${school?.email || ''}`,
        105,
        34,
        { align: 'center' }
      )
    }

    // Titre du reçu
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('REÇU DE PAIEMENT', 105, 55, { align: 'center' })

    // Ligne de séparation
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.setLineWidth(0.5)
    doc.line(20, 60, 190, 60)

    // Informations du reçu - Section gauche
    let yPos = 75
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('Informations du paiement', 20, yPos)

    yPos += 8
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')

    const leftInfo = [
      ['N° Reçu:', payment.reference],
      ['Date:', format(new Date(payment.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })],
      ['Montant:', `${payment.amount.toLocaleString('fr-FR')} FCFA`],
      ['Commission:', `${payment.commission_amount.toLocaleString('fr-FR')} FCFA`],
      ['Net reçu:', `${payment.net_amount.toLocaleString('fr-FR')} FCFA`],
      ['Mode de paiement:', translateChannel(payment.channel)],
      ['Opérateur:', translateProvider(payment.provider)],
      ['Statut:', translateStatus(payment.status)],
    ]

    leftInfo.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold')
      doc.text(label, 20, yPos)
      doc.setFont('helvetica', 'normal')
      doc.text(value, 65, yPos)
      yPos += 7
    })

    // Informations de l'élève - Section droite
    yPos = 75
    doc.setFont('helvetica', 'bold')
    doc.text('Informations de l\'élève', 110, yPos)

    yPos += 8
    const rightInfo = [
      ['Élève:', student?.display_name || `${student?.first_name} ${student?.last_name}`],
      ['Matricule:', student?.matricule],
      ['Classe:', classe?.name],
      ['Année:', academicYear?.label],
      ['', ''],
      ['Parent/Tuteur:', student?.parent_name || payment.payer_name],
      ['Téléphone:', student?.parent_phone || payment.payer_phone],
    ]

    rightInfo.forEach(([label, value]) => {
      if (label) {
        doc.setFont('helvetica', 'bold')
        doc.text(label, 110, yPos)
      }
      doc.setFont('helvetica', 'normal')
      doc.text(value || '', 145, yPos)
      yPos += 7
    })

    // Section récapitulatif de scolarité
    yPos += 10
    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2])
    doc.rect(20, yPos - 5, 170, 35, 'F')

    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('Récapitulatif de Scolarité', 20, yPos + 2)

    yPos += 10
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')

    const summary = [
      ['Scolarité totale:', `${tuitionAccount?.total_amount.toLocaleString('fr-FR')} FCFA`],
      ['Total payé:', `${tuitionAccount?.paid_amount.toLocaleString('fr-FR')} FCFA`],
      ['Reste à payer:', `${tuitionAccount?.balance.toLocaleString('fr-FR')} FCFA`],
    ]

    summary.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold')
      doc.text(label, 20, yPos)
      doc.setFont('helvetica', 'normal')
      doc.text(value, 145, yPos, { align: 'right' })
      yPos += 7
    })

    // Statut de paiement
    yPos += 5
    if (tuitionAccount?.is_fully_paid) {
      doc.setFillColor(34, 197, 94) // green-500
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.rect(20, yPos - 5, 170, 10, 'F')
      doc.text('✓ SCOLARITÉ ENTIÈREMENT PAYÉE', 105, yPos + 2, { align: 'center' })
    } else {
      doc.setFillColor(251, 191, 36) // amber-400
      doc.setTextColor(textColor[0], textColor[1], textColor[2])
      doc.setFont('helvetica', 'bold')
      doc.rect(20, yPos - 5, 170, 10, 'F')
      doc.text(`PAIEMENT PARTIEL - Reste: ${tuitionAccount?.balance.toLocaleString('fr-FR')} FCFA`, 105, yPos + 2, { align: 'center' })
    }

    // Note importante
    yPos += 20
    doc.setTextColor(textColor[0], textColor[1], textColor[2])
    doc.setFontSize(9)
    doc.setFont('helvetica', 'italic')
    doc.text('Note: Ce reçu fait foi de paiement. Veuillez le conserver précieusement.', 105, yPos, { align: 'center' })

    // Pied de page avec signature
    yPos = 260
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text('Signature et cachet de l\'établissement', 140, yPos)

    doc.setLineWidth(0.3)
    doc.line(130, yPos + 15, 190, yPos + 15)

    // Date d'émission
    doc.setFontSize(8)
    doc.text(`Émis le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`, 20, 285)

    // Numéro de page
    doc.text('Page 1/1', 190, 285, { align: 'right' })

    // Générer le PDF
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

    // Retourner le fichier
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=recu_${payment.reference}.pdf`,
      },
    })

  } catch (error) {
    console.error('Receipt generation error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération du reçu' },
      { status: 500 }
    )
  }
}

// Fonctions utilitaires pour la traduction
function translateChannel(channel: string): string {
  const translations: Record<string, string> = {
    'app_mobile': 'Application Mobile',
    'ussd': 'USSD',
    'agent_cash': 'Agent (Espèces)',
    'bank_transfer': 'Virement Bancaire',
    'card': 'Carte Bancaire',
  }
  return translations[channel] || channel
}

function translateProvider(provider: string): string {
  const translations: Record<string, string> = {
    'orange_money': 'Orange Money',
    'moov_money': 'Moov Money',
    'wave': 'Wave',
    'manual': 'Manuel',
    'cinetpay': 'CinetPay',
  }
  return translations[provider] || provider
}

function translateStatus(status: string): string {
  const translations: Record<string, string> = {
    'pending': 'En attente',
    'completed': 'Complété',
    'failed': 'Échoué',
    'cancelled': 'Annulé',
  }
  return translations[status] || status
}
