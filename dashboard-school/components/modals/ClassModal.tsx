'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore, useAcademicYearsStore } from '@/lib/store'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface ClassModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  classItem?: any // Pour l'édition
  onSuccess?: () => void
}

export function ClassModal({ open, onOpenChange, classItem, onSuccess }: ClassModalProps) {
  const { school } = useAuthStore()
  const { academicYears, fetchAcademicYears } = useAcademicYearsStore()
  const supabase = createClientComponentClient()

  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    level: '',
    section: '',
    academic_year_id: '',
    tuition_amount: '',
    allow_installments: true,
    min_installment_amount: '',
    max_students: '',
  })

  useEffect(() => {
    if (school && academicYears.length === 0) {
      fetchAcademicYears(school.id)
    }
  }, [school, academicYears, fetchAcademicYears])

  useEffect(() => {
    if (classItem) {
      setFormData({
        name: classItem.name || '',
        level: classItem.level || '',
        section: classItem.section || '',
        academic_year_id: classItem.academic_year_id || '',
        tuition_amount: classItem.tuition_amount?.toString() || '',
        allow_installments: classItem.allow_installments ?? true,
        min_installment_amount: classItem.min_installment_amount?.toString() || '',
        max_students: classItem.max_students?.toString() || '',
      })
    } else {
      // Trouver l'année courante par défaut
      const currentYear = academicYears.find((y: any) => y.is_current)
      setFormData({
        name: '',
        level: '',
        section: '',
        academic_year_id: currentYear?.id || '',
        tuition_amount: '',
        allow_installments: true,
        min_installment_amount: '',
        max_students: '',
      })
    }
  }, [classItem, academicYears, open])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

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

    if (!formData.name || !formData.academic_year_id || !formData.tuition_amount) {
      toast.error('Veuillez remplir tous les champs requis')
      return
    }

    setIsLoading(true)

    try {
      const classData = {
        school_id: school.id,
        name: formData.name,
        level: formData.level || null,
        section: formData.section || null,
        academic_year_id: formData.academic_year_id,
        tuition_amount: parseFloat(formData.tuition_amount),
        allow_installments: formData.allow_installments,
        min_installment_amount: formData.min_installment_amount
          ? parseFloat(formData.min_installment_amount)
          : null,
        max_students: formData.max_students ? parseInt(formData.max_students) : null,
      }

      if (classItem) {
        const { error } = await supabase
          .from('classes')
          .update(classData)
          .eq('id', classItem.id)

        if (error) throw error
        toast.success('Classe modifiée avec succès')
      } else {
        const { error } = await supabase
          .from('classes')
          .insert(classData)

        if (error) throw error
        toast.success('Classe ajoutée avec succès')
      }

      onSuccess?.()
      onOpenChange(false)
    } catch (error: any) {
      console.error('Error saving class:', error)
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
            {classItem ? 'Modifier la classe' : 'Ajouter une classe'}
          </DialogTitle>
          <DialogDescription>
            {classItem ? 'Modifiez les informations de la classe' : 'Remplissez les informations de la classe'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de la classe <span className="text-red-500">*</span>
                </label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ex: 6ème A"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Année académique <span className="text-red-500">*</span>
                </label>
                <select
                  name="academic_year_id"
                  value={formData.academic_year_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Sélectionner</option>
                  {academicYears.map((year: any) => (
                    <option key={year.id} value={year.id}>
                      {year.label} {year.is_current && '(En cours)'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Niveau
                </label>
                <Input
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                  placeholder="Ex: 6ème, 2nde"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Section
                </label>
                <Input
                  name="section"
                  value={formData.section}
                  onChange={handleChange}
                  placeholder="Ex: A, B, Scientifique"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Montant de la scolarité (FCFA) <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                name="tuition_amount"
                value={formData.tuition_amount}
                onChange={handleChange}
                placeholder="Ex: 100000"
                step="1000"
                min="0"
                required
              />
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center space-x-2 mb-3">
                <input
                  type="checkbox"
                  id="allow_installments"
                  name="allow_installments"
                  checked={formData.allow_installments}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="allow_installments" className="text-sm font-medium text-gray-700">
                  Autoriser le paiement fractionné
                </label>
              </div>

              {formData.allow_installments && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Montant minimum par versement (FCFA)
                  </label>
                  <Input
                    type="number"
                    name="min_installment_amount"
                    value={formData.min_installment_amount}
                    onChange={handleChange}
                    placeholder="Ex: 25000"
                    step="1000"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Montant minimum que les parents doivent payer à chaque versement
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre maximum d'élèves
              </label>
              <Input
                type="number"
                name="max_students"
                value={formData.max_students}
                onChange={handleChange}
                placeholder="Ex: 40"
                min="1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Laissez vide pour aucune limite
              </p>
            </div>
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
              {classItem ? 'Modifier' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
