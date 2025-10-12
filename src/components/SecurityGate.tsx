import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

interface SecurityGateProps {
  children: React.ReactNode
}

export const SecurityGate: React.FC<SecurityGateProps> = ({ children }) => {
  const { user, loading, isValidUser } = useAuth()
  const [validationComplete, setValidationComplete] = useState(false)

  // Track when validation is complete to prevent flickering
  useEffect(() => {
    if (!loading && user && isValidUser !== null) {
      // Small delay to ensure validation is truly complete
      const timer = setTimeout(() => {
        setValidationComplete(true)
      }, 500)
      return () => clearTimeout(timer)
    } else if (!user) {
      // No user means we can render immediately
      setValidationComplete(true)
    } else {
      setValidationComplete(false)
    }
  }, [user, loading, isValidUser])

  // Always show loading during initial auth check or user validation
  if (loading || !validationComplete || (user && isValidUser === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Show access denied for invalid users (after validation is complete)
  if (user && isValidUser === false && validationComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="mb-6">
            <svg className="mx-auto h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Zugriff verweigert
          </h1>
          <p className="text-gray-600 mb-6">
            Ihre E-Mail-Adresse ist nicht für den Zugriff auf diese Anwendung berechtigt.
          </p>
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              Wenn Sie glauben, dass dies ein Fehler ist, wenden Sie sich bitte an den Administrator.
            </p>
            <button
              onClick={() => window.location.href = '/login'}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Zur Anmeldung
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Render children only when validation is complete and user is valid (or no user)
  return <>{children}</>
}
