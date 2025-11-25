import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { FileText, Check, AlertCircle, Trash2 } from 'lucide-react'

export default function WaiverPage() {
  const [waiver, setWaiver] = useState(null)
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hasDrawn, setHasDrawn] = useState(false)

  const canvasRef = useRef(null)
  const isDrawing = useRef(false)

  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const returnTo = location.state?.returnTo || '/rent'

  useEffect(() => {
    // Fetch waiver content
    fetch('/api/waiver')
      .then(res => res.json())
      .then(data => setWaiver(data.waiver))
      .catch(console.error)

    // If already signed, redirect
    if (user?.waiverSigned) {
      navigate(returnTo)
    }
  }, [user])

  // Canvas setup
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')

    // Set canvas size
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
      ctx.strokeStyle = '#000'
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    return () => window.removeEventListener('resize', resizeCanvas)
  }, [])

  const getPos = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()

    if (e.touches) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      }
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  }

  const startDrawing = (e) => {
    e.preventDefault()
    isDrawing.current = true
    const { x, y } = getPos(e)
    const ctx = canvasRef.current.getContext('2d')
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e) => {
    if (!isDrawing.current) return
    e.preventDefault()
    const { x, y } = getPos(e)
    const ctx = canvasRef.current.getContext('2d')
    ctx.lineTo(x, y)
    ctx.stroke()
    setHasDrawn(true)
  }

  const stopDrawing = () => {
    isDrawing.current = false
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasDrawn(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!agreed) {
      setError('Please agree to the waiver terms')
      return
    }

    if (!hasDrawn) {
      setError('Please sign the waiver')
      return
    }

    setLoading(true)
    setError('')

    try {
      const signature = canvasRef.current.toDataURL('image/png')

      const res = await fetch('/api/waiver/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          signature,
          agreedToTerms: agreed
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      await refreshUser()
      navigate(returnTo)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="py-8 min-h-screen">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-8">
          <FileText className="w-12 h-12 mx-auto text-bike-orange mb-4" />
          <h1 className="font-heading text-3xl mb-2">Rental Waiver</h1>
          <p className="text-gray-400">Please read and sign before renting</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-3">
            <AlertCircle className="text-red-400 flex-shrink-0" size={20} />
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Waiver Content */}
          <div className="card mb-6">
            <h2 className="text-lg font-semibold mb-4 text-bike-orange">
              {waiver?.title || 'Rental Agreement & Liability Waiver'}
            </h2>
            <div className="max-h-64 overflow-y-auto pr-2 text-sm text-gray-300 whitespace-pre-line leading-relaxed">
              {waiver?.body || 'Loading waiver content...'}
            </div>
          </div>

          {/* Agreement Checkbox */}
          <div className="card mb-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-6 h-6 rounded border-bike-gray bg-bike-dark text-bike-orange focus:ring-bike-orange mt-0.5"
              />
              <span className="text-sm text-gray-300">
                I have read and agree to the rental agreement and liability waiver above.
                I understand that I am responsible for any damage or loss of rented equipment.
              </span>
            </label>
          </div>

          {/* Signature Pad */}
          <div className="card mb-6">
            <div className="flex justify-between items-center mb-3">
              <label className="label mb-0">Your Signature</label>
              {hasDrawn && (
                <button
                  type="button"
                  onClick={clearSignature}
                  className="text-sm text-gray-400 hover:text-red-400 flex items-center gap-1"
                >
                  <Trash2 size={16} />
                  Clear
                </button>
              )}
            </div>
            <div className="relative">
              <canvas
                ref={canvasRef}
                className="signature-pad w-full h-40"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              {!hasDrawn && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-gray-400 text-sm">Sign here</span>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Draw your signature using your mouse or finger
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !agreed || !hasDrawn}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              'Submitting...'
            ) : (
              <>
                <Check size={20} />
                Sign Waiver & Continue
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
