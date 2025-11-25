import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { DollarSign, Users, Calendar, Bike, Clock, ChevronRight } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || ''

export default function AdminDashboard() {
  const [data, setData] = useState({
    stats: { todayRentals: 0, activeRentals: 0, weekRevenue: 0, totalCustomers: 0 },
    recentRentals: [],
    upcomingRentals: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API_URL}/api/admin/dashboard`, { credentials: 'include' })
      .then(res => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const statCards = [
    {
      label: "Today's Rentals",
      value: data.stats.todayRentals,
      icon: Calendar,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10'
    },
    {
      label: 'Active Now',
      value: data.stats.activeRentals,
      icon: Bike,
      color: 'text-green-400',
      bg: 'bg-green-400/10'
    },
    {
      label: 'Week Revenue',
      value: `$${data.stats.weekRevenue?.toFixed(0) || 0}`,
      icon: DollarSign,
      color: 'text-bike-orange',
      bg: 'bg-bike-orange/10'
    },
    {
      label: 'Total Customers',
      value: data.stats.totalCustomers,
      icon: Users,
      color: 'text-purple-400',
      bg: 'bg-purple-400/10'
    }
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
      <h1 className="font-heading text-3xl mb-6">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, i) => (
          <div key={i} className="card">
            <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
              <stat.icon className={stat.color} size={20} />
            </div>
            <p className="text-2xl font-semibold">{stat.value}</p>
            <p className="text-sm text-gray-400">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Upcoming Rentals */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Clock className="text-bike-orange" size={18} />
              Upcoming (24h)
            </h2>
            <Link to="/admin/rentals" className="text-bike-orange text-sm">
              View All
            </Link>
          </div>

          {data.upcomingRentals.length === 0 ? (
            <p className="text-gray-500 text-sm py-4">No upcoming rentals</p>
          ) : (
            <div className="space-y-3">
              {data.upcomingRentals.slice(0, 5).map(rental => (
                <div
                  key={rental.id}
                  className="flex items-center gap-3 p-3 bg-bike-dark/50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {rental.first_name} {rental.last_name}
                    </p>
                    <p className="text-sm text-gray-400 truncate">
                      {rental.bike_name}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-bike-orange">
                      {new Date(rental.start_time).toLocaleTimeString('en-US', {
                        hour: 'numeric', minute: '2-digit'
                      })}
                    </p>
                    <p className="text-gray-500">{rental.phone}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Rentals */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Calendar className="text-bike-orange" size={18} />
              Recent Rentals
            </h2>
            <Link to="/admin/rentals" className="text-bike-orange text-sm">
              View All
            </Link>
          </div>

          {data.recentRentals.length === 0 ? (
            <p className="text-gray-500 text-sm py-4">No recent rentals</p>
          ) : (
            <div className="space-y-3">
              {data.recentRentals.slice(0, 5).map(rental => (
                <div
                  key={rental.id}
                  className="flex items-center gap-3 p-3 bg-bike-dark/50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {rental.first_name} {rental.last_name}
                    </p>
                    <p className="text-sm text-gray-400 truncate">
                      {rental.bike_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      rental.status === 'completed' ? 'bg-gray-500/20 text-gray-400' :
                      rental.status === 'active' ? 'bg-green-500/20 text-green-400' :
                      rental.status === 'confirmed' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {rental.status}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">
                      ${rental.total_amount?.toFixed(0)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <Link
          to="/admin/rentals"
          className="card hover:border-bike-orange/50 transition-colors flex items-center gap-3"
        >
          <Calendar className="text-bike-orange" size={24} />
          <div>
            <p className="font-medium">Rentals</p>
            <p className="text-sm text-gray-400">Manage bookings</p>
          </div>
          <ChevronRight className="ml-auto text-gray-500" size={20} />
        </Link>

        <Link
          to="/admin/bikes"
          className="card hover:border-bike-orange/50 transition-colors flex items-center gap-3"
        >
          <Bike className="text-bike-orange" size={24} />
          <div>
            <p className="font-medium">Bikes</p>
            <p className="text-sm text-gray-400">Manage fleet</p>
          </div>
          <ChevronRight className="ml-auto text-gray-500" size={20} />
        </Link>

        <Link
          to="/admin/customers"
          className="card hover:border-bike-orange/50 transition-colors flex items-center gap-3"
        >
          <Users className="text-bike-orange" size={24} />
          <div>
            <p className="font-medium">Customers</p>
            <p className="text-sm text-gray-400">View profiles</p>
          </div>
          <ChevronRight className="ml-auto text-gray-500" size={20} />
        </Link>

        <Link
          to="/admin/content"
          className="card hover:border-bike-orange/50 transition-colors flex items-center gap-3"
        >
          <DollarSign className="text-bike-orange" size={24} />
          <div>
            <p className="font-medium">Content</p>
            <p className="text-sm text-gray-400">Edit website</p>
          </div>
          <ChevronRight className="ml-auto text-gray-500" size={20} />
        </Link>
      </div>
    </div>
  )
}
