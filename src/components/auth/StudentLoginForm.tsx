import React, { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Mail, Send, CheckCircle, AlertCircle } from 'lucide-react'

interface StudentLoginFormProps {
  onSuccess?: () => void
}

export const StudentLoginForm: React.FC<StudentLoginFormProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)

  const verifyStripeCustomer = async (email: string) => {
    try {
      const response = await supabase.functions.invoke('verify-stripe-customer', {
        body: { email }
      })

      if (response.error) {
        throw new Error(response.error.message || 'Fehler bei der Überprüfung')
      }

      return response.data
    } catch (error) {
      console.error('Error verifying Stripe customer:', error)
      throw error
    }
  }

  const sendStudentMagicLink = async (email: string) => {
    try {
      const response = await supabase.functions.invoke('send-student-magic-link', {
        body: { email }
      })

      if (response.error) {
        throw new Error(response.error.message || 'Fehler beim Versenden des Anmelde-Links')
      }

      return response.data
    } catch (error) {
      console.error('Error sending student magic link:', error)
      throw error
    }
  }

  // Magic link is now sent by the Edge Function
  // No separate sendMagicLink function needed

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setVerifying(true)
    setError('')
    setSuccess(false)
    setMagicLinkSent(false)

    try {
      // Step 1: Verify email exists in Stripe
      console.log('🔍 Verifying Stripe customer...')
      const verificationResult = await verifyStripeCustomer(email)
      
      if (!verificationResult.verified) {
        setError(verificationResult.error || 'E-Mail-Adresse nicht im System gefunden.')
        setLoading(false)
        setVerifying(false)
        return
      }

      console.log('✅ Stripe customer verified')
      setVerifying(false)

      // Step 2: Send magic link via Mailgun
      console.log('📧 Sending magic link via Mailgun...')
      const magicLinkResult = await sendStudentMagicLink(email)
      
      if (!magicLinkResult.magicLinkSent) {
        setError('Fehler beim Versenden des Anmelde-Links.')
        setLoading(false)
        return
      }

      console.log('✅ Magic link sent successfully via Mailgun')
      
      setSuccess(true)
      setMagicLinkSent(true)
      console.log('✅ Authentication process completed successfully')

    } catch (error: any) {
      console.error('❌ Login error:', error)
      
      if (error.message?.includes('nicht im System gefunden') || error.message?.includes('Edge Function returned a non-2xx status code')) {
        setError('Hoppla! 😬 Es wurde kein Kraatz Club Mitglied mit dieser E-Mail Adresse gefunden.')
      } else {
        setError(error.message || 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.')
      }
    } finally {
      setLoading(false)
      setVerifying(false)
    }
  }

  if (success && magicLinkSent) {
    return (
      <div className="max-w-md mx-auto bg-box-bg p-8 rounded-lg shadow-lg">
        <div className="text-center">
          <CheckCircle className="mx-auto w-16 h-16 text-green-500 mb-4" />
          <h2 className="text-2xl font-semibold text-text-primary mb-4">
            E-Mail versendet!
          </h2>
          <p className="text-text-secondary mb-6">
            Wir haben Ihnen eine E-Mail mit einem Anmelde-Link an <strong>{email}</strong> gesendet.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Nächste Schritte:</strong>
            </p>
            <ul className="text-sm text-blue-700 mt-2 space-y-1">
              <li>• Überprüfen Sie Ihr E-Mail-Postfach</li>
              <li>• Klicken Sie auf den Anmelde-Link</li>
              <li>• Sie werden automatisch angemeldet</li>
            </ul>
          </div>
          <button
            onClick={() => {
              setSuccess(false)
              setMagicLinkSent(false)
              setEmail('')
            }}
            className="text-primary hover:text-blue-700 text-sm"
          >
            Andere E-Mail-Adresse verwenden
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto bg-box-bg p-8 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold text-text-primary mb-6 text-center">
        Studenten Anmeldung
      </h2>
      
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Hinweis:</strong> Sie benötigen einen aktiven Kraatz Club Account, um sich anzumelden.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1">
            E-Mail-Adresse
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary w-5 h-5" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="ihre.email@example.com"
              required
              disabled={loading}
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p>{error}</p>
              {error.includes('kein Kraatz Club Mitglied') && (
                <div className="mt-2">
                  <p className="text-red-700">
                    Überprüfe die E-Mail oder registriere Dich zuerst{' '}
                    <a 
                      href="https://kraatz-club.de" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-red-700 hover:text-red-800 underline font-medium"
                    >
                      hier
                    </a>
                    {' '}für den Kraatz Club.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
        >
          {verifying ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Überprüfe E-Mail-Adresse...</span>
            </>
          ) : loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Sende Anmelde-Link...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Anmelde-Link senden</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center space-y-2">
        <div className="text-text-secondary text-sm">
          Dozent oder Administrator?{' '}
          <a href="/admin" className="text-primary hover:text-blue-700">
            Hier anmelden
          </a>
        </div>
        <div className="text-xs text-text-secondary">
          Kein Kraatz Club Account?{' '}
          <a 
            href="https://kraatz-club.de" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:text-blue-700"
          >
            Jetzt erstellen
          </a>
        </div>
      </div>
    </div>
  )
}
