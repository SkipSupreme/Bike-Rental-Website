import { useState, useEffect } from 'react'
import { Settings, Save, Check, AlertCircle, X, Star } from 'lucide-react'

export default function AdminSettings() {
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  // Reviews
  const [pendingReviews, setPendingReviews] = useState([])

  useEffect(() => {
    fetchSettings()
    fetchPendingReviews()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings', { credentials: 'include' })
      const data = await res.json()
      setSettings(data.settings || {})
    } catch (err) {
      setError('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const fetchPendingReviews = async () => {
    try {
      const res = await fetch('/api/admin/reviews/pending', { credentials: 'include' })
      const data = await res.json()
      setPendingReviews(data.reviews || [])
    } catch (err) {
      console.error('Failed to load reviews:', err)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ settings })
      })

      if (!res.ok) throw new Error('Failed to save')

      setSuccess('Settings saved!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleReviewAction = async (reviewId, approved) => {
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ approved })
      })

      if (res.ok) {
        fetchPendingReviews()
        setSuccess(approved ? 'Review approved!' : 'Review removed')
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err) {
      setError('Failed to update review')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-heading text-3xl">Settings</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2"
        >
          <Save size={18} />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* Messages */}
      {success && (
        <div className="mb-4 p-4 bg-green-500/20 border border-green-500/50 rounded-lg flex items-center gap-3">
          <Check className="text-green-400" size={20} />
          <p className="text-green-200">{success}</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-3">
          <AlertCircle className="text-red-400" size={20} />
          <p className="text-red-200">{error}</p>
          <button onClick={() => setError('')} className="ml-auto"><X size={18} /></button>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Business Settings */}
        <div className="card">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Settings className="text-bike-orange" size={18} />
            Business Settings
          </h2>

          <div className="space-y-4">
            <div>
              <label className="label">Rental Buffer (minutes)</label>
              <input
                type="number"
                value={settings.buffer_minutes || 20}
                onChange={(e) => setSettings({ ...settings, buffer_minutes: e.target.value })}
                className="input"
                min="0"
              />
              <p className="text-xs text-gray-500 mt-1">
                Time between rentals for check-in/check-out
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Opening Time</label>
                <input
                  type="time"
                  value={settings.business_hours_start || '10:00'}
                  onChange={(e) => setSettings({ ...settings, business_hours_start: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Closing Time</label>
                <input
                  type="time"
                  value={settings.business_hours_end || '19:00'}
                  onChange={(e) => setSettings({ ...settings, business_hours_end: e.target.value })}
                  className="input"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Fee Settings */}
        <div className="card">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Settings className="text-bike-orange" size={18} />
            Default Fees
          </h2>

          <div className="space-y-4">
            <div>
              <label className="label">Lost Helmet Fee ($)</label>
              <input
                type="number"
                value={settings.helmet_charge || 50}
                onChange={(e) => setSettings({ ...settings, helmet_charge: e.target.value })}
                className="input"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="label">Lost Lock Fee ($)</label>
              <input
                type="number"
                value={settings.lock_charge || 40}
                onChange={(e) => setSettings({ ...settings, lock_charge: e.target.value })}
                className="input"
                min="0"
                step="0.01"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Pending Reviews */}
      <div className="card mt-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Star className="text-bike-orange" size={18} />
          Pending Reviews ({pendingReviews.length})
        </h2>

        {pendingReviews.length === 0 ? (
          <p className="text-gray-500 text-sm">No reviews pending approval</p>
        ) : (
          <div className="space-y-4">
            {pendingReviews.map(review => (
              <div key={review.id} className="bg-bike-dark/50 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium">{review.first_name} {review.last_name}</p>
                    <div className="flex gap-0.5 mt-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          size={14}
                          className={star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
                {review.comment && (
                  <p className="text-sm text-gray-300 mb-3">"{review.comment}"</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleReviewAction(review.id, true)}
                    className="px-3 py-1 text-sm bg-green-500/20 text-green-400 rounded hover:bg-green-500/30"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReviewAction(review.id, false)}
                    className="px-3 py-1 text-sm bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stripe Info */}
      <div className="card mt-6 bg-bike-orange/10 border-bike-orange/30">
        <h2 className="font-semibold mb-2">Stripe Configuration</h2>
        <p className="text-sm text-gray-300 mb-4">
          Stripe API keys are configured in the server environment variables.
          Contact your developer to update payment settings.
        </p>
        <div className="text-sm text-gray-400">
          <p>• STRIPE_SECRET_KEY - Server-side API key</p>
          <p>• STRIPE_PUBLISHABLE_KEY - Client-side key</p>
          <p>• STRIPE_WEBHOOK_SECRET - Webhook verification</p>
        </div>
      </div>

      {/* Admin Login Info */}
      <div className="card mt-6">
        <h2 className="font-semibold mb-2">Admin Access</h2>
        <p className="text-sm text-gray-400">
          To change admin credentials, update the user record in the database or
          contact your developer. Default login: joe@joesgarage.ca
        </p>
      </div>
    </div>
  )
}
