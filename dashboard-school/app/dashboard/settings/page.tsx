'use client'

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Save, Building, Calendar, DollarSign, Bell } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-gray-600 mt-1">Configurez votre établissement</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* School Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Building className="h-5 w-5 text-indigo-600" />
              <CardTitle>Informations de l'établissement</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input label="Nom de l'établissement" defaultValue="Lycée Moderne de Ouagadougou" />
              <Input label="Adresse" defaultValue="Avenue de l'Indépendance, Ouagadougou" />
              <Input label="Téléphone" defaultValue="+226 25 30 00 00" />
              <Input label="Email" defaultValue="contact@lycee-ouaga.bf" />
              <Button className="w-full flex items-center justify-center space-x-2">
                <Save className="h-5 w-5" />
                <span>Enregistrer</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Academic Year */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-indigo-600" />
              <CardTitle>Année Scolaire</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input label="Année en cours" defaultValue="2024-2025" />
              <Input label="Date de début" type="date" defaultValue="2024-09-01" />
              <Input label="Date de fin" type="date" defaultValue="2025-06-30" />
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Trimestres</label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Input placeholder="Trimestre 1" defaultValue="Sept - Déc" />
                    <Input placeholder="Début" type="date" />
                    <Input placeholder="Fin" type="date" />
                  </div>
                </div>
              </div>
              <Button className="w-full flex items-center justify-center space-x-2">
                <Save className="h-5 w-5" />
                <span>Enregistrer</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Financial Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-indigo-600" />
              <CardTitle>Paramètres Financiers</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input label="Frais de scolarité annuels (FCFA)" defaultValue="150000" type="number" />
              <Input label="Frais d'inscription (FCFA)" defaultValue="25000" type="number" />
              <Input label="Devise" defaultValue="FCFA" disabled />
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" defaultChecked />
                  <span className="text-sm text-gray-700">Activer le paiement par tranche</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm text-gray-700">Pénalités de retard</span>
                </label>
              </div>
              <Button className="w-full flex items-center justify-center space-x-2">
                <Save className="h-5 w-5" />
                <span>Enregistrer</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-indigo-600" />
              <CardTitle>Notifications</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Notifications par email</span>
                  <input type="checkbox" className="rounded" defaultChecked />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Notifications SMS</span>
                  <input type="checkbox" className="rounded" />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Rappels de paiement</span>
                  <input type="checkbox" className="rounded" defaultChecked />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Alertes d'absence</span>
                  <input type="checkbox" className="rounded" defaultChecked />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Bulletins disponibles</span>
                  <input type="checkbox" className="rounded" defaultChecked />
                </label>
              </div>
              <Button className="w-full flex items-center justify-center space-x-2">
                <Save className="h-5 w-5" />
                <span>Enregistrer</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
