import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Clock, Bike, AlertCircle, ChevronRight } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || ''

export default function MyRentalsPage() {
  const [rentals, setRentals] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetch(`${API_URL}/api/rentals/my-rentals`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setRentals(data.rentals || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filteredRentals = filter === 'all'
    ? rentals
    : rentals.filter(r => r.status === filter)

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500/20 text-green-400'
      case 'active': return 'bg-blue-500/20 text-blue-400'
      case 'completed': return 'bg-gray-500/20 text-gray-400'
      case 'cancelled': return 'bg-red-500/20 text-red-400'
      default: return 'bg-yellow-500/20 text-yellow-400'
    }
  }

  const getPaymentColor = (status) => {
    switch (status) {
      case 'paid': return 'text-green-400'
      case 'failed': return 'text-red-400'
      default: return 'text-yellow-400'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="py-8 min-h-screen">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="font-heading text-3xl">My Rentals</h1>
          <Link to="/rent" className="btn-primary text-sm py-2 px-4">
            New Rental
          </Link>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['all', 'confirmed', 'active', 'completed', 'cancelled'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
                filter === status
                  ? 'bg-bike-orange text-white'
                  : 'bg-bike-gray/50 text-gray-300'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {filteredRentals.length === 0 ? (
          <div className="card text-center py-12">
            <Calendar className="w-12 h-12 mx-auto text-gray-600 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Rentals Yet</h2>
            <p className="text-gray-400 mb-4">
              {filter === 'all'
                ? "You haven't rented a bike yet. Ready to ride?"
                : `No ${filter} rentals found.`}
            </p>
            {filter === 'all' && (
              <Link to="/rent" className="btn-primary">
                Rent a Bike
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRentals.map(rental => (
              <div
                key={rental.id}
                className="card hover:border-bike-orange/30 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-lg bg-bike-orange/20 flex items-center justify-center flex-shrink-0">
                    <Bike className="text-bike-orange" size={28} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold">{rental.bike_name}</h3>
                        <p className="text-sm text-gray-400">
                          {new Date(rental.start_time).toLocaleDateString('en-US', {
                            weekday: 'short', month: 'short', day: 'numeric'
                          })}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(rental.status)}`}>
                        {rental.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-1 text-gray-400">
                        <Clock size={14} />
                        <span>
                          {new Date(rental.start_time).toLocaleTimeString('en-US', {
                            hour: 'numeric', minute: '2-digit'
                          })}
                          {' - '}
                          {new Date(rental.end_time).toLocaleTimeString('en-US', {
                            hour: 'numeric', minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={getPaymentColor(rental.payment_status)}>
                          ${rental.total_amount?.toFixed(2)}
                        </span>
                        <span className="text-gray-500">
                          ({rental.payment_status})
                        </span>
                      </div>
                    </div>

                    {rental.status === 'pending' && rental.payment_status !== 'paid' && (
                      <Link
                        to={`/payment/${rental.id}`}
                        className="inline-flex items-center gap-1 mt-3 text-bike-orange text-sm font-medium"
                      >
                        Complete Payment <ChevronRight size={16} />
                      </Link>
                    )}

                    {rental.status === 'confirmed' && (
                      <Link
                        to={`/confirmation/${rental.id}`}
                        className="inline-flex items-center gap-1 mt-3 text-bike-orange text-sm font-medium"
                      >
                        View Details <ChevronRight size={16} />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Review Prompt */}
        {rentals.some(r => r.status === 'completed') && (
          <div className="mt-8 card bg-bike-orange/10 border-bike-orange/30 text-center">
            <p className="text-sm mb-3">Had a great experience? We'd love to hear from you!</p>
            <Link to="/review" className="text-bike-orange font-medium">
              Leave a Review
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
