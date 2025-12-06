import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { school_id, format: exportFormat, filters } = body

    if (!school_id) {
      return NextResponse.json(
        { error: 'school_id requis' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()

    // Récupérer les paiements
    let query = supabase
      .from('payments')
      .select(`
        id,
        reference,
        amount,
        commission_amount,
        net_amount,
        currency,
        channel,
        provider,
        status,
        created_at,
        payer_name,
        payer_phone,
        tuition_accounts!inner (
          student_id,
          students!inner (
            id,
            matricule,
            first_name,
            last_name,
            display_name,
            school_id,
            classes!inner (
              name
            )
          )
        )
      `)
      .eq('tuition_accounts.students.school_id', school_id)
      .order('created_at', { ascending: false })

    // Appliquer les filtres si fournis
    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate)
    }
    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate)
    }
    if (filters?.channel) {
      query = query.eq('channel', filters.channel)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    const { data: payments, error } = await query

    if (error) {
      console.error('Export error:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des données' },
        { status: 500 }
      )
    }

    if (!payments || payments.length === 0) {
      return NextResponse.json(
        { error: 'Aucun paiement à exporter' },
        { status: 404 }
      )
    }

    if (exportFormat === 'excel') {
      // Préparer les données pour Excel
      const excelData = payments.map((p: any) => {
        const student = p.tuition_accounts?.students
        return {
          'Référence': p.reference,
          'Date': format(new Date(p.created_at), 'dd/MM/yyyy HH:mm', { locale: fr }),
          'Élève': student?.display_name || `${student?.first_name} ${student?.last_name}`,
          'Matricule': student?.matricule,
          'Classe': student?.classes?.name,
          'Montant': p.amount,
          'Commission': p.commission_amount,
          'Net': p.net_amount,
          'Canal': translateChannel(p.channel),
          'Opérateur': translateProvider(p.provider),
          'Statut': translateStatus(p.status),
          'Payeur': p.payer_name,
          'Téléphone': p.payer_phone,
        }
      })

      // Créer le classeur Excel
      const worksheet = XLSX.utils.json_to_sheet(excelData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Paiements')

      // Définir la largeur des colonnes
      const columnWidths = [
        { wch: 15 }, // Référence
        { wch: 18 }, // Date
        { wch: 25 }, // Élève
        { wch: 12 }, // Matricule
        { wch: 10 }, // Classe
        { wch: 12 }, // Montant
        { wch: 12 }, // Commission
        { wch: 12 }, // Net
        { wch: 15 }, // Canal
        { wch: 15 }, // Opérateur
        { wch: 12 }, // Statut
        { wch: 25 }, // Payeur
        { wch: 15 }, // Téléphone
      ]
      worksheet['!cols'] = columnWidths

      // Générer le buffer Excel
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

      // Retourner le fichier
      return new NextResponse(excelBuffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename=paiements_${format(new Date(), 'yyyy-MM-dd')}.xlsx`,
        },
      })
    } else if (exportFormat === 'pdf') {
      // Créer le document PDF
      const doc = new jsPDF('landscape')

      // En-tête
      doc.setFontSize(18)
      doc.text('Rapport des Paiements', 14, 20)

      doc.setFontSize(10)
      doc.text(`Date d'export: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })}`, 14, 28)

      if (filters?.startDate || filters?.endDate) {
        let dateRange = 'Période: '
        if (filters.startDate) {
          dateRange += format(new Date(filters.startDate), 'dd/MM/yyyy', { locale: fr })
        }
        if (filters.endDate) {
          dateRange += ` - ${format(new Date(filters.endDate), 'dd/MM/yyyy', { locale: fr })}`
        }
        doc.text(dateRange, 14, 34)
      }

      // Préparer les données pour le tableau
      const tableData = payments.map((p: any) => {
        const student = p.tuition_accounts?.students
        return [
          p.reference,
          format(new Date(p.created_at), 'dd/MM/yyyy', { locale: fr }),
          student?.display_name || `${student?.first_name} ${student?.last_name}`,
          student?.classes?.name,
          p.amount.toLocaleString('fr-FR') + ' F',
          translateChannel(p.channel),
          translateStatus(p.status),
        ]
      })

      // Ajouter le tableau
      autoTable(doc, {
        head: [['Référence', 'Date', 'Élève', 'Classe', 'Montant', 'Canal', 'Statut']],
        body: tableData,
        startY: filters?.startDate || filters?.endDate ? 38 : 32,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] }, // blue-600
      })

      // Ajouter le total
      const total = payments.reduce((sum: number, p: any) => sum + p.amount, 0)
      const finalY = (doc as any).lastAutoTable.finalY || 40

      doc.setFontSize(12)
      doc.text(`Total: ${total.toLocaleString('fr-FR')} FCFA`, 14, finalY + 10)
      doc.text(`Nombre de paiements: ${payments.length}`, 14, finalY + 17)

      // Générer le PDF
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

      // Retourner le fichier
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename=paiements_${format(new Date(), 'yyyy-MM-dd')}.pdf`,
        },
      })
    }

    return NextResponse.json(
      { error: 'Format non supporté' },
      { status: 400 }
    )

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
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
