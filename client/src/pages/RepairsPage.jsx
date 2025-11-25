import { useState, useEffect } from 'react'
import { Phone, Wrench, Clock, Star, MessageCircle } from 'lucide-react'
import GearIcon from '../components/icons/GearIcon'

export default function RepairsPage() {
  const [content, setContent] = useState({})

  useEffect(() => {
    fetch('/api/content')
      .then(res => res.json())
      .then(data => setContent(data.content || {}))
      .catch(console.error)
  }, [])

  return (
    <div className="py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="relative inline-block mb-6">
            <GearIcon className="w-20 h-20 text-bike-orange gear-spin" />
            <Wrench className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-white" />
          </div>
          <h1 className="font-heading text-4xl mb-4">Bike Repairs</h1>
          <p className="text-xl text-gray-400">
            30+ years of experience keeping Calgary rolling
          </p>
        </div>

        {/* Main Content */}
        <div className="card mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-bike-orange">
            {content.repairs?.title || 'Expert Repairs by Joe'}
          </h2>
          <p className="text-gray-300 whitespace-pre-line leading-relaxed">
            {content.repairs?.body ||
              `Joe is Calgary's most trusted bike mechanic! With over 30 years of experience, he's known for going above and beyond for every customer.

For repair appointments, please call Joe directly at (403) 874-5637. He'll get your bike rolling smoothly again!`}
          </p>
        </div>

        {/* Why Call Joe */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="card">
            <Star className="text-bike-orange mb-3" size={32} />
            <h3 className="text-lg font-semibold mb-2">Fix, Don't Replace</h3>
            <p className="text-gray-400 text-sm">
              Joe is famous for repairing parts instead of replacing them unnecessarily.
              He'll save you money and reduce waste.
            </p>
          </div>
          <div className="card">
            <Clock className="text-bike-orange mb-3" size={32} />
            <h3 className="text-lg font-semibold mb-2">Quick Turnaround</h3>
            <p className="text-gray-400 text-sm">
              Most repairs are completed same-day. Joe works efficiently to get you
              back on the trail as fast as possible.
            </p>
          </div>
          <div className="card">
            <MessageCircle className="text-bike-orange mb-3" size={32} />
            <h3 className="text-lg font-semibold mb-2">Personal Service</h3>
            <p className="text-gray-400 text-sm">
              Joe takes time to explain what's happening with your bike and teaches
              you how to maintain it yourself.
            </p>
          </div>
          <div className="card">
            <Wrench className="text-bike-orange mb-3" size={32} />
            <h3 className="text-lg font-semibold mb-2">All Bikes Welcome</h3>
            <p className="text-gray-400 text-sm">
              From vintage cruisers to modern e-bikes, Joe has the skills and
              parts to fix just about anything.
            </p>
          </div>
        </div>

        {/* Contact Card */}
        <div className="card bg-gradient-to-r from-bike-orange/20 to-bike-accent/10 border-bike-orange/30">
          <div className="text-center">
            <Phone className="w-12 h-12 mx-auto mb-4 text-bike-orange" />
            <h2 className="text-2xl font-semibold mb-2">Ready to Book a Repair?</h2>
            <p className="text-gray-300 mb-6 max-w-lg mx-auto">
              Joe is often busy helping other cyclists, so calling is the best way to
              schedule your repair. He'll give you an honest quote and timeline.
            </p>
            <a
              href="tel:+14038745637"
              className="btn-primary text-lg inline-flex items-center gap-2"
            >
              <Phone size={20} />
              Call (403) 874-5637
            </a>
            <p className="text-gray-500 text-sm mt-4">
              Open Daily 10 AM - 7 PM • Weather Permitting
            </p>
          </div>
        </div>

        {/* Location Info */}
        <div className="mt-8 text-center text-gray-400">
          <p>
            <strong className="text-white">Find Joe at:</strong><br />
            355 8 St SW, Calgary, AB<br />
            Bow River Pathway, near 10th Street LRT bridge
          </p>
        </div>
      </div>
    </div>
  )
}
