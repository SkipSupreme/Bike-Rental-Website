import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Info } from 'lucide-react'
import BikeIcon from '../components/icons/BikeIcon'

export default function BikesPage() {
  const [bikes, setBikes] = useState({ grouped: {} })
  const [selectedType, setSelectedType] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/bikes')
      .then(res => res.json())
      .then(data => {
        setBikes(data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [])

  const typeLabels = {
    adult: 'Adult Bikes',
    kids: 'Kids Bikes',
    tandem: 'Tandem Bikes',
    trailer: 'Trailers'
  }

  const typeIcons = {
    adult: 'default',
    kids: 'kids',
    tandem: 'tandem',
    trailer: 'trailer'
  }

  const getUniqueByName = (bikeList) => {
    const seen = new Map()
    bikeList.forEach(bike => {
      // Get base name without #number suffix
      const baseName = bike.name.replace(/ #\d+$/, '')
      if (!seen.has(baseName)) {
        seen.set(baseName, { ...bike, baseName, count: 1 })
      } else {
        seen.get(baseName).count++
      }
    })
    return Array.from(seen.values())
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    )
  }

  const filteredBikes = selectedType === 'all'
    ? Object.entries(bikes.grouped)
    : [[selectedType, bikes.grouped[selectedType] || []]]

  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="font-heading text-4xl mb-4">Our Bike Fleet</h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            From casual cruisers to mountain bikes, we've got the perfect ride for your adventure.
            All rentals include a helmet and lock.
          </p>
        </div>

        {/* Type Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedType === 'all'
                ? 'bg-bike-orange text-white'
                : 'bg-bike-gray/50 text-gray-300 hover:bg-bike-gray'
            }`}
          >
            All Bikes
          </button>
          {Object.keys(typeLabels).map(type => (
            bikes.grouped[type]?.length > 0 && (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedType === type
                    ? 'bg-bike-orange text-white'
                    : 'bg-bike-gray/50 text-gray-300 hover:bg-bike-gray'
                }`}
              >
                {typeLabels[type]}
              </button>
            )
          ))}
        </div>

        {/* Bikes Grid */}
        {filteredBikes.map(([type, bikeList]) => {
          if (!bikeList || bikeList.length === 0) return null
          const uniqueBikes = getUniqueByName(bikeList)

          return (
            <div key={type} className="mb-12">
              <h2 className="font-heading text-2xl mb-6 flex items-center gap-3">
                <BikeIcon type={typeIcons[type] || 'default'} className="w-10 h-6 text-bike-orange" />
                {typeLabels[type] || type}
                <span className="text-sm font-normal text-gray-500">
                  ({bikeList.length} available)
                </span>
              </h2>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {uniqueBikes.map(bike => (
                  <div
                    key={bike.id}
                    className="card hover:border-bike-orange/50 transition-all"
                  >
                    <div className="flex justify-center mb-4 py-4 bg-bike-dark/50 rounded-lg">
                      <BikeIcon
                        type={bike.name.toLowerCase().includes('mountain') ? 'mountain' :
                              bike.name.toLowerCase().includes('road') ? 'road' :
                              bike.name.toLowerCase().includes('electric') ? 'electric' :
                              bike.name.toLowerCase().includes('tandem') ? 'tandem' :
                              bike.name.toLowerCase().includes('trailer') ? 'trailer' :
                              bike.name.toLowerCase().includes('kid') ? 'kids' : 'default'}
                        className="w-32 h-20 text-bike-orange"
                      />
                    </div>

                    <h3 className="font-semibold text-lg mb-2">{bike.baseName}</h3>
                    <p className="text-gray-400 text-sm mb-4">{bike.description}</p>

                    {bike.count > 1 && (
                      <p className="text-xs text-bike-orange mb-3">
                        {bike.count} units available
                      </p>
                    )}

                    <div className="border-t border-bike-gray/50 pt-4 mt-auto">
                      <div className="grid grid-cols-3 gap-2 text-center text-sm">
                        <div>
                          <p className="text-gray-500">Hourly</p>
                          <p className="font-semibold text-bike-orange">${bike.hourly_rate}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Half Day</p>
                          <p className="font-semibold">${bike.half_day_rate}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Full Day</p>
                          <p className="font-semibold">${bike.full_day_rate}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {/* Info Box */}
        <div className="max-w-2xl mx-auto mt-12">
          <div className="card bg-bike-orange/10 border-bike-orange/30">
            <div className="flex gap-4">
              <Info className="text-bike-orange flex-shrink-0" size={24} />
              <div>
                <h3 className="font-semibold mb-2">What's Included</h3>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li>• Helmet (required for all riders)</li>
                  <li>• Lock for securing your bike</li>
                  <li>• Basic bike adjustment before you ride</li>
                  <li>• Trail map of the Bow River Pathway</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link to="/rent" className="btn-primary text-lg">
            Book Your Bike Now
          </Link>
        </div>
      </div>
    </div>
  )
}
