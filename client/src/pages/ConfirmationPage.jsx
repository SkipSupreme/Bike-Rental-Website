import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CheckCircle, MapPin, Clock, Bike, AlertCircle, Star } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || ''

export default function ConfirmationPage() {
  const { rentalId } = useParams()
  const [rental, setRental] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`${API_URL}/api/rentals/${rentalId}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error)
        setRental(data.rental)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [rentalId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="card max-w-md text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-red-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <Link to="/my-rentals" className="btn-primary">
            View My Rentals
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="py-8 min-h-screen">
      <div className="container mx-auto px-4 max-w-lg">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-green-400" />
          </div>
          <h1 className="font-heading text-3xl mb-2">You're All Set!</h1>
          <p className="text-gray-400">Your bike is reserved and ready for pickup</p>
        </div>

        {/* Confirmation Details */}
        <div className="card mb-6">
          <div className="text-center pb-4 mb-4 border-b border-bike-gray/50">
            <p className="text-sm text-gray-500">Confirmation Number</p>
            <p className="font-mono text-xl font-semibold text-bike-orange">
              {rental.id.slice(0, 8).toUpperCase()}
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Bike className="text-bike-orange flex-shrink-0 mt-1" size={20} />
              <div>
                <p className="font-medium">{rental.bike_name}</p>
                <p className="text-sm text-gray-400">{rental.bike_type}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="text-bike-orange flex-shrink-0 mt-1" size={20} />
              <div>
                <p className="font-medium">
                  {new Date(rental.start_time).toLocaleDateString('en-US', {
                    weekday: 'long', month: 'long', day: 'numeric'
                  })}
                </p>
                <p className="text-sm text-gray-400">
                  {new Date(rental.start_time).toLocaleTimeString('en-US', {
                    hour: 'numeric', minute: '2-digit'
                  })}
                  {' - '}
                  {new Date(rental.end_time).toLocaleTimeString('en-US', {
                    hour: 'numeric', minute: '2-digit'
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="text-bike-orange flex-shrink-0 mt-1" size={20} />
              <div>
                <p className="font-medium">Joe's Garage</p>
                <p className="text-sm text-gray-400">
                  355 8 St SW, Calgary, AB<br />
                  Bow River Pathway, near 10th Street LRT
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-bike-gray/50">
            <div className="flex justify-between">
              <span className="text-gray-400">Total Paid</span>
              <span className="font-semibold text-bike-orange">
                ${rental.total_amount?.toFixed(2)} CAD
              </span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="card bg-bike-orange/10 border-bike-orange/30 mb-6">
          <h3 className="font-semibold mb-3">What to Bring</h3>
          <ul className="text-sm text-gray-300 space-y-2">
            <li>• Photo ID (driver's license or passport)</li>
            <li>• This confirmation number</li>
            <li>• Comfortable clothes and closed-toe shoes</li>
          </ul>
        </div>

        {/* Included */}
        <div className="card mb-6">
          <h3 className="font-semibold mb-3">Included in Your Rental</h3>
          <div className="grid grid-cols-2 gap-3 text-sm text-gray-300">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-400" />
              <span>Helmet</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-400" />
              <span>Lock</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-400" />
              <span>Trail Map</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-400" />
              <span>Bike Adjustment</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link to="/my-rentals" className="btn-primary w-full text-center block">
            View My Rentals
          </Link>
          <Link to="/" className="btn-secondary w-full text-center block">
            Back to Home
          </Link>
        </div>

        {/* Review reminder */}
        <div className="mt-8 text-center">
          <div className="flex justify-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map(s => (
              <Star key={s} size={20} className="text-gray-600" />
            ))}
          </div>
          <p className="text-sm text-gray-400">
            Had a great ride? We'd love to hear about it!
          </p>
          <Link to="/review" className="text-bike-orange text-sm hover:text-orange-400">
            Leave a review
          </Link>
        </div>
      </div>
    </div>
  )
}
