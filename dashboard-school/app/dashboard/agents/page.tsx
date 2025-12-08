'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Plus, Search, Edit, Trash2, Shield, DollarSign,
  TrendingUp, Users
} from 'lucide-react'
import { useAgentsStore, useAuthStore } from '@/lib/store'
import toast from 'react-hot-toast'
import { AddAgentModal } from '@/components/agents/AddAgentModal'

export default function AgentsPage() {
  const { school } = useAuthStore()
  const { agents, isLoading, error, fetchAgents, updateAgent, deleteAgent } = useAgentsStore()

  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    if (school) {
      fetchAgents()
    }
  }, [school, fetchAgents])

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const result = await updateAgent(id, { is_active: !currentStatus })

    if (result.success) {
      toast.success(currentStatus ? 'Agent désactivé' : 'Agent activé')
    } else {
      toast.error(result.error || 'Erreur lors de la mise à jour')
    }
  }

  const filteredAgents = agents.filter(agent =>
    search === '' ||
    agent.first_name.toLowerCase().includes(search.toLowerCase()) ||
    agent.last_name.toLowerCase().includes(search.toLowerCase()) ||
    agent.agent_code.toLowerCase().includes(search.toLowerCase()) ||
    agent.phone.includes(search)
  )

  const activeAgents = agents.filter(a => a.is_active).length
  const totalDailyLimit = agents.reduce((sum, a) => sum + a.daily_limit, 0)

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Agents</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">{error}</p>
            <Button onClick={() => fetchAgents()} className="mt-4">
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
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Agents</h1>
          <p className="text-gray-600 mt-1">Gérez les agents et caissiers</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="h-5 w-5 mr-2" />
          Nouvel Agent
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Total agents"
          value={agents.length.toString()}
          icon={Users}
          color="bg-blue-100 text-blue-600"
        />
        <StatsCard
          title="Agents actifs"
          value={activeAgents.toString()}
          icon={Shield}
          color="bg-green-100 text-green-600"
        />
        <StatsCard
          title="Limite quotidienne totale"
          value={`${(totalDailyLimit / 1000000).toFixed(1)}M FCFA`}
          icon={DollarSign}
          color="bg-purple-100 text-purple-600"
        />
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, code agent ou téléphone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agents Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-600">Chargement des agents...</p>
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="p-12 text-center">
              <Shield className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">Aucun agent trouvé</p>
              <Button onClick={() => setShowAddModal(true)} className="mt-4">
                Ajouter le premier agent
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Agent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code agent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Téléphone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Limite quotidienne
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Limite par transaction
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
                  {filteredAgents.map((agent) => (
                    <tr key={agent.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-indigo-600 font-medium text-sm">
                              {agent.first_name.charAt(0)}{agent.last_name.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {agent.first_name} {agent.last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              Créé le {new Date(agent.created_at).toLocaleDateString('fr-FR')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono text-gray-900">
                          {agent.agent_code}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{agent.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {(agent.daily_limit / 1000).toLocaleString('fr-FR')} k FCFA
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {(agent.transaction_limit / 1000).toLocaleString('fr-FR')} k FCFA
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={agent.is_active ? 'success' : 'danger'}>
                          {agent.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleToggleStatus(agent.id, agent.is_active)}
                            className={`${
                              agent.is_active ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'
                            }`}
                            title={agent.is_active ? 'Désactiver' : 'Activer'}
                          >
                            <Shield className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => toast('Édition en cours de développement')}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <Edit className="h-5 w-5" />
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

      {/* Modal Ajout */}
      <AddAgentModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
    </div>
  )
}

function StatsCard({
  title,
  value,
  icon: Icon,
  color
}: {
  title: string
  value: string
  icon: any
  color: string
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          </div>
          <div className={`h-12 w-12 rounded-full ${color} flex items-center justify-center`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
