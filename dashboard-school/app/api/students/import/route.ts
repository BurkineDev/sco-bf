import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'Fichier requis' },
        { status: 400 }
      )
    }

    // Vérifier le type de fichier
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]

    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Format de fichier invalide. Utilisez CSV ou Excel (.xlsx)' },
        { status: 400 }
      )
    }

    // Lire le contenu du fichier
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // TODO: Parser le fichier CSV/Excel
    // Pour CSV : utiliser papaparse ou csv-parser
    // Pour Excel : utiliser xlsx ou ExcelJS
    // const Papa = require('papaparse')
    // const XLSX = require('xlsx')

    const supabase = createServerClient()

    // TODO: Implémenter la logique d'import
    // 1. Parser le fichier
    // 2. Valider les données
    // 3. Vérifier les matricules uniques
    // 4. Vérifier que les classes existent
    // 5. Créer les élèves
    // 6. Créer les comptes de scolarité (tuition_accounts)

    // Pour le moment, retourner un placeholder
    return NextResponse.json({
      success: 0,
      errors: [
        { row: 0, message: 'Import en cours de développement' }
      ],
      warnings: []
    })

  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// Fonction helper pour parser CSV (à implémenter)
function parseCSV(buffer: Buffer): any[] {
  // TODO: Implémenter avec papaparse
  return []
}

// Fonction helper pour parser Excel (à implémenter)
function parseExcel(buffer: Buffer): any[] {
  // TODO: Implémenter avec xlsx
  return []
}

// Fonction helper pour valider une ligne d'élève
function validateStudentRow(row: any, lineNumber: number): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  // Vérifications requises
  if (!row.matricule) {
    errors.push(`Ligne ${lineNumber}: Matricule requis`)
  }
  if (!row.first_name) {
    errors.push(`Ligne ${lineNumber}: Prénom requis`)
  }
  if (!row.last_name) {
    errors.push(`Ligne ${lineNumber}: Nom requis`)
  }
  if (!row.class_name) {
    errors.push(`Ligne ${lineNumber}: Classe requise`)
  }

  // Vérifications optionnelles
  if (row.gender && !['M', 'F'].includes(row.gender)) {
    errors.push(`Ligne ${lineNumber}: Genre doit être M ou F`)
  }

  if (row.date_of_birth && !isValidDate(row.date_of_birth)) {
    errors.push(`Ligne ${lineNumber}: Date de naissance invalide (format: YYYY-MM-DD)`)
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

function isValidDate(dateString: string): boolean {
  const date = new Date(dateString)
  return date instanceof Date && !isNaN(date.getTime())
}
