'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Search, Filter, Download, FileText, TrendingUp,
  DollarSign, CreditCard, Calendar, Eye
} from 'lucide-react'
import { usePaymentsStore, useAuthStore } from '@/lib/store'
import { formatCurrency, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function PaymentsPage() {
  const { school } = useAuthStore()
  const {
    payments,
    stats,
    isLoading,
    error,
    filters,
    fetchPayments,
    setFilters,
    exportPayments
  } = usePaymentsStore()

  const [search, setSearch] = useState('')
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (school) {
      fetchPayments()
    }
  }, [school, fetchPayments])

  const handleExport = async (format: 'excel' | 'pdf') => {
    setExporting(true)
    const result = await exportPayments(format)

    if (result.success && result.url) {
      window.open(result.url, '_blank')
      toast.success(`Export ${format.toUpperCase()} réussi`)
    } else {
      toast.error(result.error || 'Erreur lors de l\'export')
    }

    setExporting(false)
  }

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = search === '' ||
      payment.reference.toLowerCase().includes(search.toLowerCase()) ||
      payment.student?.display_name?.toLowerCase().includes(search.toLowerCase()) ||
      payment.student?.matricule.toLowerCase().includes(search.toLowerCase())

    return matchesSearch
  })

  const getChannelLabel = (channel: string) => {
    const labels: Record<string, string> = {
      app_mobile: 'App Mobile',
      ussd: 'USSD',
      agent_cash: 'Agent (Cash)',
      agent_momo: 'Agent (Mobile Money)',
      bank_transfer: 'Virement bancaire',
      other: 'Autre',
    }
    return labels[channel] || channel
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      completed: 'success',
      pending: 'warning',
      processing: 'info',
      failed: 'danger',
      cancelled: 'default',
      refunded: 'danger',
    }
    return colors[status] || 'default'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      completed: 'Complété',
      pending: 'En attente',
      processing: 'En cours',
      failed: 'Échoué',
      cancelled: 'Annulé',
      refunded: 'Remboursé',
    }
    return labels[status] || status
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Paiements</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">{error}</p>
            <Button onClick={() => fetchPayments()} className="mt-4">
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
          <h1 className="text-3xl font-bold text-gray-900">Paiements</h1>
          <p className="text-gray-600 mt-1">Historique et détails des transactions</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => handleExport('excel')}
            disabled={exporting || payments.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport('pdf')}
            disabled={exporting || payments.length === 0}
          >
            <FileText className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatsCard
            title="Total collecté"
            value={formatCurrency(stats.totalAmount)}
            icon={DollarSign}
            color="bg-green-100 text-green-600"
          />
          <StatsCard
            title="Commission plateforme"
            value={formatCurrency(stats.totalCommission)}
            icon={TrendingUp}
            color="bg-orange-100 text-orange-600"
          />
          <StatsCard
            title="Montant net"
            value={formatCurrency(stats.totalNet)}
            icon={CreditCard}
            color="bg-blue-100 text-blue-600"
          />
          <StatsCard
            title="Nombre de transactions"
            value={stats.count.toString()}
            icon={Calendar}
            color="bg-purple-100 text-purple-600"
          />
        </div>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par référence, élève ou matricule..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <Button variant="outline">
              <Filter className="h-5 w-5 mr-2" />
              Filtrer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
              <p className="mt-4 text-gray-600">Chargement des paiements...</p>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="p-12 text-center">
              <CreditCard className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">Aucun paiement trouvé</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Référence
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Élève
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Montant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Commission
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Net
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Canal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono text-gray-900">
                          {payment.reference}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {payment.student?.display_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {payment.student?.matricule} - {payment.student?.class?.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {formatCurrency(payment.amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-orange-600">
                          {formatCurrency(payment.commission_amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-green-600">
                          {formatCurrency(payment.net_amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {getChannelLabel(payment.channel)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={getStatusColor(payment.status) as any}>
                          {getStatusLabel(payment.status)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">
                          {formatDate(payment.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          className="text-indigo-600 hover:text-indigo-900"
                          onClick={() => {
                            window.open(`/api/receipts/${payment.id}`, '_blank')
                          }}
                          title="Télécharger le reçu"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
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
