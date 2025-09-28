import React, { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Check, Loader2 } from 'lucide-react'

export const CheckoutSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    // Simulate processing time and then show success
    const timer = setTimeout(() => {
      setLoading(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8">
          <div className="flex items-center justify-center mb-4">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          </div>
          <h2 className="text-2xl font-semibold text-blue-900 mb-2">
            Zahlung wird verarbeitet...
          </h2>
          <p className="text-blue-700">
            Bitte warten Sie, während wir Ihre Zahlung bestätigen und Ihre Credits hinzufügen.
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8">
          <h2 className="text-2xl font-semibold text-red-900 mb-2">
            Fehler bei der Zahlungsverarbeitung
          </h2>
          <p className="text-red-700 mb-4">
            {error}
          </p>
          <Link
            to="/packages"
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Zurück zu den Paketen
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto text-center py-12">
      <div className="bg-green-50 border border-green-200 rounded-lg p-8">
        <div className="flex items-center justify-center mb-4">
          <Check className="w-16 h-16 text-green-500" />
        </div>
        <h2 className="text-3xl font-semibold text-green-900 mb-4">
          Zahlung erfolgreich!
        </h2>
        <p className="text-green-700 mb-6 text-lg">
          Vielen Dank für Ihren Kauf! Ihre Credits wurden erfolgreich zu Ihrem Konto hinzugefügt.
        </p>
        
        <div className="bg-white rounded-lg p-6 mb-6 border border-green-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Was passiert als nächstes?
          </h3>
          <ul className="text-left space-y-2 text-gray-700">
            <li className="flex items-start space-x-2">
              <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Ihre Credits sind sofort verfügbar</span>
            </li>
            <li className="flex items-start space-x-2">
              <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Sie können jetzt Klausuren anfordern</span>
            </li>
            <li className="flex items-start space-x-2">
              <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Eine Bestätigungs-E-Mail wurde versendet</span>
            </li>
            <li className="flex items-start space-x-2">
              <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Ihre Credits verfallen nie</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/dashboard"
            className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Zum Dashboard
          </Link>
          <Link
            to="/case-study-request"
            className="inline-flex items-center px-6 py-3 border border-primary text-primary rounded-lg hover:bg-primary hover:text-white transition-colors font-semibold"
          >
            Erste Klausur anfordern
          </Link>
        </div>

        {sessionId && (
          <p className="text-xs text-gray-500 mt-6">
            Session ID: {sessionId}
          </p>
        )}
      </div>
    </div>
  )
}
