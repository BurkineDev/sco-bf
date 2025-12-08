'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { CheckCircle, XCircle, Loader2, Database, Users, School } from 'lucide-react'

export default function TestDatabasePage() {
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [dbInfo, setDbInfo] = useState<any>(null)
  const [tables, setTables] = useState<string[]>([])

  const testConnection = async () => {
    setConnectionStatus('testing')
    setErrorMessage('')
    setDbInfo(null)
    setTables([])

    try {
      // Test 1: Vérifier la connexion de base
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1)

      if (error) {
        throw new Error(error.message)
      }

      // Test 2: Récupérer les informations de la base
      setConnectionStatus('success')
      setDbInfo({
        connected: true,
        timestamp: new Date().toISOString(),
      })

      // Test 3: Lister quelques tables disponibles
      const tablesList = ['users', 'schools', 'students', 'payments', 'classes']
      const tableChecks = await Promise.all(
        tablesList.map(async (table) => {
          try {
            const { error } = await supabase.from(table).select('count').limit(1)
            return error ? null : table
          } catch {
            return null
          }
        })
      )

      setTables(tableChecks.filter(Boolean) as string[])

    } catch (err: any) {
      setConnectionStatus('error')
      setErrorMessage(err.message || 'Erreur de connexion à la base de données')
    }
  }

  const testInsert = async () => {
    try {
      // Test d'insertion dans une table de test
      const { data, error } = await supabase
        .from('schools')
        .insert({
          name: 'École Test',
          code: 'TEST-' + Date.now(),
          phone: '+22670000000',
          email: 'test@example.com',
          address: 'Test Address',
          city: 'Ouagadougou'
        })
        .select()

      if (error) throw error

      alert('✅ Insertion réussie ! Données insérées dans la table schools.')
      return data
    } catch (err: any) {
      alert('❌ Erreur d\'insertion: ' + err.message)
    }
  }

  const testQuery = async () => {
    try {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .limit(5)

      if (error) throw error

      alert(`✅ Requête réussie ! ${data?.length || 0} écoles trouvées.`)
      console.log('Données récupérées:', data)
    } catch (err: any) {
      alert('❌ Erreur de requête: ' + err.message)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Test de Connexion Base de Données</h1>
        <p className="text-gray-600 mt-1">Vérifiez la connexion à votre base de données Supabase</p>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-6 w-6" />
            <span>État de la Connexion</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {connectionStatus === 'idle' && (
              <div className="text-center py-8">
                <Database className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">Cliquez sur le bouton pour tester la connexion</p>
                <Button onClick={testConnection}>
                  Tester la Connexion
                </Button>
              </div>
            )}

            {connectionStatus === 'testing' && (
              <div className="text-center py-8">
                <Loader2 className="h-16 w-16 mx-auto text-indigo-600 animate-spin mb-4" />
                <p className="text-gray-600">Test de connexion en cours...</p>
              </div>
            )}

            {connectionStatus === 'success' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-green-600 bg-green-50 p-4 rounded-lg">
                  <CheckCircle className="h-8 w-8" />
                  <div>
                    <p className="font-semibold">Connexion réussie !</p>
                    <p className="text-sm text-green-700">
                      Connecté à {dbInfo?.timestamp ? new Date(dbInfo.timestamp).toLocaleString('fr-FR') : ''}
                    </p>
                  </div>
                </div>

                {tables.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Tables détectées:</h3>
                    <ul className="space-y-1">
                      {tables.map((table) => (
                        <li key={table} className="text-sm text-gray-700 flex items-center">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          {table}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button onClick={testConnection} variant="outline">
                    Retester
                  </Button>
                  <Button onClick={testInsert} variant="secondary">
                    Test Insertion
                  </Button>
                  <Button onClick={testQuery}>
                    Test Requête
                  </Button>
                </div>
              </div>
            )}

            {connectionStatus === 'error' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-red-600 bg-red-50 p-4 rounded-lg">
                  <XCircle className="h-8 w-8" />
                  <div className="flex-1">
                    <p className="font-semibold">Échec de la connexion</p>
                    <p className="text-sm text-red-700 mt-1">{errorMessage}</p>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <h3 className="font-semibold text-yellow-900 mb-2">Vérifications à faire:</h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
                    <li>Vérifiez que le fichier .env.local existe</li>
                    <li>Vérifiez que NEXT_PUBLIC_SUPABASE_URL est défini</li>
                    <li>Vérifiez que NEXT_PUBLIC_SUPABASE_ANON_KEY est défini</li>
                    <li>Vérifiez que les credentials sont corrects</li>
                    <li>Vérifiez que les tables existent dans Supabase</li>
                  </ul>
                </div>

                <Button onClick={testConnection} variant="outline">
                  Réessayer
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Configuration Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Guide de Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">1. Créer le fichier .env.local</h3>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-xs overflow-x-auto">
                <pre>{`# Dans dashboard-school/
cp .env.example .env.local`}</pre>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">2. Configurer vos credentials Supabase</h3>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-xs overflow-x-auto">
                <pre>{`NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-clé-anon
NEXT_PUBLIC_APP_URL=http://localhost:3000`}</pre>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">3. Redémarrer le serveur</h3>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-xs overflow-x-auto">
                <pre>{`npm run dev`}</pre>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">4. Créer les tables dans Supabase</h3>
              <p className="text-gray-600 mb-2">
                Exécutez le fichier <code className="bg-gray-100 px-2 py-1 rounded">database/schema.sql</code> dans votre éditeur SQL Supabase
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
