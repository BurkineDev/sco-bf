'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAcademicYearsStore, useAuthStore } from '@/lib/store'
import toast from 'react-hot-toast'

interface EditAcademicYearModalProps {
  isOpen: boolean
  onClose: () => void
  academicYear: any // The academic year to edit
}

export function EditAcademicYearModal({ isOpen, onClose, academicYear }: EditAcademicYearModalProps) {
  const { school } = useAuthStore()
  const { updateAcademicYear, fetchAcademicYears } = useAcademicYearsStore()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<{
    label: string;
    start_date: string;
    end_date: string;
    status: 'active' | 'completed' | 'upcoming' | 'archived';
  }>({
    label: '',
    start_date: '',
    end_date: '',
    status: 'active',
  })

  // Initialize form data when academic year changes
  useEffect(() => {
    if (academicYear) {
      setFormData({
        label: academicYear.label || '',
        start_date: academicYear.start_date || '',
        end_date: academicYear.end_date || '',
        status: (academicYear.status as 'active' | 'completed' | 'upcoming' | 'archived') || 'active',
      })
    }
  }, [academicYear])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!school?.id) {
      toast.error('École non sélectionnée')
      return
    }

    if (!formData.label || !formData.start_date || !formData.end_date) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    // Validate dates
    if (new Date(formData.start_date) >= new Date(formData.end_date)) {
      toast.error('La date de fin doit être après la date de début')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await updateAcademicYear(academicYear.id, formData)

      if (result.success) {
        toast.success('Année académique mise à jour avec succès')
        fetchAcademicYears() // Refresh the list
        onClose()
      } else {
        toast.error(result.error || 'Erreur lors de la mise à jour')
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour de l\'année académique')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen || !academicYear) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Modifier l'Année Académique</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom de l'année <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Ex: 2024-2025"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date de début <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date de fin <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Statut
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'completed' | 'upcoming' | 'archived' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="upcoming">À venir</option>
              <option value="active">En cours</option>
              <option value="completed">Terminée</option>
              <option value="archived">Archivée</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Mise à jour...' : 'Mettre à jour'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
