'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore, useDashboardStore, useStudentsStore } from '@/lib/store'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface StudentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  student?: any // Pour l'édition
  onSuccess?: () => void
}

export function StudentModal({ open, onOpenChange, student, onSuccess }: StudentModalProps) {
  const { school } = useAuthStore()
  const { classes, fetchClasses } = useDashboardStore()
  const { addStudent, updateStudent } = useStudentsStore()

  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    matricule: '',
    first_name: '',
    last_name: '',
    display_name: '',
    gender: '',
    date_of_birth: '',
    place_of_birth: '',
    class_id: '',
    parent_name: '',
    parent_phone: '',
    parent_email: '',
    address: '',
  })

  useEffect(() => {
    if (school && classes.length === 0) {
      fetchClasses(school.id)
    }
  }, [school, classes, fetchClasses])

  useEffect(() => {
    if (student) {
      setFormData({
        matricule: student.matricule || '',
        first_name: student.first_name || '',
        last_name: student.last_name || '',
        display_name: student.display_name || '',
        gender: student.gender || '',
        date_of_birth: student.date_of_birth || '',
        place_of_birth: student.place_of_birth || '',
        class_id: student.class_id || '',
        parent_name: student.parent_name || '',
        parent_phone: student.parent_phone || '',
        parent_email: student.parent_email || '',
        address: student.address || '',
      })
    } else {
      setFormData({
        matricule: '',
        first_name: '',
        last_name: '',
        display_name: '',
        gender: '',
        date_of_birth: '',
        place_of_birth: '',
        class_id: '',
        parent_name: '',
        parent_phone: '',
        parent_email: '',
        address: '',
      })
    }
  }, [student, open])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!school) {
      toast.error('École non trouvée')
      return
    }

    if (!formData.matricule || !formData.first_name || !formData.last_name || !formData.class_id) {
      toast.error('Veuillez remplir tous les champs requis')
      return
    }

    setIsLoading(true)

    try {
      const studentData = {
        ...formData,
        school_id: school.id,
        display_name: formData.display_name || `${formData.first_name} ${formData.last_name}`,
        is_active: true,
        gender: formData.gender === '' ? undefined : (formData.gender as 'M' | 'F'),
      }

      if (student) {
        await updateStudent(student.id, studentData)
        toast.success('Élève modifié avec succès')
      } else {
        await addStudent(studentData)
        toast.success('Élève ajouté avec succès')
      }

      onSuccess?.()
      onOpenChange(false)
    } catch (error: any) {
      console.error('Error saving student:', error)
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
            {student ? 'Modifier l\'élève' : 'Ajouter un élève'}
          </DialogTitle>
          <DialogDescription>
            {student ? 'Modifiez les informations de l\'élève' : 'Remplissez les informations de l\'élève'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Informations de base */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Matricule <span className="text-red-500">*</span>
                </label>
                <Input
                  name="matricule"
                  value={formData.matricule}
                  onChange={handleChange}
                  placeholder="Ex: 2024001"
                  required
                  disabled={!!student}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Classe <span className="text-red-500">*</span>
                </label>
                <select
                  name="class_id"
                  value={formData.class_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Sélectionner une classe</option>
                  {classes.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prénom <span className="text-red-500">*</span>
                </label>
                <Input
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="Prénom"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom <span className="text-red-500">*</span>
                </label>
                <Input
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Nom"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom d'affichage
              </label>
              <Input
                name="display_name"
                value={formData.display_name}
                onChange={handleChange}
                placeholder="Ex: Amadou TRAORE"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Genre
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Sélectionner</option>
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date de naissance
                </label>
                <Input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lieu de naissance
              </label>
              <Input
                name="place_of_birth"
                value={formData.place_of_birth}
                onChange={handleChange}
                placeholder="Ex: Ouagadougou"
              />
            </div>

            {/* Informations parent/tuteur */}
            <div className="pt-4 border-t">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Informations Parent/Tuteur</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du parent/tuteur
                  </label>
                  <Input
                    name="parent_name"
                    value={formData.parent_name}
                    onChange={handleChange}
                    placeholder="Nom complet du parent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Téléphone
                    </label>
                    <Input
                      name="parent_phone"
                      value={formData.parent_phone}
                      onChange={handleChange}
                      placeholder="+226 XX XX XX XX"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <Input
                      type="email"
                      name="parent_email"
                      value={formData.parent_email}
                      onChange={handleChange}
                      placeholder="email@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adresse
                  </label>
                  <Input
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Adresse complète"
                  />
                </div>
              </div>
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
              {student ? 'Modifier' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
