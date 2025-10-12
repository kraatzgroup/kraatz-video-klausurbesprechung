import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Loader2 } from 'lucide-react'
import { PasswordResetForm } from '../components/auth/PasswordResetForm'

export const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'password_reset'>('loading')
  const [message, setMessage] = useState('')
  const [authType, setAuthType] = useState<string>('')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔗 Processing auth callback...')
        console.log('🌐 Current URL:', window.location.href)
        console.log('🔍 Search params:', window.location.search)
        
        // Get parameters from URL
        let token = searchParams.get('token')
        let type = searchParams.get('type')
        
        setAuthType(type || '')
        
        // Different handling based on auth type
        const redirectTo = type === 'recovery' ? '/admin' : '/dashboard'

        // Handle malformed URLs - try to extract token from hash or other sources
        if (!token) {
          const hash = window.location.hash
          if (hash) {
            const hashParams = new URLSearchParams(hash.substring(1))
            token = hashParams.get('access_token') || hashParams.get('token')
            type = hashParams.get('type') || 'magiclink'
            console.log('🔧 Extracted from hash:', { token: !!token, type })
          }
        }

        console.log('📝 Auth callback params:', { 
          token: !!token, 
          tokenLength: token?.length, 
          type, 
          redirectTo,
          allParams: Object.fromEntries(searchParams.entries()),
          hash: window.location.hash,
          fullUrl: window.location.href
        })

        // If we still don't have a token, try to handle Supabase's automatic auth
        if (!token && !type) {
          console.log('🔧 No token found, checking for automatic Supabase auth...')
          
          // Check if user is already authenticated (Supabase might have handled it automatically)
          const { data: { session } } = await supabase.auth.getSession()
          
          if (session?.user) {
            console.log('✅ User already authenticated via Supabase:', session.user.email)
            
            // Check if this might be a password recovery session
            // Look for recovery indicators in URL or referrer
            const urlParams = new URLSearchParams(window.location.search)
            const isRecovery = urlParams.has('type') && urlParams.get('type') === 'recovery' ||
                              window.location.href.includes('recovery') ||
                              document.referrer.includes('recovery')
            
            if (isRecovery) {
              console.log('🔐 Detected password recovery context - showing reset form')
              setStatus('password_reset')
              setMessage('Bitte geben Sie Ihr neues Passwort ein.')
              return
            }
            
            setStatus('success')
            setMessage('Erfolgreich angemeldet! Sie werden weitergeleitet...')
            
            setTimeout(() => {
              navigate(redirectTo, { replace: true })
            }, 1000)
            return
          } else {
            console.error('❌ No token and no existing session')
            setStatus('error')
            setMessage('Ungültiger Anmelde-Link. Token oder Session fehlt.')
            return
          }
        }

        if (!token || !type) {
          console.error('❌ Missing token or type in callback URL')
          setStatus('error')
          setMessage('Ungültiger Anmelde-Link. Token oder Typ fehlt.')
          return
        }

        console.log('🔐 Processing auth token...', { type, tokenLength: token.length })
        
        // Handle password recovery differently - show form immediately without auto-login
        if (type === 'recovery') {
          console.log('🔐 Password reset mode - showing reset form without auto-login')
          setStatus('password_reset')
          setMessage('Bitte geben Sie Ihr neues Passwort ein.')
          return
        }

        // For magic links, verify and login
        console.log('🔐 Verifying magic link token with Supabase...')
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: type as any
        })

        if (error) {
          console.error('❌ Auth verification error:', error)
          setStatus('error')
          setMessage(`Anmeldung fehlgeschlagen: ${error.message}`)
          return
        }

        if (data.user) {
          console.log('✅ User authenticated successfully:', data.user.email)
          console.log('🔗 Magic link login - redirecting to dashboard')
          setStatus('success')
          setMessage('Erfolgreich angemeldet! Sie werden weitergeleitet...')
          
          // Wait a moment to show success message, then redirect
          setTimeout(() => {
            navigate(redirectTo, { replace: true })
          }, 2000)
        } else {
          console.error('❌ No user data received')
          setStatus('error')
          setMessage('Anmeldung fehlgeschlagen. Keine Benutzerdaten erhalten.')
        }

      } catch (error) {
        console.error('❌ Auth callback error:', error)
        setStatus('error')
        setMessage('Ein unerwarteter Fehler ist aufgetreten.')
      }
    }

    handleAuthCallback()
  }, [searchParams, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Anmeldung wird verarbeitet...
              </h2>
              <p className="text-gray-600">
                Bitte warten Sie, während wir Sie anmelden.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Anmeldung erfolgreich!
              </h2>
              <p className="text-gray-600 mb-4">
                {message}
              </p>
            </>
          )}

          {status === 'password_reset' && (
            <>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Neues Passwort festlegen
              </h2>
              <div className="text-left">
                <PasswordResetForm
                  onSuccess={() => {
                    setStatus('success')
                    setMessage('Passwort erfolgreich zurückgesetzt! Sie werden zur Anmeldung weitergeleitet...')
                  }}
                  onError={(error) => {
                    setStatus('error')
                    setMessage(error)
                  }}
                />
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {authType === 'recovery' ? 'Passwort-Reset fehlgeschlagen' : 'Anmeldung fehlgeschlagen'}
              </h2>
              <p className="text-gray-600 mb-4">
                {message}
              </p>
              <button
                onClick={() => navigate(authType === 'recovery' ? '/forgot-password' : '/login')}
                className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                {authType === 'recovery' ? 'Neuen Reset-Link anfordern' : 'Zur Anmeldung'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
