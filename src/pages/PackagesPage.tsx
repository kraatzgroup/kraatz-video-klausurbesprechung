import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Check, CreditCard } from 'lucide-react'
import { Link } from 'react-router-dom'

interface Package {
  id: string
  name: string
  description: string
  case_study_count: number
  price_cents: number
  stripe_price_id: string
  active: boolean
}

export const PackagesPage: React.FC = () => {
  const { user } = useAuth()
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPackages()
  }, [])

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .eq('active', true)
        .order('price_cents', { ascending: true })

      if (error) throw error
      setPackages(data || [])
    } catch (error) {
      console.error('Error fetching packages:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (cents: number) => {
    return (cents / 100).toFixed(2)
  }

  const handlePurchase = (packageId: string) => {
    if (!user) {
      // Redirect to login
      return
    }
    // TODO: Implement Stripe checkout
    console.log('Purchase package:', packageId)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-text-primary mb-4">
          Wählen Sie Ihr Sachverhalts-Paket
        </h1>
        <p className="text-text-secondary max-w-2xl mx-auto">
          Buchen Sie Klausuren für maßgeschneiderte Sachverhalte und nutzen Sie diese flexibel 
          für die Rechtsbereiche Ihrer Wahl.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {packages.map((pkg, index) => (
          <div
            key={pkg.id}
            className={`bg-box-bg rounded-lg shadow-lg p-8 relative ${
              index === 1 ? 'ring-2 ring-primary transform scale-105' : ''
            }`}
          >
            {index === 1 && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Beliebteste Wahl
                </span>
              </div>
            )}

            <div className="text-center">
              <h3 className="text-2xl font-bold text-text-primary mb-2">
                {pkg.name}
              </h3>
              <p className="text-text-secondary mb-6">
                {pkg.description}
              </p>

              <div className="mb-6">
                <span className="text-4xl font-bold text-primary">
                  €{formatPrice(pkg.price_cents)}
                </span>
                <span className="text-text-secondary ml-2">
                  für {pkg.case_study_count} Klausuren
                </span>
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-text-secondary">
                    {pkg.case_study_count} maßgeschneiderte Sachverhalte
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-text-secondary">
                    Persönliches Video-Feedback
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-text-secondary">
                    Alle Rechtsbereiche verfügbar
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-500" />
                  <span className="text-text-secondary">
                    Unbegrenzte Gültigkeit
                  </span>
                </div>
              </div>

              {user ? (
                <button
                  onClick={() => handlePurchase(pkg.id)}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 ${
                    index === 1
                      ? 'bg-primary text-white hover:bg-blue-700'
                      : 'border border-primary text-primary hover:bg-primary hover:text-white'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span>Jetzt kaufen</span>
                </button>
              ) : (
                <Link
                  to="/register"
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 ${
                    index === 1
                      ? 'bg-primary text-white hover:bg-blue-700'
                      : 'border border-primary text-primary hover:bg-primary hover:text-white'
                  }`}
                >
                  <span>Registrieren & Kaufen</span>
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-box-bg rounded-lg p-6 max-w-4xl mx-auto">
        <h3 className="text-xl font-semibold text-text-primary mb-4">
          Häufig gestellte Fragen
        </h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-text-primary mb-2">
              Wie funktioniert das Klausur-System?
            </h4>
            <p className="text-text-secondary text-sm">
              Jede Klausur entspricht einem maßgeschneiderten Sachverhalt. Nach dem Kauf können Sie 
              Ihre Klausuren flexibel für beliebige Rechtsbereiche einsetzen.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-text-primary mb-2">
              Verfallen meine Klausuren?
            </h4>
            <p className="text-text-secondary text-sm">
              Nein, Ihre Klausuren haben eine unbegrenzte Gültigkeit und können jederzeit eingelöst werden.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-text-primary mb-2">
              Welche Zahlungsmethoden werden akzeptiert?
            </h4>
            <p className="text-text-secondary text-sm">
              Wir akzeptieren alle gängigen Kreditkarten, PayPal und SEPA-Lastschrift über Stripe.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
