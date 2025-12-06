import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const schoolId = formData.get('school_id') as string

    if (!file) {
      return NextResponse.json(
        { error: 'Fichier requis' },
        { status: 400 }
      )
    }

    if (!schoolId) {
      return NextResponse.json(
        { error: 'school_id requis' },
        { status: 400 }
      )
    }

    // Vérifier le type de fichier
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]

    if (!validTypes.includes(file.type) && !file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
      return NextResponse.json(
        { error: 'Format de fichier invalide. Utilisez CSV ou Excel (.xlsx)' },
        { status: 400 }
      )
    }

    // Lire le contenu du fichier
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const supabase = createServerClient()

    // Parser le fichier selon son type
    let students: any[] = []
    const isExcel = file.name.endsWith('.xlsx') || file.type.includes('spreadsheet')

    if (isExcel) {
      students = parseExcel(buffer)
    } else {
      students = await parseCSV(buffer)
    }

    if (students.length === 0) {
      return NextResponse.json(
        { error: 'Aucune donnée trouvée dans le fichier' },
        { status: 400 }
      )
    }

    // Récupérer l'année académique actuelle
    const { data: academicYear } = await supabase
      .from('academic_years')
      .select('id')
      .eq('school_id', schoolId)
      .eq('is_current', true)
      .single()

    if (!academicYear) {
      return NextResponse.json(
        { error: 'Aucune année académique active trouvée' },
        { status: 400 }
      )
    }

    // Récupérer toutes les classes de l'école
    const { data: classes } = await supabase
      .from('classes')
      .select('id, name')
      .eq('school_id', schoolId)

    const classMap = new Map(classes?.map(c => [c.name.toLowerCase(), c]) || [])

    const results = {
      success: 0,
      errors: [] as any[],
      warnings: [] as any[],
    }

    // Traiter chaque élève
    for (let i = 0; i < students.length; i++) {
      const row = students[i]
      const lineNumber = i + 2 // +2 car ligne 1 = header

      // Valider la ligne
      const validation = validateStudentRow(row, lineNumber)
      if (!validation.valid) {
        results.errors.push(...validation.errors.map(e => ({ row: lineNumber, message: e })))
        continue
      }

      // Vérifier que la classe existe
      const classe = classMap.get(row.class_name?.toLowerCase())
      if (!classe) {
        results.errors.push({
          row: lineNumber,
          message: `Classe "${row.class_name}" introuvable`
        })
        continue
      }

      // Vérifier si le matricule existe déjà
      const { data: existing } = await supabase
        .from('students')
        .select('id')
        .eq('school_id', schoolId)
        .eq('matricule', row.matricule)
        .single()

      if (existing) {
        results.warnings.push({
          row: lineNumber,
          message: `Matricule ${row.matricule} existe déjà, ignoré`
        })
        continue
      }

      // Créer l'élève
      const { data: student, error: studentError } = await supabase
        .from('students')
        .insert({
          school_id: schoolId,
          class_id: classe.id,
          matricule: row.matricule,
          first_name: row.first_name,
          last_name: row.last_name,
          display_name: row.display_name || `${row.first_name} ${row.last_name}`,
          gender: row.gender || null,
          date_of_birth: row.date_of_birth || null,
          place_of_birth: row.place_of_birth || null,
          parent_name: row.parent_name || null,
          parent_phone: row.parent_phone || null,
          parent_email: row.parent_email || null,
          address: row.address || null,
          is_active: true,
        })
        .select()
        .single()

      if (studentError || !student) {
        results.errors.push({
          row: lineNumber,
          message: `Erreur création élève: ${studentError?.message || 'Inconnue'}`
        })
        continue
      }

      // Créer le compte de scolarité
      const { data: tuitionData } = await supabase
        .from('classes')
        .select('tuition_amount')
        .eq('id', classe.id)
        .single()

      const { error: tuitionError } = await supabase
        .from('tuition_accounts')
        .insert({
          student_id: student.id,
          academic_year_id: academicYear.id,
          total_amount: tuitionData?.tuition_amount || 0,
          paid_amount: 0,
          balance: tuitionData?.tuition_amount || 0,
          is_fully_paid: false,
        })

      if (tuitionError) {
        results.warnings.push({
          row: lineNumber,
          message: `Élève créé mais erreur compte scolarité: ${tuitionError.message}`
        })
      } else {
        results.success++
      }
    }

    return NextResponse.json(results)

  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

// Fonction helper pour parser CSV
async function parseCSV(buffer: Buffer): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const text = buffer.toString('utf-8')
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => {
        // Normaliser les noms de colonnes
        const headerMap: Record<string, string> = {
          'matricule': 'matricule',
          'prénom': 'first_name',
          'prenom': 'first_name',
          'nom': 'last_name',
          'genre': 'gender',
          'sexe': 'gender',
          'date de naissance': 'date_of_birth',
          'date_naissance': 'date_of_birth',
          'lieu de naissance': 'place_of_birth',
          'lieu_naissance': 'place_of_birth',
          'classe': 'class_name',
          'parent': 'parent_name',
          'tuteur': 'parent_name',
          'téléphone': 'parent_phone',
          'telephone': 'parent_phone',
          'tel': 'parent_phone',
          'email': 'parent_email',
          'adresse': 'address',
        }
        return headerMap[header.toLowerCase().trim()] || header.toLowerCase().replace(/\s+/g, '_')
      },
      complete: (results) => {
        resolve(results.data as any[])
      },
      error: (error) => {
        reject(error)
      }
    })
  })
}

// Fonction helper pour parser Excel
function parseExcel(buffer: Buffer): any[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
  const data = XLSX.utils.sheet_to_json(firstSheet)

  // Normaliser les noms de colonnes comme pour CSV
  return data.map((row: any) => {
    const normalized: any = {}
    const headerMap: Record<string, string> = {
      'matricule': 'matricule',
      'prénom': 'first_name',
      'prenom': 'first_name',
      'nom': 'last_name',
      'genre': 'gender',
      'sexe': 'gender',
      'date de naissance': 'date_of_birth',
      'date_naissance': 'date_of_birth',
      'lieu de naissance': 'place_of_birth',
      'lieu_naissance': 'place_of_birth',
      'classe': 'class_name',
      'parent': 'parent_name',
      'tuteur': 'parent_name',
      'téléphone': 'parent_phone',
      'telephone': 'parent_phone',
      'tel': 'parent_phone',
      'email': 'parent_email',
      'adresse': 'address',
    }

    Object.keys(row).forEach(key => {
      const normalizedKey = headerMap[key.toLowerCase().trim()] || key.toLowerCase().replace(/\s+/g, '_')
      normalized[normalizedKey] = row[key]
    })

    return normalized
  })
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
