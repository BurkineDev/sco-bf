'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Mail, Phone } from 'lucide-react'

const mockTeachers = [
  { id: '1', name: 'Dr. Amadou Touré', subject: 'Mathématiques', email: 'amadou@school.bf', phone: '+226 70 00 00 01', status: 'active' },
  { id: '2', name: 'Mme. Fatou Diallo', subject: 'Français', email: 'fatou@school.bf', phone: '+226 70 00 00 02', status: 'active' },
  { id: '3', name: 'M. Pierre Compaoré', subject: 'Physique-Chimie', email: 'pierre@school.bf', phone: '+226 70 00 00 03', status: 'active' },
  { id: '4', name: 'Mme. Aïcha Zoungrana', subject: 'Anglais', email: 'aicha@school.bf', phone: '+226 70 00 00 04', status: 'active' }
]

export default function TeachersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Enseignants</h1>
          <p className="text-gray-600 mt-1">Gérez votre corps enseignant</p>
        </div>
        <Button className="flex items-center space-x-2">
          <Plus className="h-5 w-5" />
          <span>Nouvel Enseignant</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Total Enseignants</p>
            <p className="text-2xl font-bold text-blue-600 mt-2">{mockTeachers.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Actifs</p>
            <p className="text-2xl font-bold text-green-600 mt-2">{mockTeachers.filter(t => t.status === 'active').length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-600">Matières enseignées</p>
            <p className="text-2xl font-bold text-purple-600 mt-2">12</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un enseignant..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockTeachers.map((teacher) => (
          <Card key={teacher.id}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-2xl text-indigo-600 font-semibold">
                    {teacher.name.split(' ')[1][0]}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{teacher.name}</h3>
                  <p className="text-sm text-gray-600">{teacher.subject}</p>
                  <Badge variant="success" className="mt-1">
                    {teacher.status === 'active' ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-2" />
                  {teacher.email}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Phone className="h-4 w-4 mr-2" />
                  {teacher.phone}
                </div>
              </div>
              <div className="mt-4 flex space-x-2">
                <Button size="sm" variant="outline" className="flex-1">
                  Voir Profil
                </Button>
                <Button size="sm" className="flex-1">
                  Contacter
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
