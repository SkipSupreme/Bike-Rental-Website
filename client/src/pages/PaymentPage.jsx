import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { CreditCard, Lock, AlertCircle, Bike } from 'lucide-react'

// Load Stripe
let stripePromise = null

function PaymentForm({ rental, clientSecret }) {
  const stripe = useStripe()
  const elements = useElements()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!stripe || !elements) return

    setLoading(true)
    setError('')

    try {
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)
        }
      })

      if (stripeError) {
        throw new Error(stripeError.message)
      }

      if (paymentIntent.status === 'succeeded') {
        // Confirm payment on server
        await fetch('/api/payments/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            rentalId: rental.id,
            paymentIntentId: paymentIntent.id
          })
        })

        navigate(`/confirmation/${rental.id}`)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const cardStyle = {
    base: {
      color: '#fff',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '16px',
      '::placeholder': {
        color: '#6b7280'
      }
    },
    invalid: {
      color: '#ef4444'
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-3">
          <AlertCircle className="text-red-400 flex-shrink-0" size={20} />
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      <div className="card mb-6">
        <label className="label flex items-center gap-2">
          <CreditCard size={18} />
          Card Details
        </label>
        <div className="bg-bike-dark border border-bike-gray rounded-lg p-4">
          <CardElement options={{ style: cardStyle }} />
        </div>
        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
          <Lock size={12} />
          Secured by Stripe. We never store your card details.
        </p>
      </div>

      <button
        type="submit"
        disabled={!stripe || loading}
        className="btn-primary w-full"
      >
        {loading ? 'Processing...' : `Pay $${rental.total_amount?.toFixed(2)} CAD`}
      </button>
    </form>
  )
}

export default function PaymentPage() {
  const { rentalId } = useParams()
  const navigate = useNavigate()

  const [rental, setRental] = useState(null)
  const [clientSecret, setClientSecret] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const init = async () => {
      try {
        // Get Stripe config
        const configRes = await fetch('/api/payments/config')
        const configData = await configRes.json()
        stripePromise = loadStripe(configData.publishableKey)

        // Get rental details
        const rentalRes = await fetch(`/api/rentals/${rentalId}`, {
          credentials: 'include'
        })
        const rentalData = await rentalRes.json()

        if (!rentalRes.ok) throw new Error(rentalData.error)
        setRental(rentalData.rental)

        // Create payment intent
        const intentRes = await fetch('/api/payments/create-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ rentalId })
        })
        const intentData = await intentRes.json()

        if (!intentRes.ok) throw new Error(intentData.error)
        setClientSecret(intentData.clientSecret)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [rentalId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-400">Preparing payment...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card max-w-md mx-auto text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-red-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Payment Error</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button onClick={() => navigate('/rent')} className="btn-secondary">
            Back to Rentals
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="py-8 min-h-screen">
      <div className="container mx-auto px-4 max-w-lg">
        <div className="text-center mb-8">
          <CreditCard className="w-12 h-12 mx-auto text-bike-orange mb-4" />
          <h1 className="font-heading text-3xl mb-2">Complete Payment</h1>
          <p className="text-gray-400">Secure checkout</p>
        </div>

        {/* Order Summary */}
        <div className="card mb-6">
          <h2 className="font-semibold mb-4">Order Summary</h2>

          <div className="flex items-center gap-4 mb-4 pb-4 border-b border-bike-gray/50">
            <div className="w-12 h-12 rounded-lg bg-bike-orange/20 flex items-center justify-center">
              <Bike className="text-bike-orange" size={24} />
            </div>
            <div className="flex-1">
              <p className="font-medium">{rental.bike_name}</p>
              <p className="text-sm text-gray-400">
                {new Date(rental.start_time).toLocaleDateString('en-US', {
                  weekday: 'short', month: 'short', day: 'numeric'
                })}
              </p>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Rental ({rental.rental_type?.replace('_', ' ')})</span>
              <span>${rental.base_amount?.toFixed(2)}</span>
            </div>
            {rental.additional_charges > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-400">Additional charges</span>
                <span>${rental.additional_charges?.toFixed(2)}</span>
              </div>
            )}
            {rental.discount_amount > 0 && (
              <div className="flex justify-between text-green-400">
                <span>Discount</span>
                <span>-${rental.discount_amount?.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-bike-gray/50 text-lg font-semibold">
              <span>Total</span>
              <span className="text-bike-orange">${rental.total_amount?.toFixed(2)} CAD</span>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        {stripePromise && clientSecret && (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaymentForm rental={rental} clientSecret={clientSecret} />
          </Elements>
        )}

        {/* Test Card Info */}
        <div className="mt-6 p-4 bg-bike-gray/30 rounded-lg text-sm text-gray-400">
          <p className="font-medium text-gray-300 mb-2">Test Card Numbers:</p>
          <p>Success: 4242 4242 4242 4242</p>
          <p>Decline: 4000 0000 0000 0002</p>
          <p>Use any future date and any 3-digit CVC</p>
        </div>
      </div>
    </div>
  )
}
