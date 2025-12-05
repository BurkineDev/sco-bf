'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Users, BookOpen } from 'lucide-react'

const mockClasses = [
  { id: '1', name: '3ème A', level: 'Collège', students: 35, teacher: 'M. Touré', room: 'A101' },
  { id: '2', name: '2nde B', level: 'Lycée', students: 32, teacher: 'Mme. Diallo', room: 'B203' },
  { id: '3', name: '1ère C', level: 'Lycée', students: 28, teacher: 'M. Compaoré', room: 'B304' },
  { id: '4', name: 'Terminale A', level: 'Lycée', students: 30, teacher: 'Mme. Zoungrana', room: 'C105' },
  { id: '5', name: '6ème A', level: 'Collège', students: 38, teacher: 'M. Sawadogo', room: 'A201' },
  { id: '6', name: '5ème B', level: 'Collège', students: 36, teacher: 'Mme. Kaboré', room: 'A202' }
]

export default function ClassesPage() {
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
            <p className="text-2xl font-bold text-blue-600 mt-2">{mockClasses.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Total Élèves</p>
            <p className="text-2xl font-bold text-green-600 mt-2">
              {mockClasses.reduce((acc, c) => acc + c.students, 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Collège</p>
            <p className="text-2xl font-bold text-purple-600 mt-2">
              {mockClasses.filter(c => c.level === 'Collège').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Lycée</p>
            <p className="text-2xl font-bold text-orange-600 mt-2">
              {mockClasses.filter(c => c.level === 'Lycée').length}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockClasses.map((classItem) => (
          <Card key={classItem.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{classItem.name}</CardTitle>
                <Badge variant="info">{classItem.level}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-gray-600">
                    <Users className="h-5 w-5 mr-2" />
                    <span className="text-sm">Élèves</span>
                  </div>
                  <span className="font-semibold text-gray-900">{classItem.students}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-gray-600">
                    <BookOpen className="h-5 w-5 mr-2" />
                    <span className="text-sm">Professeur principal</span>
                  </div>
                  <span className="text-sm text-gray-900">{classItem.teacher}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Salle</span>
                  <Badge variant="default">{classItem.room}</Badge>
                </div>
              </div>
              <div className="mt-4 flex space-x-2">
                <Button size="sm" variant="outline" className="flex-1">
                  Voir Détails
                </Button>
                <Button size="sm" className="flex-1">
                  Emploi du temps
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
