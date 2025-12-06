'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore, useAcademicYearsStore } from '@/lib/store'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface AcademicYearModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  academicYear?: any // Pour l'édition
  onSuccess?: () => void
}

export function AcademicYearModal({ open, onOpenChange, academicYear, onSuccess }: AcademicYearModalProps) {
  const { school } = useAuthStore()
  const { addAcademicYear, updateAcademicYear } = useAcademicYearsStore()

  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    label: '',
    start_date: '',
    end_date: '',
    registration_deadline: '',
    is_current: false,
  })

  useEffect(() => {
    if (academicYear) {
      setFormData({
        label: academicYear.label || '',
        start_date: academicYear.start_date || '',
        end_date: academicYear.end_date || '',
        registration_deadline: academicYear.registration_deadline || '',
        is_current: academicYear.is_current ?? false,
      })
    } else {
      // Générer automatiquement le label pour la nouvelle année
      const currentYear = new Date().getFullYear()
      const nextYear = currentYear + 1
      setFormData({
        label: `${currentYear}-${nextYear}`,
        start_date: `${currentYear}-10-01`,
        end_date: `${nextYear}-07-31`,
        registration_deadline: `${currentYear}-10-15`,
        is_current: false,
      })
    }
  }, [academicYear, open])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!school) {
      toast.error('École non trouvée')
      return
    }

    if (!formData.label || !formData.start_date || !formData.end_date) {
      toast.error('Veuillez remplir tous les champs requis')
      return
    }

    // Vérifier que la date de fin est après la date de début
    if (new Date(formData.end_date) <= new Date(formData.start_date)) {
      toast.error('La date de fin doit être après la date de début')
      return
    }

    setIsLoading(true)

    try {
      const yearData = {
        ...formData,
        school_id: school.id,
      }

      if (academicYear) {
        await updateAcademicYear(academicYear.id, yearData)
        toast.success('Année académique modifiée avec succès')
      } else {
        await addAcademicYear(yearData)
        toast.success('Année académique ajoutée avec succès')
      }

      onSuccess?.()
      onOpenChange(false)
    } catch (error: any) {
      console.error('Error saving academic year:', error)
      toast.error(error.message || 'Erreur lors de l\'enregistrement')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader onClose={() => onOpenChange(false)}>
          <DialogTitle>
            {academicYear ? 'Modifier l\'année académique' : 'Ajouter une année académique'}
          </DialogTitle>
          <DialogDescription>
            {academicYear ? 'Modifiez les informations de l\'année académique' : 'Remplissez les informations de l\'année académique'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Libellé <span className="text-red-500">*</span>
              </label>
              <Input
                name="label"
                value={formData.label}
                onChange={handleChange}
                placeholder="Ex: 2024-2025"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Format recommandé: YYYY-YYYY (ex: 2024-2025)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de début <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de fin <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date limite d'inscription
              </label>
              <Input
                type="date"
                name="registration_deadline"
                value={formData.registration_deadline}
                onChange={handleChange}
              />
              <p className="text-xs text-gray-500 mt-1">
                Date limite pour les nouvelles inscriptions
              </p>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="is_current"
                name="is_current"
                checked={formData.is_current}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="is_current" className="text-sm font-medium text-gray-700">
                Définir comme année en cours
              </label>
            </div>

            {formData.is_current && (
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                <p className="text-sm text-amber-800">
                  <strong>Attention:</strong> Si vous définissez cette année comme année en cours,
                  toutes les autres années académiques seront automatiquement marquées comme non courantes.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {academicYear ? 'Modifier' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
