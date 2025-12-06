'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { GraduationCap, Phone, Lock, ArrowRight, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const { requestOtp, verifyOtp, isAuthenticated, isLoading } = useAuthStore()

  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpId, setOtpId] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, router])

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // Handle phone submission
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!phone || phone.length < 8) {
      toast.error('Veuillez entrer un numéro de téléphone valide')
      return
    }

    setSubmitting(true)

    const result = await requestOtp(phone)

    if (result.success) {
      setOtpId(result.otpId || null)
      setStep('otp')
      setCountdown(300) // 5 minutes
      toast.success('Code OTP envoyé par SMS')
    } else {
      toast.error(result.error || 'Erreur lors de l\'envoi du code')
    }

    setSubmitting(false)
  }

  // Handle OTP verification
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!otp || otp.length !== 6) {
      toast.error('Veuillez entrer le code à 6 chiffres')
      return
    }

    setSubmitting(true)

    const result = await verifyOtp(phone, otp)

    if (result.success) {
      toast.success('Connexion réussie !')
      router.push('/dashboard')
    } else {
      toast.error(result.error || 'Code invalide')
      setOtp('')
    }

    setSubmitting(false)
  }

  // Resend OTP
  const handleResendOtp = async () => {
    setSubmitting(true)
    const result = await requestOtp(phone)

    if (result.success) {
      setOtpId(result.otpId || null)
      setCountdown(300)
      toast.success('Nouveau code OTP envoyé')
    } else {
      toast.error(result.error || 'Erreur lors de l\'envoi')
    }

    setSubmitting(false)
  }

  // Format countdown
  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard École
          </h1>
          <p className="text-gray-600">
            Système de gestion de scolarité - Burkina Faso
          </p>
        </div>

        <Card className="shadow-xl border-0">
          <CardContent className="p-8">
            {step === 'phone' ? (
              <form onSubmit={handlePhoneSubmit} className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Connexion
                  </h2>
                  <p className="text-sm text-gray-600">
                    Entrez votre numéro de téléphone pour recevoir un code OTP
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Numéro de téléphone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      type="tel"
                      placeholder="+226 70 12 34 56"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10"
                      disabled={submitting}
                      autoFocus
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Format: +22670123456 ou 70123456
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      Envoyer le code OTP
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">
                      Accès réservé au personnel
                    </span>
                  </div>
                </div>

                <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
                  <p className="text-xs text-indigo-700">
                    <strong>Note :</strong> Seuls les administrateurs d'école,
                    comptables, agents et administrateurs plateforme peuvent accéder
                    au dashboard.
                  </p>
                </div>
              </form>
            ) : (
              <form onSubmit={handleOtpSubmit} className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Vérification OTP
                  </h2>
                  <p className="text-sm text-gray-600">
                    Entrez le code à 6 chiffres envoyé au{' '}
                    <span className="font-medium text-gray-900">{phone}</span>
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Code OTP
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="pl-10 text-center text-2xl tracking-widest font-mono"
                      disabled={submitting}
                      autoFocus
                      maxLength={6}
                    />
                  </div>
                  {countdown > 0 && (
                    <p className="text-xs text-gray-500">
                      Code valide pendant {formatCountdown(countdown)}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitting || otp.length !== 6}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Vérification...
                    </>
                  ) : (
                    'Vérifier le code'
                  )}
                </Button>

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('phone')
                      setOtp('')
                      setCountdown(0)
                    }}
                    className="w-full text-sm text-gray-600 hover:text-gray-900"
                    disabled={submitting}
                  >
                    Modifier le numéro de téléphone
                  </button>

                  {countdown === 0 ? (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      className="w-full text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                      disabled={submitting}
                    >
                      Renvoyer un nouveau code
                    </button>
                  ) : (
                    <p className="text-sm text-center text-gray-500">
                      Vous pourrez demander un nouveau code dans {formatCountdown(countdown)}
                    </p>
                  )}
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>© 2024 Scolarité BF - Tous droits réservés</p>
        </div>
      </div>
    </div>
  )
}
