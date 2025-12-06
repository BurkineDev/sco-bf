'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Plus, Calendar, CheckCircle, Edit, Trash2, Star
} from 'lucide-react'
import { useAcademicYearsStore, useAuthStore } from '@/lib/store'
import toast from 'react-hot-toast'

export default function AcademicYearsPage() {
  const { school } = useAuthStore()
  const {
    academicYears,
    currentYear,
    isLoading,
    error,
    fetchAcademicYears,
    setCurrentYear,
    deleteAcademicYear
  } = useAcademicYearsStore()

  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    if (school) {
      fetchAcademicYears()
    }
  }, [school, fetchAcademicYears])

  const handleSetCurrent = async (id: string) => {
    const result = await setCurrentYear(id)

    if (result.success) {
      toast.success('Année académique courante mise à jour')
    } else {
      toast.error(result.error || 'Erreur lors de la mise à jour')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette année académique ?')) {
      return
    }

    const result = await deleteAcademicYear(id)

    if (result.success) {
      toast.success('Année académique supprimée')
    } else {
      toast.error(result.error || 'Erreur lors de la suppression')
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      upcoming: 'warning',
      active: 'success',
      completed: 'info',
      archived: 'default',
    }
    return colors[status] || 'default'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      upcoming: 'À venir',
      active: 'En cours',
      completed: 'Terminée',
      archived: 'Archivée',
    }
    return labels[status] || status
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Années Académiques</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">{error}</p>
            <Button onClick={() => fetchAcademicYears()} className="mt-4">
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Années Académiques</h1>
          <p className="text-gray-600 mt-1">Gérez les années scolaires</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-5 w-5 mr-2" />
          Nouvelle Année
        </Button>
      </div>

      {/* Current Year Card */}
      {currentYear && (
        <Card className="border-2 border-indigo-200 bg-indigo-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Star className="h-5 w-5 text-indigo-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Année Courante
                  </h3>
                </div>
                <p className="text-2xl font-bold text-indigo-600">
                  {currentYear.label}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Du {new Date(currentYear.start_date).toLocaleDateString('fr-FR')} au{' '}
                  {new Date(currentYear.end_date).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <Badge variant="success" className="text-base px-4 py-2">
                {getStatusLabel(currentYear.status)}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Academic Years List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-600">Chargement des années académiques...</p>
            </div>
          ) : academicYears.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">Aucune année académique trouvée</p>
              <Button onClick={() => setShowAddModal(true)} className="mt-4">
                Créer la première année
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {academicYears.map((year) => (
                <div
                  key={year.id}
                  className={`p-6 hover:bg-gray-50 transition-colors ${
                    year.is_current ? 'bg-indigo-50/50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        {year.is_current && (
                          <Star className="h-5 w-5 text-indigo-600 fill-indigo-600" />
                        )}
                        <h3 className="text-lg font-semibold text-gray-900">
                          {year.label}
                        </h3>
                        <Badge variant={getStatusColor(year.status) as any}>
                          {getStatusLabel(year.status)}
                        </Badge>
                      </div>
                      <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Début: {new Date(year.start_date).toLocaleDateString('fr-FR')}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Fin: {new Date(year.end_date).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {!year.is_current && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetCurrent(year.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Définir comme courante
                        </Button>
                      )}
                      <button
                        onClick={() => toast.info('Édition en cours de développement')}
                        className="text-indigo-600 hover:text-indigo-900 p-2"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      {!year.is_current && (
                        <button
                          onClick={() => handleDelete(year.id)}
                          className="text-red-600 hover:text-red-900 p-2"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Ajout (à implémenter) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Nouvelle Année Académique
            </h2>
            <p className="text-gray-600 mb-4">
              Fonctionnalité en cours de développement
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Libellé (ex: 2024-2025)
                </label>
                <Input placeholder="2024-2025" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de début
                </label>
                <Input type="date" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de fin
                </label>
                <Input type="date" />
              </div>
              <div className="flex space-x-2">
                <Button onClick={() => setShowAddModal(false)} variant="outline" className="flex-1">
                  Annuler
                </Button>
                <Button className="flex-1">
                  Créer
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
