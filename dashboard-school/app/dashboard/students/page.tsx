'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Filter, Download, Edit, Trash2, Users } from 'lucide-react'
import { useStudentsStore, useAuthStore } from '@/lib/store'
import { formatCurrency, formatDate, getInitials } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function StudentsPage() {
  const { school } = useAuthStore()
  const {
    students,
    isLoading,
    error,
    fetchStudents,
    deleteStudent
  } = useStudentsStore()

  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    if (school) {
      fetchStudents()
    }
  }, [school, fetchStudents])

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir désactiver cet élève ?')) {
      return
    }

    const result = await deleteStudent(id)

    if (result.success) {
      toast.success('Élève désactivé avec succès')
    } else {
      toast.error(result.error || 'Erreur lors de la désactivation')
    }
  }

  const filteredStudents = students.filter(student =>
    student.is_active &&
    (searchTerm === '' ||
      student.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.matricule.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.class_name?.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const activeStudents = students.filter(s => s.is_active).length
  const inactiveStudents = students.filter(s => !s.is_active).length
  const fullyPaidStudents = students.filter(s => s.tuition?.is_fully_paid).length

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Gestion des Élèves</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">{error}</p>
            <Button onClick={() => fetchStudents()} className="mt-4">
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
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Élèves</h1>
          <p className="text-gray-600 mt-1">Gérez les informations de vos élèves</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-5 w-5 mr-2" />
          Nouvel Élève
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Élèves" value={students.length} color="bg-blue-100 text-blue-600" />
        <StatCard title="Actifs" value={activeStudents} color="bg-green-100 text-green-600" />
        <StatCard title="Inactifs" value={inactiveStudents} color="bg-red-100 text-red-600" />
        <StatCard title="À jour (paiement)" value={fullyPaidStudents} color="bg-purple-100 text-purple-600" />
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, matricule ou classe..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <Button variant="outline">
              <Filter className="h-5 w-5 mr-2" />
              Filtrer
            </Button>
            <Button variant="outline">
              <Download className="h-5 w-5 mr-2" />
              Exporter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-600">Chargement des élèves...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">
                {searchTerm ? 'Aucun élève trouvé' : 'Aucun élève enregistré'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowAddModal(true)} className="mt-4">
                  Ajouter le premier élève
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Élève
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Matricule
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Classe
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Genre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Parent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Scolarité
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-indigo-600 font-medium text-sm">
                              {getInitials(student.first_name, student.last_name)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {student.display_name}
                            </div>
                            {student.date_of_birth && (
                              <div className="text-sm text-gray-500">
                                Né(e) le {formatDate(student.date_of_birth)}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono text-gray-900">{student.matricule}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{student.class_name || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {student.gender === 'M' ? 'Masculin' : student.gender === 'F' ? 'Féminin' : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{student.parent_name || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{student.parent_phone || ''}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {student.tuition ? (
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {formatCurrency(student.tuition.paid_amount)} / {formatCurrency(student.tuition.total_amount)}
                            </div>
                            <div className={`text-sm ${student.tuition.is_fully_paid ? 'text-green-600' : 'text-orange-600'}`}>
                              {student.tuition.is_fully_paid ? 'Soldé' : `Reste: ${formatCurrency(student.tuition.balance)}`}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">Non défini</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={student.is_active ? 'success' : 'danger'}>
                          {student.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => toast.info('Édition en cours de développement')}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(student.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Ajout (à implémenter) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Nouvel Élève</h2>
            <p className="text-gray-600 mb-4">
              Fonctionnalité en cours de développement. Utilisez la page Import pour ajouter des élèves en masse.
            </p>
            <Button onClick={() => setShowAddModal(false)}>
              Fermer
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ title, value, color }: { title: string; value: number; color: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className={`text-2xl font-bold mt-2 ${color}`}>{value}</p>
      </CardContent>
    </Card>
  )
}
