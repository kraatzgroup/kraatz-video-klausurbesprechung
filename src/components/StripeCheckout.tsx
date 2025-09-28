import React, { useState, useEffect } from 'react'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import stripePromise from '../lib/stripe'
import { createPaymentIntent, confirmPayment } from '../utils/stripeUtils'
import { useAuth } from '../contexts/AuthContext'
import { Loader2, CreditCard, XCircle } from 'lucide-react'

interface Package {
  id: string
  package_key: string
  name: string
  description: string
  case_study_count: number
  price_cents: number
  stripe_price_id: string
  active: boolean
}

interface CheckoutFormProps {
  selectedPackage: Package
  onSuccess: () => void
  onCancel: () => void
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ selectedPackage, onSuccess, onCancel }) => {
  const stripe = useStripe()
  const elements = useElements()
  const { user } = useAuth()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clientSecret, setClientSecret] = useState<string>('')
  const [paymentIntentId, setPaymentIntentId] = useState<string>('')

  useEffect(() => {
    if (user && selectedPackage) {
      createPaymentIntent({
        packageId: selectedPackage.id,
        userId: user.id
      })
        .then(({ clientSecret, paymentIntentId }) => {
          setClientSecret(clientSecret)
          setPaymentIntentId(paymentIntentId)
        })
        .catch((err) => {
          setError(`Fehler beim Erstellen der Zahlung: ${err.message}`)
        })
    }
  }, [user, selectedPackage])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements || !clientSecret) {
      return
    }

    setIsProcessing(true)
    setError(null)

    const cardElement = elements.getElement(CardElement)

    if (!cardElement) {
      setError('Kartenelement nicht gefunden')
      setIsProcessing(false)
      return
    }

    try {
      // Confirm the payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: user?.email || '',
            email: user?.email || ''
          }
        }
      })

      if (stripeError) {
        setError(`Zahlungsfehler: ${stripeError.message}`)
        setIsProcessing(false)
        return
      }

      if (paymentIntent?.status === 'succeeded') {
        // Confirm payment on our backend and update user credits
        await confirmPayment(paymentIntentId)
        onSuccess()
      }
    } catch (err: any) {
      setError(`Fehler bei der Zahlungsbestätigung: ${err.message}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Zahlung für {selectedPackage.name}
        </h3>
        <p className="text-gray-600 mb-4">
          {selectedPackage.case_study_count} Klausuren für €{(selectedPackage.price_cents / 100).toLocaleString('de-DE')}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kreditkarteninformationen
          </label>
          <div className="border border-gray-300 rounded-md p-3 bg-gray-50">
            <CardElement options={cardElementOptions} />
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center space-x-2">
            <XCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={isProcessing}
          >
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={!stripe || isProcessing || !clientSecret}
            className="flex-1 bg-primary text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verarbeitung...</span>
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                <span>€{(selectedPackage.price_cents / 100).toLocaleString('de-DE')} bezahlen</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

interface StripeCheckoutProps {
  selectedPackage: Package
  onSuccess: () => void
  onCancel: () => void
}

const StripeCheckout: React.FC<StripeCheckoutProps> = ({ selectedPackage, onSuccess, onCancel }) => {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm 
        selectedPackage={selectedPackage} 
        onSuccess={onSuccess} 
        onCancel={onCancel} 
      />
    </Elements>
  )
}

export default StripeCheckout
