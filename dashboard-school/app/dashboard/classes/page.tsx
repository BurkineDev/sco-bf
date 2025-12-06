'use client'

import { useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Users, DollarSign, Loader2 } from 'lucide-react'
import { useDashboardStore } from '@/lib/store'
import { useAuthStore } from '@/lib/store'

export default function ClassesPage() {
  const { school } = useAuthStore()
  const { classes, fetchClasses } = useDashboardStore()

  useEffect(() => {
    if (school) {
      fetchClasses(school.id)
    }
  }, [school, fetchClasses])

  const totalStudents = classes.reduce((acc, c: any) => acc + (c.students?.[0]?.count || 0), 0)

  // Grouper par niveau (utiliser la première partie du nom de classe)
  const collegeClasses = classes.filter((c: any) =>
    c.level?.includes('6ème') || c.level?.includes('5ème') ||
    c.level?.includes('4ème') || c.level?.includes('3ème') ||
    c.name?.includes('6ème') || c.name?.includes('5ème') ||
    c.name?.includes('4ème') || c.name?.includes('3ème')
  )

  const lyceeClasses = classes.filter((c: any) =>
    c.level?.includes('2nde') || c.level?.includes('1ère') || c.level?.includes('Terminale') ||
    c.name?.includes('2nde') || c.name?.includes('1ère') || c.name?.includes('Terminale')
  )

  if (!school) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Classes</h1>
          <p className="text-gray-600 mt-1">Gérez vos classes et leurs effectifs</p>
        </div>
        <Button className="flex items-center space-x-2">
          <Plus className="h-5 w-5" />
          <span>Nouvelle Classe</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Total Classes</p>
            <p className="text-2xl font-bold text-blue-600 mt-2">{classes.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Total Élèves</p>
            <p className="text-2xl font-bold text-green-600 mt-2">
              {totalStudents}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Collège</p>
            <p className="text-2xl font-bold text-purple-600 mt-2">
              {collegeClasses.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Lycée</p>
            <p className="text-2xl font-bold text-orange-600 mt-2">
              {lyceeClasses.length}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((classItem: any) => (
          <Card key={classItem.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{classItem.name}</CardTitle>
                <Badge variant="info">{classItem.level || classItem.section}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-gray-600">
                    <Users className="h-5 w-5 mr-2" />
                    <span className="text-sm">Élèves</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {classItem.students?.[0]?.count || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-gray-600">
                    <DollarSign className="h-5 w-5 mr-2" />
                    <span className="text-sm">Scolarité</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {classItem.tuition_amount?.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
                {classItem.allow_installments && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Paiement fractionné</span>
                    <Badge variant="success">
                      Min: {classItem.min_installment_amount?.toLocaleString('fr-FR')} FCFA
                    </Badge>
                  </div>
                )}
              </div>
              <div className="mt-4 flex space-x-2">
                <Button size="sm" variant="outline" className="flex-1">
                  Voir Détails
                </Button>
                <Button size="sm" className="flex-1">
                  Modifier
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {classes.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Aucune classe trouvée pour l'année en cours</p>
          <Button className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Créer une classe
          </Button>
        </div>
      )}
    </div>
  )
}
