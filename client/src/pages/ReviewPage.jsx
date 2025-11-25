import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star, Send, AlertCircle, CheckCircle } from 'lucide-react'

export default function ReviewPage() {
  const navigate = useNavigate()

  const [canReview, setCanReview] = useState(false)
  const [rentals, setRentals] = useState([])
  const [selectedRental, setSelectedRental] = useState('')
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetch('/api/reviews/can-review', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setCanReview(data.canReview)
        setRentals(data.unreviewedRentals || [])
        if (data.unreviewedRentals?.length > 0) {
          setSelectedRental(data.unreviewedRentals[0].id)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (rating === 0) {
      setError('Please select a rating')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          rating,
          comment,
          rentalId: selectedRental || null
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setSuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="py-8 min-h-screen">
        <div className="container mx-auto px-4 max-w-lg">
          <div className="card text-center py-12">
            <CheckCircle className="w-16 h-16 mx-auto text-green-400 mb-4" />
            <h1 className="font-heading text-3xl mb-2">Thank You!</h1>
            <p className="text-gray-400 mb-6">
              Your review has been submitted and will be published after approval.
            </p>
            <button
              onClick={() => navigate('/')}
              className="btn-primary"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!canReview) {
    return (
      <div className="py-8 min-h-screen">
        <div className="container mx-auto px-4 max-w-lg">
          <div className="card text-center py-12">
            <Star className="w-16 h-16 mx-auto text-gray-600 mb-4" />
            <h1 className="font-heading text-3xl mb-2">Leave a Review</h1>
            <p className="text-gray-400 mb-6">
              You can leave a review after completing your first bike rental.
            </p>
            <button
              onClick={() => navigate('/rent')}
              className="btn-primary"
            >
              Rent a Bike
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="py-8 min-h-screen">
      <div className="container mx-auto px-4 max-w-lg">
        <div className="text-center mb-8">
          <Star className="w-12 h-12 mx-auto text-bike-orange mb-4" />
          <h1 className="font-heading text-3xl mb-2">Leave a Review</h1>
          <p className="text-gray-400">Share your experience with Joe's Garage</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-3">
            <AlertCircle className="text-red-400 flex-shrink-0" size={20} />
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="card">
          {/* Rental Selection */}
          {rentals.length > 0 && (
            <div className="mb-6">
              <label className="label">Which rental are you reviewing?</label>
              <select
                value={selectedRental}
                onChange={(e) => setSelectedRental(e.target.value)}
                className="input"
              >
                {rentals.map(rental => (
                  <option key={rental.id} value={rental.id}>
                    {rental.bike_name} - {new Date(rental.end_time).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Star Rating */}
          <div className="mb-6">
            <label className="label">Your Rating</label>
            <div className="flex gap-2 justify-center py-4">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    size={40}
                    className={`transition-colors ${
                      star <= (hoveredRating || rating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-600'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-center text-sm text-gray-400">
              {rating === 1 && 'Poor'}
              {rating === 2 && 'Fair'}
              {rating === 3 && 'Good'}
              {rating === 4 && 'Very Good'}
              {rating === 5 && 'Excellent!'}
            </p>
          </div>

          {/* Comment */}
          <div className="mb-6">
            <label className="label">Your Review (Optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="input min-h-32 resize-none"
              placeholder="Tell us about your experience..."
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              {comment.length}/500
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting || rating === 0}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {submitting ? (
              'Submitting...'
            ) : (
              <>
                <Send size={18} />
                Submit Review
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
