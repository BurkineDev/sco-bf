'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { GraduationCap, Mail, Lock, Loader2 } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import toast from 'react-hot-toast'

export default function LoginDevPage() {
  const router = useRouter()
  const { setAuth, isAuthenticated } = useAuthStore()
  const supabase = createClientComponentClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      toast.error('Veuillez remplir tous les champs')
      return
    }

    setIsLoading(true)

    try {
      // Tentative de connexion avec Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        // Si échec auth, essayer avec bypass développement
        if (email === 'admin@test.bf' && password === 'admin123') {
          // Récupérer le user depuis la base de données directement
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('phone', '+22670123456')
            .single()

          if (userError || !userData) {
            toast.error('Utilisateur de test non trouvé. Exécutez d\'abord le script test-data.sql')
            setIsLoading(false)
            return
          }

          // Récupérer l'école associée
          const { data: schoolData, error: schoolError } = await supabase
            .from('schools')
            .select('*')
            .eq('admin_user_id', userData.id)
            .single()

          if (schoolError || !schoolData) {
            toast.error('École non trouvée pour cet utilisateur')
            setIsLoading(false)
            return
          }

          // Définir l'authentification
          setAuth(userData, schoolData)
          toast.success('Connexion réussie!')
          router.push('/dashboard')
        } else {
          toast.error('Email ou mot de passe incorrect')
        }
      } else {
        // Connexion réussie avec Supabase Auth
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .single()

        if (userError || !userData) {
          toast.error('Utilisateur non trouvé')
          setIsLoading(false)
          return
        }

        // Récupérer l'école
        const { data: schoolData } = await supabase
          .from('schools')
          .select('*')
          .eq('admin_user_id', userData.id)
          .single()

        setAuth(userData, schoolData)
        toast.success('Connexion réussie!')
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Erreur lors de la connexion')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4">
            <GraduationCap className="h-10 w-10 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Dashboard École
          </h1>
          <p className="text-blue-100">
            Connexion - Mode Développement
          </p>
        </div>

        {/* Carte de connexion */}
        <Card className="shadow-2xl">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@test.bf"
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Connexion en cours...
                  </>
                ) : (
                  'Se connecter'
                )}
              </Button>

              {/* Informations de test */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-semibold text-blue-900 mb-2">
                  Identifiants de test:
                </p>
                <div className="space-y-1 text-sm text-blue-700">
                  <p>Email: <code className="bg-blue-100 px-2 py-0.5 rounded">admin@test.bf</code></p>
                  <p>Mot de passe: <code className="bg-blue-100 px-2 py-0.5 rounded">admin123</code></p>
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  Note: Exécutez d'abord le script <code>test-data.sql</code> dans Supabase
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Lien vers login OTP */}
        <div className="text-center mt-6">
          <a
            href="/login"
            className="text-white hover:text-blue-100 text-sm underline"
          >
            Utiliser l'authentification OTP →
          </a>
        </div>
      </div>
    </div>
  )
}
