'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore, useAgentsStore } from '@/lib/store'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface AgentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  agent?: any // Pour l'édition
  onSuccess?: () => void
}

export function AgentModal({ open, onOpenChange, agent, onSuccess }: AgentModalProps) {
  const { school } = useAuthStore()
  const { addAgent, updateAgent } = useAgentsStore()

  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    agent_code: '',
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    commission_rate: '2.5',
    daily_limit: '500000',
    is_active: true,
  })

  useEffect(() => {
    if (agent) {
      setFormData({
        agent_code: agent.agent_code || '',
        first_name: agent.first_name || '',
        last_name: agent.last_name || '',
        phone: agent.phone || '',
        email: agent.email || '',
        commission_rate: agent.commission_rate?.toString() || '2.5',
        daily_limit: agent.daily_limit?.toString() || '500000',
        is_active: agent.is_active ?? true,
      })
    } else {
      setFormData({
        agent_code: '',
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        commission_rate: '2.5',
        daily_limit: '500000',
        is_active: true,
      })
    }
  }, [agent, open])

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

    if (!formData.agent_code || !formData.first_name || !formData.last_name || !formData.phone) {
      toast.error('Veuillez remplir tous les champs requis')
      return
    }

    setIsLoading(true)

    try {
      const agentData = {
        ...formData,
        school_id: school.id,
        commission_rate: parseFloat(formData.commission_rate),
        daily_limit: parseFloat(formData.daily_limit),
      }

      if (agent) {
        await updateAgent(agent.id, agentData)
        toast.success('Agent modifié avec succès')
      } else {
        await addAgent(agentData)
        toast.success('Agent ajouté avec succès')
      }

      onSuccess?.()
      onOpenChange(false)
    } catch (error: any) {
      console.error('Error saving agent:', error)
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
            {agent ? 'Modifier l\'agent' : 'Ajouter un agent'}
          </DialogTitle>
          <DialogDescription>
            {agent ? 'Modifiez les informations de l\'agent' : 'Remplissez les informations de l\'agent'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Code Agent <span className="text-red-500">*</span>
              </label>
              <Input
                name="agent_code"
                value={formData.agent_code}
                onChange={handleChange}
                placeholder="Ex: AGT-001"
                required
                disabled={!!agent}
              />
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone <span className="text-red-500">*</span>
                </label>
                <Input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+226 XX XX XX XX"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Taux de commission (%)
                </label>
                <Input
                  type="number"
                  name="commission_rate"
                  value={formData.commission_rate}
                  onChange={handleChange}
                  placeholder="2.5"
                  step="0.1"
                  min="0"
                  max="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Limite journalière (FCFA)
                </label>
                <Input
                  type="number"
                  name="daily_limit"
                  value={formData.daily_limit}
                  onChange={handleChange}
                  placeholder="500000"
                  step="1000"
                  min="0"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                Agent actif
              </label>
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
              {agent ? 'Modifier' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
