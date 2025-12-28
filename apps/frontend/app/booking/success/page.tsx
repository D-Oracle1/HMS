'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  CheckCircle,
  Calendar,
  MapPin,
  Users,
  CreditCard,
  Download,
  Mail,
  Loader2,
  Home,
} from 'lucide-react'
import Confetti from 'react-confetti'

function SuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showConfetti, setShowConfetti] = useState(true)
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })

  const reference = searchParams.get('reference')
  const bookingId = searchParams.get('bookingId')

  useEffect(() => {
    // Set window size for confetti
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    })

    // Stop confetti after 5 seconds
    const timer = setTimeout(() => setShowConfetti(false), 5000)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!reference && !bookingId) {
      router.push('/dashboard')
      return
    }

    fetchBooking()
  }, [reference, bookingId])

  const fetchBooking = async () => {
    try {
      const params = new URLSearchParams()
      if (bookingId) params.set('bookingId', bookingId)
      if (reference) params.set('reference', reference)

      const response = await fetch(`/api/bookings?${params.toString()}`)
      const data = await response.json()

      if (data.booking) {
        setBooking(data.booking)
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Error fetching booking:', error)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: string | Date) => {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const calculateNights = () => {
    if (!booking) return 0
    const checkIn = new Date(booking.checkIn)
    const checkOut = new Date(booking.checkOut)
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Confirming your booking...</p>
        </div>
      </div>
    )
  }

  if (!booking) {
    return null
  }

  const nights = calculateNights()

  return (
    <div className="min-h-screen bg-slate-900 py-12">
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={500}
        />
      )}

      <div className="container mx-auto px-4 max-w-4xl">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mb-6 animate-bounce">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Booking Confirmed!
          </h1>
          <p className="text-xl text-gray-300 mb-2">
            Your reservation has been successfully confirmed
          </p>
          <p className="text-gray-400">
            Confirmation sent to{' '}
            <span className="text-orange-500 font-semibold">
              {booking.guestEmail}
            </span>
          </p>
        </div>

        {/* Booking Details Card */}
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl overflow-hidden mb-6">
          {/* Hotel Image */}
          <div className="relative h-64">
            <img
              src={
                booking.room?.hotel?.imageUrl ||
                'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800'
              }
              alt={booking.room?.hotel?.name || 'Hotel'}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />

            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h2 className="text-3xl font-bold text-white mb-2">
                {booking.room?.hotel?.name || 'Hotel'}
              </h2>
              <div className="flex items-center gap-2 text-gray-200">
                <MapPin className="w-5 h-5" />
                <span>{booking.room?.hotel?.address || 'Address'}</span>
              </div>
            </div>
          </div>

          {/* Booking Info */}
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Check-in */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Check-in</p>
                  <p className="text-lg font-semibold text-white">
                    {formatDate(booking.checkIn)}
                  </p>
                  <p className="text-sm text-gray-400">
                    {booking.room?.hotel?.checkInTime || '14:00'}
                  </p>
                </div>
              </div>

              {/* Check-out */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Check-out</p>
                  <p className="text-lg font-semibold text-white">
                    {formatDate(booking.checkOut)}
                  </p>
                  <p className="text-sm text-gray-400">
                    {booking.room?.hotel?.checkOutTime || '11:00'}
                  </p>
                </div>
              </div>

              {/* Room */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Home className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Room</p>
                  <p className="text-lg font-semibold text-white">
                    {booking.room?.name || 'Room'}
                  </p>
                  <p className="text-sm text-gray-400">
                    {nights} night{nights !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Guests */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Users className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Guests</p>
                  <p className="text-lg font-semibold text-white">
                    {booking.guests || 1} Guest{booking.guests !== 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-gray-400">{booking.guestName}</p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-700 my-6" />

            {/* Payment Info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Paid</p>
                  <p className="text-3xl font-bold text-white">
                    ₦{booking.totalPrice.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-sm text-gray-400 mb-1">Booking ID</p>
                <p className="text-sm font-mono text-white bg-slate-700 px-3 py-1 rounded">
                  {booking.id.slice(0, 8).toUpperCase()}
                </p>
              </div>
            </div>

            {/* Special Requests */}
            {booking.specialRequests && (
              <>
                <div className="border-t border-slate-700 my-6" />
                <div>
                  <p className="text-sm text-gray-400 mb-2">Special Requests</p>
                  <p className="text-white">{booking.specialRequests}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button className="flex items-center justify-center gap-2 px-6 py-4 bg-slate-800 text-white rounded-xl border border-slate-700 hover:bg-slate-700 transition-colors">
            <Download className="w-5 h-5" />
            <span>Download Receipt</span>
          </button>

          <button className="flex items-center justify-center gap-2 px-6 py-4 bg-slate-800 text-white rounded-xl border border-slate-700 hover:bg-slate-700 transition-colors">
            <Mail className="w-5 h-5" />
            <span>Email Confirmation</span>
          </button>

          <Link
            href={`/hotels/${booking.room?.hotelId}`}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-slate-800 text-white rounded-xl border border-slate-700 hover:bg-slate-700 transition-colors"
          >
            <MapPin className="w-5 h-5" />
            <span>View on Map</span>
          </Link>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6 mb-6">
          <h3 className="text-xl font-bold text-white mb-4">What's Next?</h3>
          <ul className="space-y-3 text-gray-300">
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <span>
                A confirmation email has been sent to your email address
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <span>
                Present your booking ID at check-in or show the confirmation
                email
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <span>
                You can view or manage this booking from your dashboard
              </span>
            </li>
          </ul>
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/dashboard"
            className="flex-1 px-6 py-4 bg-slate-800 text-white rounded-xl border border-slate-700 hover:bg-slate-700 transition-colors text-center font-semibold"
          >
            View My Bookings
          </Link>
          <Link
            href="/"
            className="flex-1 px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all text-center font-semibold shadow-lg shadow-orange-500/30"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function BookingSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  )
}
