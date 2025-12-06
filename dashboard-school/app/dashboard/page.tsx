'use client'

import { useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Users, GraduationCap, BookOpen, DollarSign, TrendingUp, TrendingDown } from 'lucide-react'
import { useDashboardStore, useAuthStore, usePaymentsStore } from '@/lib/store'
import { formatCurrency, formatPercent } from '@/lib/utils'
import Link from 'next/link'

export default function DashboardPage() {
  const { user, school } = useAuthStore()
  const {
    stats,
    classes,
    recentPayments,
    isLoading,
    fetchStats,
    fetchClasses,
    fetchRecentPayments
  } = useDashboardStore()
  const { fetchPayments } = usePaymentsStore()

  useEffect(() => {
    if (school) {
      fetchStats(school.id)
      fetchClasses(school.id)
      fetchRecentPayments(school.id, 5)
    }
  }, [school, fetchStats, fetchClasses, fetchRecentPayments])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
      </div>
    )
  }

  const statsCards = [
    {
      title: 'Total Élèves',
      value: stats?.total_students || 0,
      subtitle: `${stats?.active_students || 0} actifs`,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      link: '/dashboard/students'
    },
    {
      title: 'Classes',
      value: classes.length,
      subtitle: 'Année en cours',
      icon: BookOpen,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      link: '/dashboard/classes'
    },
    {
      title: 'Montant Collecté',
      value: formatCurrency(stats?.total_collected || 0),
      subtitle: `${formatPercent(stats?.collection_rate || 0)} du total`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      link: '/dashboard/payments'
    },
    {
      title: 'Taux de Paiement',
      value: formatPercent(stats?.collection_rate || 0),
      subtitle: `${stats?.fully_paid_count || 0} élèves soldés`,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      link: '/dashboard/payments'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-600 mt-1">
          Bienvenue {user?.first_name} - {school?.name || 'École'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Link key={stat.title} href={stat.link}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                      <p className="text-sm text-gray-500 mt-1">{stat.subtitle}</p>
                    </div>
                    <div className={`h-12 w-12 rounded-full ${stat.bgColor} flex items-center justify-center`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Détails Paiements */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Attendu</p>
                  <p className="text-xl font-bold text-gray-900 mt-2">
                    {formatCurrency(stats.total_expected)}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Reste à Collecter</p>
                  <p className="text-xl font-bold text-orange-600 mt-2">
                    {formatCurrency(stats.total_balance)}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <TrendingDown className="h-5 w-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-3">Statut de Paiement</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Soldés</span>
                    <span className="font-medium text-green-600">{stats.fully_paid_count}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Partiels</span>
                    <span className="font-medium text-orange-600">{stats.partially_paid_count}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Non payés</span>
                    <span className="font-medium text-red-600">{stats.not_paid_count}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Paiements Récents</CardTitle>
              <Link href="/dashboard/payments" className="text-sm text-indigo-600 hover:text-indigo-700">
                Voir tout
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentPayments.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Aucun paiement récent</p>
            ) : (
              <div className="space-y-4">
                {recentPayments.map((payment) => (
                  <div key={payment.id} className="flex items-start justify-between pb-3 border-b last:border-0">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {payment.student?.first_name} {payment.student?.last_name}
                      </p>
                      <p className="text-sm text-gray-600">{payment.student?.matricule}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(payment.created_at).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-600">
                        {formatCurrency(payment.amount)}
                      </p>
                      <p className="text-xs text-gray-500">{payment.channel}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions Rapides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Link href="/dashboard/students">
                <QuickActionButton title="Élèves" icon={<Users className="h-6 w-6" />} />
              </Link>
              <Link href="/dashboard/classes">
                <QuickActionButton title="Classes" icon={<BookOpen className="h-6 w-6" />} />
              </Link>
              <Link href="/dashboard/payments">
                <QuickActionButton title="Paiements" icon={<DollarSign className="h-6 w-6" />} />
              </Link>
              <Link href="/dashboard/import">
                <QuickActionButton title="Importer" icon={<Users className="h-6 w-6" />} />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Classes Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Classes - Année en cours</CardTitle>
            <Link href="/dashboard/classes" className="text-sm text-indigo-600 hover:text-indigo-700">
              Gérer les classes
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {classes.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Aucune classe pour l'année en cours</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.slice(0, 6).map((classItem: any) => (
                <div key={classItem.id} className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900">{classItem.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Scolarité: {formatCurrency(classItem.tuition_amount)}
                  </p>
                  {classItem.students && (
                    <p className="text-xs text-gray-500 mt-2">
                      {classItem.students.length} élève(s)
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function QuickActionButton({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <button className="flex flex-col items-center justify-center p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors w-full">
      <div className="text-indigo-600 mb-2">{icon}</div>
      <span className="text-sm font-medium text-gray-900">{title}</span>
    </button>
  )
}
