import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [tokenValid, setTokenValid] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  const token = searchParams.get('token')

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError('Kein Reset-Token gefunden.')
        setValidating(false)
        return
      }

      try {
        console.log('🔐 Validating reset token:', token)

        // Validate token via Edge Function
        const { data, error } = await supabase.functions.invoke('validate-reset-token', {
          body: { token }
        })

        if (error || !data.valid) {
          console.error('❌ Token validation failed:', error || data.error)
          setError(data?.error || 'Der Reset-Link ist ungültig oder abgelaufen.')
          setTokenValid(false)
        } else {
          console.log('✅ Token is valid for user:', data.email)
          setTokenValid(true)
          setUserEmail(data.email)
        }
      } catch (err) {
        console.error('❌ Token validation error:', err)
        setError('Fehler beim Validieren des Reset-Links.')
        setTokenValid(false)
      } finally {
        setValidating(false)
      }
    }

    validateToken()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!password) {
      setError('Bitte geben Sie ein neues Passwort ein.')
      return
    }

    if (password.length < 6) {
      setError('Das Passwort muss mindestens 6 Zeichen lang sein.')
      return
    }

    if (password !== confirmPassword) {
      setError('Die Passwörter stimmen nicht überein.')
      return
    }

    setLoading(true)
    setError('')

    try {
      console.log('🔐 Resetting password with token:', token)

      // Reset password via Edge Function
      const { data, error } = await supabase.functions.invoke('reset-password-with-token', {
        body: {
          token: token,
          newPassword: password
        }
      })

      if (error || !data.success) {
        console.error('❌ Password reset failed:', error || data.error)
        setError(data?.error || 'Fehler beim Zurücksetzen des Passworts.')
      } else {
        console.log('✅ Password reset successful')
        setSuccess(true)
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/admin', { replace: true })
        }, 3000)
      }
    } catch (err) {
      console.error('❌ Password reset error:', err)
      setError('Ein unerwarteter Fehler ist aufgetreten.')
    } finally {
      setLoading(false)
    }
  }

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Reset-Link wird validiert...
            </h2>
            <p className="text-gray-600">
              Bitte warten Sie, während wir Ihren Reset-Link überprüfen.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Reset-Link ungültig
            </h2>
            <p className="text-gray-600 mb-4">
              {error}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/forgot-password')}
                className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Neuen Reset-Link anfordern
              </button>
              <button
                onClick={() => navigate('/admin')}
                className="w-full bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors"
              >
                Zur Admin-Anmeldung
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Passwort erfolgreich zurückgesetzt!
            </h2>
            <p className="text-gray-600 mb-4">
              Ihr Passwort wurde erfolgreich geändert. Sie werden zur Anmeldung weitergeleitet...
            </p>
            <button
              onClick={() => navigate('/admin')}
              className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Jetzt anmelden
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Neues Passwort festlegen
          </h2>
          <p className="text-gray-600">
            Für: <strong>{userEmail}</strong>
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Neues Passwort
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Mindestens 6 Zeichen"
              required
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Passwort bestätigen
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Passwort wiederholen"
              required
            />
          </div>

          <div className="bg-blue-50 p-3 rounded-md">
            <p className="text-blue-800 text-sm">
              <strong>Passwort-Anforderungen:</strong><br />
              • Mindestens 6 Zeichen<br />
              • Verwenden Sie eine sichere Kombination
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Wird gespeichert...
              </>
            ) : (
              'Passwort zurücksetzen'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/admin')}
            className="text-primary hover:text-blue-700 text-sm"
          >
            ← Zurück zur Anmeldung
          </button>
        </div>
      </div>
    </div>
  )
}
