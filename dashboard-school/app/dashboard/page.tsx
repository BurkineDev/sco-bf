import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Users, GraduationCap, BookOpen, TrendingUp } from 'lucide-react'

export default function DashboardPage() {
  const stats = [
    {
      title: 'Élèves',
      value: '1,234',
      change: '+12%',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Enseignants',
      value: '87',
      change: '+5%',
      icon: GraduationCap,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Classes',
      value: '42',
      change: '+2%',
      icon: BookOpen,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Taux de Réussite',
      value: '92%',
      change: '+8%',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-600 mt-1">Bienvenue sur votre tableau de bord</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                    <p className="text-sm text-green-600 mt-1">{stat.change} ce mois</p>
                  </div>
                  <div className={`h-12 w-12 rounded-full ${stat.bgColor} flex items-center justify-center`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent Activities and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Activités Récentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: 'Nouvel élève inscrit', name: 'Jean Ouédraogo', time: 'Il y a 2h' },
                { action: 'Note ajoutée', name: 'Mathématiques - Classe 3ème', time: 'Il y a 3h' },
                { action: 'Paiement reçu', name: 'Marie Kaboré - 50,000 FCFA', time: 'Il y a 5h' },
                { action: 'Présence enregistrée', name: 'Classe 2nde A', time: 'Il y a 6h' }
              ].map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 pb-3 border-b last:border-0">
                  <div className="h-2 w-2 rounded-full bg-indigo-600 mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-sm text-gray-600">{activity.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions Rapides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <QuickActionButton title="Nouvel Élève" icon={<Users className="h-6 w-6" />} />
              <QuickActionButton title="Nouvelle Classe" icon={<BookOpen className="h-6 w-6" />} />
              <QuickActionButton title="Prendre Présence" icon={<Users className="h-6 w-6" />} />
              <QuickActionButton title="Ajouter Note" icon={<GraduationCap className="h-6 w-6" />} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle>Événements à venir</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { title: 'Réunion des enseignants', date: '15 Déc 2024', time: '14:00' },
              { title: 'Examen de Mathématiques', date: '18 Déc 2024', time: '08:00' },
              { title: 'Conseil de classe', date: '20 Déc 2024', time: '15:00' },
              { title: 'Remise des bulletins', date: '22 Déc 2024', time: '10:00' }
            ].map((event, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{event.title}</p>
                  <p className="text-sm text-gray-600">{event.date} à {event.time}</p>
                </div>
                <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                  Détails
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function QuickActionButton({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <button className="flex flex-col items-center justify-center p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
      <div className="text-indigo-600 mb-2">{icon}</div>
      <span className="text-sm font-medium text-gray-900">{title}</span>
    </button>
  )
}
