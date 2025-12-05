import Link from 'next/link'
import { BookOpen, Users, BarChart3, Calendar } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-gray-900">Scolarité BF</h1>
            </div>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Accéder au Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Système de Gestion Scolaire
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Une plateforme moderne pour gérer efficacement les établissements scolaires au Burkina Faso
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <FeatureCard
            icon={<Users className="h-8 w-8 text-indigo-600" />}
            title="Gestion des Élèves"
            description="Gérez les inscriptions, les informations et le suivi des élèves"
          />
          <FeatureCard
            icon={<BookOpen className="h-8 w-8 text-indigo-600" />}
            title="Suivi Académique"
            description="Notes, bulletins et rapports de performance"
          />
          <FeatureCard
            icon={<BarChart3 className="h-8 w-8 text-indigo-600" />}
            title="Statistiques"
            description="Tableaux de bord et analyses en temps réel"
          />
          <FeatureCard
            icon={<Calendar className="h-8 w-8 text-indigo-600" />}
            title="Présences"
            description="Suivi des présences et absences quotidiennes"
          />
        </div>

        {/* CTA Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Prêt à commencer ?
          </h3>
          <p className="text-gray-600 mb-6">
            Accédez au tableau de bord pour gérer votre établissement
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-lg font-semibold"
          >
            Ouvrir le Dashboard
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 py-8 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-600">
          <p>&copy; 2024 Scolarité BF. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}
