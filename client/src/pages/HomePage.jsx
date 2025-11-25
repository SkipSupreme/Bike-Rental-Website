import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Clock, Phone, Star, ChevronRight, Shield, Bike } from 'lucide-react'
import GearIcon from '../components/icons/GearIcon'
import BikeIcon from '../components/icons/BikeIcon'

const API_URL = import.meta.env.VITE_API_URL || ''

export default function HomePage() {
  const [content, setContent] = useState({})
  const [reviews, setReviews] = useState({ reviews: [], stats: { averageRating: 0, totalReviews: 0 } })

  useEffect(() => {
    fetch(`${API_URL}/api/content`)
      .then(res => res.json())
      .then(data => setContent(data.content || {}))
      .catch(console.error)

    fetch(`${API_URL}/api/reviews`)
      .then(res => res.json())
      .then(data => setReviews(data))
      .catch(console.error)
  }, [])

  return (
    <div>
      {/* Hero Section */}
      <section className="relative gradient-hero min-h-[80vh] flex items-center overflow-hidden">
        {/* Animated gears background */}
        <div className="absolute inset-0 overflow-hidden opacity-10">
          <GearIcon className="absolute -top-20 -left-20 w-80 h-80 text-bike-orange gear-spin" />
          <GearIcon className="absolute top-1/3 -right-10 w-60 h-60 text-bike-accent gear-spin-reverse" />
          <GearIcon className="absolute -bottom-10 left-1/4 w-40 h-40 text-bike-orange gear-spin" />
        </div>

        <div className="container mx-auto px-4 py-16 relative z-10">
          <div className="max-w-2xl">
            <h1 className="font-heading text-4xl md:text-6xl mb-4 leading-tight">
              {content.hero?.title || "Joe's Garage"}
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8">
              {content.hero?.body || 'Bicycle Rental & Repair on the Bow River Pathway since 2007'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/rent" className="btn-primary text-center text-lg flex items-center justify-center gap-2">
                <Bike size={24} />
                Rent a Bike
              </Link>
              <Link to="/bikes" className="btn-secondary text-center text-lg">
                View Our Fleet
              </Link>
            </div>

            {/* Quick info badges */}
            <div className="flex flex-wrap gap-4 mt-8">
              <div className="flex items-center gap-2 bg-bike-gray/50 px-4 py-2 rounded-full text-sm">
                <Shield size={16} className="text-bike-orange" />
                Helmet & Lock Included
              </div>
              <div className="flex items-center gap-2 bg-bike-gray/50 px-4 py-2 rounded-full text-sm">
                <Clock size={16} className="text-bike-orange" />
                Open Daily 10-7
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bike Types Preview */}
      <section className="py-16 bg-bike-blue/30">
        <div className="container mx-auto px-4">
          <h2 className="font-heading text-3xl mb-8 text-center">Our Bikes</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { type: 'default', name: 'City Cruisers', desc: 'Comfortable rides' },
              { type: 'mountain', name: 'Mountain Bikes', desc: 'Trail ready' },
              { type: 'electric', name: 'E-Bikes', desc: 'Pedal assist' },
              { type: 'tandem', name: 'Tandems', desc: 'Ride together' },
            ].map((bike, i) => (
              <Link
                key={i}
                to="/bikes"
                className="card hover:border-bike-orange/50 transition-all group text-center"
              >
                <BikeIcon type={bike.type} className="w-20 h-12 mx-auto mb-3 text-bike-orange group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold">{bike.name}</h3>
                <p className="text-sm text-gray-400">{bike.desc}</p>
              </Link>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/bikes" className="text-bike-orange hover:text-orange-400 font-medium inline-flex items-center gap-1">
              See all bikes <ChevronRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="font-heading text-3xl mb-12 text-center">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Choose Your Bike', desc: 'Browse our selection and pick the perfect ride' },
              { step: '2', title: 'Sign the Waiver', desc: 'Quick digital signature for safety' },
              { step: '3', title: 'Pay Online', desc: 'Secure payment via Stripe' },
              { step: '4', title: 'Hit the Trail!', desc: 'Pick up your bike and enjoy!' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 rounded-full bg-bike-orange/20 border-2 border-bike-orange flex items-center justify-center mx-auto mb-4">
                  <span className="font-heading text-2xl text-bike-orange">{item.step}</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link to="/rent" className="btn-primary">
              Start Renting Now
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 bg-bike-blue/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-heading text-3xl mb-6">{content.about?.title || 'About Joe\'s Garage'}</h2>
            <p className="text-gray-300 whitespace-pre-line leading-relaxed">
              {content.about?.body || 'Located on the Bow River Pathway since 2007, Joe\'s Garage has been serving Calgary cyclists with quality bike rentals and repairs.'}
            </p>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      {reviews.stats.totalReviews > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="font-heading text-3xl mb-4">What Riders Say</h2>
              <div className="flex items-center justify-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star
                      key={star}
                      size={24}
                      className={star <= Math.round(reviews.stats.averageRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}
                    />
                  ))}
                </div>
                <span className="text-xl font-semibold">{reviews.stats.averageRating}</span>
                <span className="text-gray-400">({reviews.stats.totalReviews} reviews)</span>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {reviews.reviews.slice(0, 3).map(review => (
                <div key={review.id} className="card">
                  <div className="flex mb-3">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        size={16}
                        className={star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}
                      />
                    ))}
                  </div>
                  <p className="text-gray-300 text-sm mb-3">"{review.comment}"</p>
                  <p className="text-gray-500 text-sm">- {review.first_name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Location & Contact */}
      <section className="py-16 bg-bike-blue/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="font-heading text-3xl mb-6">
                <MapPin className="inline mr-2 text-bike-orange" />
                Find Us
              </h2>
              <div className="text-gray-300 whitespace-pre-line">
                {content.location?.body || '355 8 St SW, Calgary, AB\nBow River Pathway, near 10th Street LRT'}
              </div>
              <div className="mt-6">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2508.4!2d-114.08!3d51.045!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNTHCsDAyJzQyLjAiTiAxMTTCsDA0JzQ4LjAiVw!5e0!3m2!1sen!2sca!4v1"
                  width="100%"
                  height="200"
                  style={{ border: 0, borderRadius: '12px' }}
                  allowFullScreen=""
                  loading="lazy"
                  title="Joe's Garage Location"
                ></iframe>
              </div>
            </div>
            <div>
              <h2 className="font-heading text-3xl mb-6">
                <Phone className="inline mr-2 text-bike-orange" />
                Contact Joe
              </h2>
              <div className="text-gray-300 whitespace-pre-line">
                {content.contact?.body || 'Phone: (403) 874-5637\nEmail: joe@joesgarage.ca'}
              </div>
              <div className="mt-6 p-4 bg-bike-gray/30 rounded-lg border border-bike-orange/30">
                <p className="text-sm text-gray-300">
                  <strong className="text-bike-orange">Pro tip:</strong> For repairs, give Joe a call directly.
                  He's always happy to chat about your bike and get you rolling again!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-50"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <GearIcon className="w-20 h-20 mx-auto mb-6 text-bike-orange opacity-50" />
          <h2 className="font-heading text-3xl md:text-4xl mb-4">Ready to Ride?</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-xl mx-auto">
            Book your bike online and skip the paperwork. More time on the trail, less time waiting!
          </p>
          <Link to="/rent" className="btn-primary text-lg px-8">
            Book Your Bike Now
          </Link>
        </div>
      </section>
    </div>
  )
}
