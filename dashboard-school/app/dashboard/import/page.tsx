'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Upload, FileSpreadsheet, Download, AlertCircle,
  CheckCircle, XCircle, FileText
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{
    success: number
    errors: Array<{ row: number; message: string }>
    warnings: Array<{ row: number; message: string }>
  } | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]

      // Vérifier le type de fichier
      const validTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ]

      if (!validTypes.includes(selectedFile.type)) {
        toast.error('Format de fichier invalide. Utilisez CSV ou Excel (.xlsx)')
        return
      }

      setFile(selectedFile)
      setResult(null)
    }
  }

  const handleImport = async () => {
    if (!file) {
      toast.error('Veuillez sélectionner un fichier')
      return
    }

    setImporting(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/students/import', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
        toast.success(`${data.success} élèves importés avec succès`)
      } else {
        toast.error(data.message || 'Erreur lors de l\'import')
      }
    } catch (error) {
      toast.error('Erreur de connexion')
    } finally {
      setImporting(false)
    }
  }

  const downloadTemplate = () => {
    // Créer un CSV template
    const template = [
      ['matricule', 'first_name', 'last_name', 'date_of_birth', 'gender', 'class_name', 'parent_phone', 'parent_name'],
      ['2024-001', 'Jean', 'Ouédraogo', '2008-05-15', 'M', '6ème A', '+22670123456', 'M. Ouédraogo'],
      ['2024-002', 'Marie', 'Kaboré', '2009-03-20', 'F', '6ème A', '+22670234567', 'Mme Kaboré'],
    ]

    const csvContent = template.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'template_import_eleves.csv'
    a.click()
    window.URL.revokeObjectURL(url)

    toast.success('Modèle téléchargé')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Import d'Élèves</h1>
        <p className="text-gray-600 mt-1">Importez vos élèves en masse via CSV ou Excel</p>
      </div>

      {/* Instructions */}
      <Card className="border-indigo-200 bg-indigo-50">
        <CardContent className="p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-indigo-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Instructions</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Téléchargez le modèle CSV ci-dessous</li>
                <li>• Remplissez les informations des élèves</li>
                <li>• Importez le fichier (CSV ou Excel acceptés)</li>
                <li>• Les matricules doivent être uniques</li>
                <li>• Les classes doivent déjà exister dans le système</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Template Download */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                <FileSpreadsheet className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Modèle CSV</h3>
                <p className="text-sm text-gray-600">
                  Téléchargez le modèle pour voir le format requis
                </p>
              </div>
            </div>
            <Button onClick={downloadTemplate} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Télécharger le modèle
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Importer le fichier</h3>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                type="file"
                id="file-upload"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="h-12 w-12 text-gray-400 mb-4" />
                {file ? (
                  <>
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      Cliquez pour sélectionner un fichier
                    </p>
                    <p className="text-xs text-gray-500">
                      CSV, XLSX ou XLS (Max 5MB)
                    </p>
                  </>
                )}
              </label>
            </div>

            {file && (
              <div className="flex space-x-2">
                <Button
                  onClick={handleImport}
                  disabled={importing}
                  className="flex-1"
                >
                  {importing ? (
                    <>
                      <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Import en cours...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Importer les élèves
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setFile(null)
                    setResult(null)
                  }}
                  variant="outline"
                >
                  Annuler
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Import Results */}
      {result && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Résultats de l'import</h3>

            {/* Success */}
            {result.success > 0 && (
              <div className="flex items-start space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-green-900">
                    {result.success} élève(s) importé(s) avec succès
                  </p>
                </div>
              </div>
            )}

            {/* Errors */}
            {result.errors.length > 0 && (
              <div className="mb-4">
                <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-red-900 mb-2">
                      {result.errors.length} erreur(s)
                    </p>
                    <ul className="text-sm text-red-700 space-y-1">
                      {result.errors.map((error, index) => (
                        <li key={index}>
                          Ligne {error.row}: {error.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Warnings */}
            {result.warnings.length > 0 && (
              <div>
                <div className="flex items-start space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-yellow-900 mb-2">
                      {result.warnings.length} avertissement(s)
                    </p>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      {result.warnings.map((warning, index) => (
                        <li key={index}>
                          Ligne {warning.row}: {warning.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Format Guide */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Format du fichier</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Colonne</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Description</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Requis</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700">Exemple</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-4 py-2 font-mono text-xs">matricule</td>
                  <td className="px-4 py-2">Matricule unique de l'élève</td>
                  <td className="px-4 py-2"><CheckCircle className="h-4 w-4 text-green-600" /></td>
                  <td className="px-4 py-2">2024-001</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-xs">first_name</td>
                  <td className="px-4 py-2">Prénom</td>
                  <td className="px-4 py-2"><CheckCircle className="h-4 w-4 text-green-600" /></td>
                  <td className="px-4 py-2">Jean</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-xs">last_name</td>
                  <td className="px-4 py-2">Nom de famille</td>
                  <td className="px-4 py-2"><CheckCircle className="h-4 w-4 text-green-600" /></td>
                  <td className="px-4 py-2">Ouédraogo</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-xs">date_of_birth</td>
                  <td className="px-4 py-2">Date de naissance (YYYY-MM-DD)</td>
                  <td className="px-4 py-2 text-gray-400">Optionnel</td>
                  <td className="px-4 py-2">2008-05-15</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-xs">gender</td>
                  <td className="px-4 py-2">Genre (M ou F)</td>
                  <td className="px-4 py-2 text-gray-400">Optionnel</td>
                  <td className="px-4 py-2">M</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-xs">class_name</td>
                  <td className="px-4 py-2">Nom de la classe</td>
                  <td className="px-4 py-2"><CheckCircle className="h-4 w-4 text-green-600" /></td>
                  <td className="px-4 py-2">6ème A</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-xs">parent_phone</td>
                  <td className="px-4 py-2">Téléphone du parent</td>
                  <td className="px-4 py-2 text-gray-400">Optionnel</td>
                  <td className="px-4 py-2">+22670123456</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-mono text-xs">parent_name</td>
                  <td className="px-4 py-2">Nom du parent/tuteur</td>
                  <td className="px-4 py-2 text-gray-400">Optionnel</td>
                  <td className="px-4 py-2">M. Ouédraogo</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
