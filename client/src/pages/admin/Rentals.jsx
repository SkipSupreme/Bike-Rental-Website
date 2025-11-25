import { useState, useEffect } from 'react'
import { Calendar, Clock, DollarSign, Plus, Minus, AlertCircle, X, Check } from 'lucide-react'

export default function AdminRentals() {
  const [rentals, setRentals] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')
  const [selectedRental, setSelectedRental] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Charge/Discount form
  const [chargeForm, setChargeForm] = useState({
    type: 'charge',
    chargeType: 'damage',
    amount: '',
    description: ''
  })

  useEffect(() => {
    fetchRentals()
  }, [filter, dateFilter])

  const fetchRentals = async () => {
    try {
      const params = new URLSearchParams()
      if (filter !== 'all') params.append('status', filter)
      if (dateFilter) params.append('date', dateFilter)

      const res = await fetch(`/api/rentals/admin/all?${params}`, { credentials: 'include' })
      const data = await res.json()
      setRentals(data.rentals || [])
    } catch (err) {
      setError('Failed to load rentals')
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (rentalId, status) => {
    try {
      const res = await fetch(`/api/rentals/${rentalId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status })
      })

      if (!res.ok) throw new Error('Failed to update status')

      setSuccess('Status updated!')
      fetchRentals()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleChargeSubmit = async () => {
    if (!chargeForm.amount || !selectedRental) return

    setError('')
    try {
      const endpoint = chargeForm.type === 'charge'
        ? `/api/rentals/${selectedRental.id}/charge`
        : `/api/rentals/${selectedRental.id}/discount`

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          chargeType: chargeForm.chargeType,
          amount: parseFloat(chargeForm.amount),
          description: chargeForm.description
        })
      })

      if (!res.ok) throw new Error('Failed to apply charge/discount')

      setSuccess(`${chargeForm.type === 'charge' ? 'Charge' : 'Discount'} applied!`)
      setChargeForm({ type: 'charge', chargeType: 'damage', amount: '', description: '' })
      setSelectedRental(null)
      fetchRentals()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500/20 text-green-400'
      case 'active': return 'bg-blue-500/20 text-blue-400'
      case 'completed': return 'bg-gray-500/20 text-gray-400'
      case 'cancelled': return 'bg-red-500/20 text-red-400'
      default: return 'bg-yellow-500/20 text-yellow-400'
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
      <h1 className="font-heading text-3xl mb-6">Manage Rentals</h1>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-3">
          <AlertCircle className="text-red-400" size={20} />
          <p className="text-red-200">{error}</p>
          <button onClick={() => setError('')} className="ml-auto"><X size={18} /></button>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-500/20 border border-green-500/50 rounded-lg flex items-center gap-3">
          <Check className="text-green-400" size={20} />
          <p className="text-green-200">{success}</p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex gap-2">
          {['all', 'pending', 'confirmed', 'active', 'completed', 'cancelled'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-full text-sm ${
                filter === status
                  ? 'bg-bike-orange text-white'
                  : 'bg-bike-gray/50 text-gray-300'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="input w-auto"
        />
        {dateFilter && (
          <button
            onClick={() => setDateFilter('')}
            className="text-sm text-gray-400"
          >
            Clear date
          </button>
        )}
      </div>

      {/* Rentals List */}
      <div className="space-y-4">
        {rentals.length === 0 ? (
          <div className="card text-center py-12">
            <Calendar className="w-12 h-12 mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400">No rentals found</p>
          </div>
        ) : (
          rentals.map(rental => (
            <div key={rental.id} className="card">
              <div className="flex flex-wrap gap-4 items-start justify-between">
                {/* Customer & Bike Info */}
                <div className="flex-1 min-w-48">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{rental.first_name} {rental.last_name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(rental.status)}`}>
                      {rental.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">{rental.email}</p>
                  {rental.phone && <p className="text-sm text-gray-400">{rental.phone}</p>}
                  <p className="text-sm text-bike-orange mt-2">{rental.bike_name}</p>
                </div>

                {/* Time Info */}
                <div className="text-sm">
                  <div className="flex items-center gap-2 text-gray-400 mb-1">
                    <Calendar size={14} />
                    {new Date(rental.start_time).toLocaleDateString('en-US', {
                      weekday: 'short', month: 'short', day: 'numeric'
                    })}
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <Clock size={14} />
                    {new Date(rental.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    {' - '}
                    {new Date(rental.end_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </div>
                </div>

                {/* Price Info */}
                <div className="text-right">
                  <p className="text-lg font-semibold text-bike-orange">
                    ${rental.total_amount?.toFixed(2)}
                  </p>
                  <p className={`text-sm ${
                    rental.payment_status === 'paid' ? 'text-green-400' :
                    rental.payment_status === 'failed' ? 'text-red-400' : 'text-yellow-400'
                  }`}>
                    {rental.payment_status}
                  </p>
                  {rental.additional_charges > 0 && (
                    <p className="text-xs text-gray-500">
                      +${rental.additional_charges} charges
                    </p>
                  )}
                  {rental.discount_amount > 0 && (
                    <p className="text-xs text-green-400">
                      -${rental.discount_amount} discount
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-bike-gray/30">
                {rental.status === 'confirmed' && (
                  <button
                    onClick={() => updateStatus(rental.id, 'active')}
                    className="px-3 py-1 text-sm bg-blue-500/20 text-blue-400 rounded"
                  >
                    Start Rental
                  </button>
                )}
                {rental.status === 'active' && (
                  <button
                    onClick={() => updateStatus(rental.id, 'completed')}
                    className="px-3 py-1 text-sm bg-green-500/20 text-green-400 rounded"
                  >
                    Complete Rental
                  </button>
                )}
                {['pending', 'confirmed'].includes(rental.status) && (
                  <button
                    onClick={() => updateStatus(rental.id, 'cancelled')}
                    className="px-3 py-1 text-sm bg-red-500/20 text-red-400 rounded"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={() => setSelectedRental(rental)}
                  className="px-3 py-1 text-sm bg-bike-orange/20 text-bike-orange rounded flex items-center gap-1"
                >
                  <DollarSign size={14} />
                  Charge/Discount
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Charge/Discount Modal */}
      {selectedRental && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="card max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-lg">
                {selectedRental.first_name} {selectedRental.last_name}
              </h2>
              <button onClick={() => setSelectedRental(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setChargeForm({ ...chargeForm, type: 'charge' })}
                className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 ${
                  chargeForm.type === 'charge'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                    : 'bg-bike-gray/50 text-gray-400'
                }`}
              >
                <Plus size={18} />
                Add Charge
              </button>
              <button
                onClick={() => setChargeForm({ ...chargeForm, type: 'discount' })}
                className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 ${
                  chargeForm.type === 'discount'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                    : 'bg-bike-gray/50 text-gray-400'
                }`}
              >
                <Minus size={18} />
                Give Discount
              </button>
            </div>

            {chargeForm.type === 'charge' && (
              <div className="mb-4">
                <label className="label">Charge Type</label>
                <select
                  value={chargeForm.chargeType}
                  onChange={(e) => setChargeForm({ ...chargeForm, chargeType: e.target.value })}
                  className="input"
                >
                  <option value="damage">Bike Damage</option>
                  <option value="lost_helmet">Lost Helmet ($50)</option>
                  <option value="lost_lock">Lost Lock ($40)</option>
                  <option value="stolen_bike">Stolen Bike</option>
                  <option value="late_return">Late Return</option>
                  <option value="other">Other</option>
                </select>
              </div>
            )}

            <div className="mb-4">
              <label className="label">Amount ($)</label>
              <input
                type="number"
                value={chargeForm.amount}
                onChange={(e) => setChargeForm({ ...chargeForm, amount: e.target.value })}
                className="input"
                step="0.01"
                placeholder="0.00"
              />
            </div>

            <div className="mb-4">
              <label className="label">Description</label>
              <input
                type="text"
                value={chargeForm.description}
                onChange={(e) => setChargeForm({ ...chargeForm, description: e.target.value })}
                className="input"
                placeholder={chargeForm.type === 'discount' ? 'e.g., Weather refund' : 'e.g., Scratched frame'}
              />
            </div>

            <button
              onClick={handleChargeSubmit}
              disabled={!chargeForm.amount}
              className={`w-full py-3 rounded-lg font-medium ${
                chargeForm.type === 'charge'
                  ? 'bg-red-500 text-white'
                  : 'bg-green-500 text-white'
              }`}
            >
              {chargeForm.type === 'charge' ? 'Add Charge' : 'Apply Discount'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
