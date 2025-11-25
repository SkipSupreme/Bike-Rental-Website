import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Calendar, Clock, AlertCircle, Check } from 'lucide-react'
import BikeIcon from '../components/icons/BikeIcon'

const API_URL = import.meta.env.VITE_API_URL || ''

export default function RentPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [bikes, setBikes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [rentalType, setRentalType] = useState('hourly')
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [duration, setDuration] = useState(1)
  const [selectedBike, setSelectedBike] = useState(null)
  const [bikeType, setBikeType] = useState('all')

  // Generate 30-minute time slots from 10:00 AM to 6:00 PM
  const timeSlots = []
  for (let hour = 10; hour <= 18; hour++) {
    for (let min = 0; min < 60; min += 30) {
      if (hour === 18 && min > 0) break // Stop at 6:00 PM
      const h = hour.toString().padStart(2, '0')
      const m = min.toString().padStart(2, '0')
      const label = `${hour > 12 ? hour - 12 : hour}:${m} ${hour >= 12 ? 'PM' : 'AM'}`
      timeSlots.push({ value: `${h}:${m}`, label })
    }
  }

  // Calculate end time based on rental type and duration
  const getEndTime = () => {
    if (!startDate || !startTime) return null
    const start = new Date(`${startDate}T${startTime}`)

    switch (rentalType) {
      case 'hourly':
        return new Date(start.getTime() + duration * 60 * 60 * 1000)
      case 'half_day':
        return new Date(start.getTime() + 4 * 60 * 60 * 1000)
      case 'full_day':
        return new Date(start.getTime() + 8 * 60 * 60 * 1000)
      case 'all_day':
        // All day: 10 AM to 7 PM (9 hours)
        const endTime = new Date(start)
        endTime.setHours(19, 0, 0, 0)
        return endTime
      default:
        return null
    }
  }

  // Auto-set start time to 10:00 for all-day rentals
  useEffect(() => {
    if (rentalType === 'all_day' && startTime !== '10:00') {
      setStartTime('10:00')
    }
  }, [rentalType])

  // Check availability when time changes
  useEffect(() => {
    if (startDate && startTime && step === 2) {
      checkAvailability()
    }
  }, [startDate, startTime, duration, rentalType, bikeType])

  const checkAvailability = async () => {
    const endTime = getEndTime()
    if (!endTime) return

    setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams({
        start: new Date(`${startDate}T${startTime}`).toISOString(),
        end: endTime.toISOString(),
        type: bikeType
      })

      const res = await fetch(`${API_URL}/api/bikes/available?${params}`)
      const data = await res.json()
      setBikes(data.bikes || [])
    } catch (err) {
      setError('Failed to check availability')
    } finally {
      setLoading(false)
    }
  }

  const handleTimeSubmit = (e) => {
    e.preventDefault()
    if (!startDate || !startTime) {
      setError('Please select a date and time')
      return
    }
    setStep(2)
    checkAvailability()
  }

  const handleBikeSelect = (bike) => {
    setSelectedBike(bike)
    setStep(3)
  }

  const handleConfirm = async () => {
    if (!user) {
      navigate('/login', { state: { from: '/rent' } })
      return
    }

    if (!user.waiverSigned) {
      navigate('/waiver', { state: { returnTo: '/rent' } })
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch(`${API_URL}/api/rentals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          bikeId: selectedBike.id,
          startTime: new Date(`${startDate}T${startTime}`).toISOString(),
          endTime: getEndTime().toISOString(),
          rentalType
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      navigate(`/payment/${data.rental.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const calculatePrice = () => {
    if (!selectedBike) return 0
    switch (rentalType) {
      case 'hourly':
        return selectedBike.hourly_rate * duration
      case 'half_day':
        return selectedBike.half_day_rate
      case 'full_day':
        return selectedBike.full_day_rate
      case 'all_day':
        // All day is full day rate + 20% premium
        return Math.round(selectedBike.full_day_rate * 1.2)
      default:
        return 0
    }
  }

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="py-8 min-h-screen">
      <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="font-heading text-3xl mb-8 text-center">Rent a Bike</h1>

        {/* Progress Steps */}
        <div className="flex justify-center mb-10">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step >= s ? 'bg-bike-orange text-white' : 'bg-bike-gray text-gray-400'
                }`}>
                  {step > s ? <Check size={20} /> : s}
                </div>
                {s < 3 && (
                  <div className={`w-12 h-1 mx-1 ${
                    step > s ? 'bg-bike-orange' : 'bg-bike-gray'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-3">
            <AlertCircle className="text-red-400" size={20} />
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {/* Step 1: Select Time */}
        {step === 1 && (
          <div className="card">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Calendar className="text-bike-orange" />
              When do you want to ride?
            </h2>

            <form onSubmit={handleTimeSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    min={today}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Start Time</label>
                  <select
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="input"
                    required
                  >
                    <option value="">Select time</option>
                    {timeSlots.map(slot => (
                      <option key={slot.value} value={slot.value}>{slot.label}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Open 10 AM - 7 PM</p>
                </div>
              </div>

              <div>
                <label className="label">Rental Type</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { value: 'hourly', label: 'Hourly' },
                    { value: 'half_day', label: 'Half Day (4h)' },
                    { value: 'full_day', label: 'Full Day (8h)' },
                    { value: 'all_day', label: 'All Day (10-7)' }
                  ].map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setRentalType(option.value)}
                      className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                        rentalType === option.value
                          ? 'border-bike-orange bg-bike-orange/20 text-white'
                          : 'border-bike-gray bg-bike-dark text-gray-300 hover:border-gray-500'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {rentalType === 'hourly' && (
                <div>
                  <label className="label">Duration (hours)</label>
                  <select
                    value={duration}
                    onChange={e => setDuration(parseInt(e.target.value))}
                    className="input"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(h => (
                      <option key={h} value={h}>{h} hour{h > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              )}

              <button type="submit" className="btn-primary w-full">
                Check Availability
              </button>
            </form>
          </div>
        )}

        {/* Step 2: Select Bike */}
        {step === 2 && (
          <div className="card">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Clock className="text-bike-orange" />
                  Choose Your Bike
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  {new Date(`${startDate}T${startTime}`).toLocaleDateString('en-US', {
                    weekday: 'short', month: 'short', day: 'numeric'
                  })} at {startTime} • {rentalType === 'hourly' ? `${duration}h` : rentalType.replace('_', ' ')}
                </p>
              </div>
              <button
                onClick={() => setStep(1)}
                className="text-sm text-bike-orange hover:text-orange-400"
              >
                Change time
              </button>
            </div>

            {/* Bike type filter */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {['all', 'adult', 'kids', 'tandem', 'trailer'].map(type => (
                <button
                  key={type}
                  onClick={() => setBikeType(type)}
                  className={`px-4 py-2 rounded-full text-sm whitespace-nowrap ${
                    bikeType === type
                      ? 'bg-bike-orange text-white'
                      : 'bg-bike-gray/50 text-gray-300'
                  }`}
                >
                  {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="spinner mx-auto"></div>
              </div>
            ) : bikes.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p>No bikes available for this time slot.</p>
                <button
                  onClick={() => setStep(1)}
                  className="text-bike-orange mt-2"
                >
                  Try a different time
                </button>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {bikes.map(bike => (
                  <button
                    key={bike.id}
                    onClick={() => handleBikeSelect(bike)}
                    className="w-full p-4 rounded-lg border border-bike-gray/50 hover:border-bike-orange bg-bike-dark/50 flex items-center gap-4 text-left transition-all"
                  >
                    <BikeIcon
                      type={bike.type === 'adult' ? 'default' : bike.type}
                      className="w-16 h-10 text-bike-orange flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{bike.name}</h3>
                      <p className="text-sm text-gray-400 truncate">{bike.description}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-bike-orange font-semibold">
                        ${rentalType === 'hourly' ? bike.hourly_rate * duration :
                          rentalType === 'half_day' ? bike.half_day_rate :
                          rentalType === 'all_day' ? Math.round(bike.full_day_rate * 1.2) : bike.full_day_rate}
                      </p>
                      <p className="text-xs text-gray-500">
                        {rentalType === 'hourly' ? `$${bike.hourly_rate}/hr` : ''}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && selectedBike && (
          <div className="card">
            <h2 className="text-xl font-semibold mb-6">Confirm Your Rental</h2>

            <div className="bg-bike-dark/50 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-4 mb-4">
                <BikeIcon
                  type={selectedBike.type === 'adult' ? 'default' : selectedBike.type}
                  className="w-20 h-12 text-bike-orange"
                />
                <div>
                  <h3 className="font-semibold text-lg">{selectedBike.name}</h3>
                  <p className="text-sm text-gray-400">{selectedBike.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Date</p>
                  <p className="font-medium">
                    {new Date(`${startDate}T${startTime}`).toLocaleDateString('en-US', {
                      weekday: 'long', month: 'long', day: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Time</p>
                  <p className="font-medium">
                    {startTime} - {getEndTime()?.toLocaleTimeString('en-US', {
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Duration</p>
                  <p className="font-medium">
                    {rentalType === 'hourly' ? `${duration} hour${duration > 1 ? 's' : ''}` :
                     rentalType === 'half_day' ? '4 hours (half day)' :
                     rentalType === 'all_day' ? 'All Day (10 AM - 7 PM)' : '8 hours (full day)'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Includes</p>
                  <p className="font-medium">Helmet & Lock</p>
                </div>
              </div>
            </div>

            <div className="border-t border-bike-gray/50 pt-4 mb-6">
              <div className="flex justify-between text-lg">
                <span>Total</span>
                <span className="font-semibold text-bike-orange">${calculatePrice().toFixed(2)} CAD</span>
              </div>
            </div>

            {!user && (
              <div className="mb-6 p-4 bg-bike-orange/10 border border-bike-orange/30 rounded-lg">
                <p className="text-sm">
                  You'll need to sign in or create an account to complete your booking.
                </p>
              </div>
            )}

            {user && !user.waiverSigned && (
              <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-sm text-yellow-200">
                  You'll need to sign our waiver before completing your rental.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="btn-secondary flex-1"
              >
                Back
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="btn-primary flex-1"
              >
                {loading ? 'Processing...' : !user ? 'Sign In to Continue' : !user.waiverSigned ? 'Sign Waiver' : 'Proceed to Payment'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
