import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Check, X, AlertCircle } from 'lucide-react'
import BikeIcon from '../../components/icons/BikeIcon'

const API_URL = import.meta.env.VITE_API_URL || ''

export default function AdminBikes() {
  const [bikes, setBikes] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingBike, setEditingBike] = useState(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    type: 'adult',
    description: '',
    hourlyRate: '',
    halfDayRate: '',
    fullDayRate: '',
    imageUrl: '',
    isAvailable: true
  })

  useEffect(() => {
    fetchBikes()
  }, [])

  const fetchBikes = async () => {
    try {
      const res = await fetch(`${API_URL}/api/bikes/admin/all`, { credentials: 'include' })
      const data = await res.json()
      setBikes(data.bikes || [])
    } catch (err) {
      setError('Failed to load bikes')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setFormData({ ...formData, [e.target.name]: value })
  }

  const handleEdit = (bike) => {
    setEditingBike(bike.id)
    setFormData({
      name: bike.name,
      type: bike.type,
      description: bike.description || '',
      hourlyRate: bike.hourly_rate,
      halfDayRate: bike.half_day_rate,
      fullDayRate: bike.full_day_rate,
      imageUrl: bike.image_url || '',
      isAvailable: bike.is_available === 1
    })
  }

  const handleCancel = () => {
    setEditingBike(null)
    setShowAddForm(false)
    setFormData({
      name: '', type: 'adult', description: '',
      hourlyRate: '', halfDayRate: '', fullDayRate: '',
      imageUrl: '', isAvailable: true
    })
    setError('')
  }

  const handleSave = async () => {
    setError('')

    if (!formData.name || !formData.hourlyRate) {
      setError('Name and hourly rate are required')
      return
    }

    try {
      const url = editingBike ? `${API_URL}/api/bikes/${editingBike}` : `${API_URL}/api/bikes`
      const method = editingBike ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }

      fetchBikes()
      handleCancel()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this bike?')) return

    try {
      const res = await fetch(`${API_URL}/api/bikes/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }

      fetchBikes()
    } catch (err) {
      setError(err.message)
    }
  }

  const bikeTypes = [
    { value: 'adult', label: 'Adult' },
    { value: 'kids', label: 'Kids' },
    { value: 'tandem', label: 'Tandem' },
    { value: 'trailer', label: 'Trailer' }
  ]

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
        <h1 className="font-heading text-3xl">Manage Bikes</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Add Bike
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-3">
          <AlertCircle className="text-red-400" size={20} />
          <p className="text-red-200">{error}</p>
          <button onClick={() => setError('')} className="ml-auto text-red-400">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Add/Edit Form */}
      {(showAddForm || editingBike) && (
        <div className="card mb-6">
          <h2 className="font-semibold mb-4">
            {editingBike ? 'Edit Bike' : 'Add New Bike'}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input"
                placeholder="City Cruiser"
              />
            </div>
            <div>
              <label className="label">Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="input"
              >
                {bikeTypes.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="label">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="input min-h-20"
                placeholder="Great for casual rides..."
              />
            </div>
            <div>
              <label className="label">Hourly Rate ($)</label>
              <input
                type="number"
                name="hourlyRate"
                value={formData.hourlyRate}
                onChange={handleChange}
                className="input"
                step="0.01"
              />
            </div>
            <div>
              <label className="label">Half Day Rate ($)</label>
              <input
                type="number"
                name="halfDayRate"
                value={formData.halfDayRate}
                onChange={handleChange}
                className="input"
                step="0.01"
              />
            </div>
            <div>
              <label className="label">Full Day Rate ($)</label>
              <input
                type="number"
                name="fullDayRate"
                value={formData.fullDayRate}
                onChange={handleChange}
                className="input"
                step="0.01"
              />
            </div>
            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                name="isAvailable"
                checked={formData.isAvailable}
                onChange={handleChange}
                className="w-5 h-5"
              />
              <label>Available for rent</label>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={handleCancel} className="btn-secondary">
              Cancel
            </button>
            <button onClick={handleSave} className="btn-primary">
              {editingBike ? 'Save Changes' : 'Add Bike'}
            </button>
          </div>
        </div>
      )}

      {/* Bikes Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-bike-dark/50">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Bike</th>
                <th className="text-left p-4 text-sm font-medium text-gray-400">Type</th>
                <th className="text-right p-4 text-sm font-medium text-gray-400">Hourly</th>
                <th className="text-right p-4 text-sm font-medium text-gray-400">Half Day</th>
                <th className="text-right p-4 text-sm font-medium text-gray-400">Full Day</th>
                <th className="text-center p-4 text-sm font-medium text-gray-400">Status</th>
                <th className="text-right p-4 text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bike-gray/30">
              {bikes.map(bike => (
                <tr key={bike.id} className="hover:bg-bike-dark/30">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <BikeIcon
                        type={bike.type === 'adult' ? 'default' : bike.type}
                        className="w-10 h-6 text-bike-orange"
                      />
                      <div>
                        <p className="font-medium">{bike.name}</p>
                        <p className="text-sm text-gray-500 truncate max-w-48">
                          {bike.description}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 capitalize">{bike.type}</td>
                  <td className="p-4 text-right">${bike.hourly_rate}</td>
                  <td className="p-4 text-right">${bike.half_day_rate}</td>
                  <td className="p-4 text-right">${bike.full_day_rate}</td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      bike.is_available ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {bike.is_available ? 'Available' : 'Unavailable'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(bike)}
                        className="p-2 text-gray-400 hover:text-white"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(bike.id)}
                        className="p-2 text-gray-400 hover:text-red-400"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-sm text-gray-500 mt-4">
        Total: {bikes.length} bikes • {bikes.filter(b => b.is_available).length} available
      </p>
    </div>
  )
}
