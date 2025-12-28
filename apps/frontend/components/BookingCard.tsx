'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  Calendar,
  MapPin,
  Users,
  CreditCard,
  Star,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface BookingCardProps {
  booking: any
  showReviewButton?: boolean
}

export function BookingCard({
  booking,
  showReviewButton = false,
}: BookingCardProps) {
  const [showCancelModal, setShowCancelModal] = useState(false)

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return {
          icon: CheckCircle,
          color: 'text-green-500',
          bgColor: 'bg-green-500/20',
          borderColor: 'border-green-500/30',
          label: 'Confirmed',
        }
      case 'PENDING':
        return {
          icon: Clock,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500/20',
          borderColor: 'border-yellow-500/30',
          label: 'Pending',
        }
      case 'CANCELLED':
        return {
          icon: XCircle,
          color: 'text-red-500',
          bgColor: 'bg-red-500/20',
          borderColor: 'border-red-500/30',
          label: 'Cancelled',
        }
      default:
        return {
          icon: AlertCircle,
          color: 'text-gray-500',
          bgColor: 'bg-gray-500/20',
          borderColor: 'border-gray-500/30',
          label: status,
        }
    }
  }

  const statusInfo = getStatusInfo(booking.status)
  const StatusIcon = statusInfo.icon

  const formatDate = (date: string | Date) => {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const calculateNights = () => {
    const checkIn = new Date(booking.checkIn)
    const checkOut = new Date(booking.checkOut)
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const nights = calculateNights()
  const isPast = new Date(booking.checkOut) < new Date()
  const canCancel =
    booking.status === 'CONFIRMED' &&
    new Date(booking.checkIn) > new Date() &&
    !isPast

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl overflow-hidden hover:border-slate-600 transition-all">
      <div className="relative h-48">
        <img
          src={
            booking.room?.hotel?.imageUrl ||
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800'
          }
          alt={booking.room?.hotel?.name || 'Hotel'}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />

        {/* Status Badge */}
        <div
          className={`absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 ${statusInfo.bgColor} border ${statusInfo.borderColor} backdrop-blur-sm rounded-full`}
        >
          <StatusIcon className={`w-4 h-4 ${statusInfo.color}`} />
          <span className={`text-sm font-semibold ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        </div>

        {/* Hotel Name */}
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-xl font-bold text-white mb-1">
            {booking.room?.hotel?.name || 'Hotel'}
          </h3>
          <div className="flex items-center gap-2 text-gray-300 text-sm">
            <MapPin className="w-4 h-4" />
            <span>{booking.room?.hotel?.address || 'Address'}</span>
          </div>
        </div>
      </div>

      <div className="p-5">
        {/* Room & Booking Info */}
        <div className="mb-4">
          <p className="text-lg font-semibold text-white mb-2">
            {booking.room?.name || 'Room'}
          </p>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-gray-300">
              <Calendar className="w-4 h-4 text-orange-500" />
              <div>
                <p className="font-medium">Check-in</p>
                <p>{formatDate(booking.checkIn)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-gray-300">
              <Calendar className="w-4 h-4 text-orange-500" />
              <div>
                <p className="font-medium">Check-out</p>
                <p>{formatDate(booking.checkOut)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-gray-300">
              <Users className="w-4 h-4 text-orange-500" />
              <span>
                {booking.guests || 1} Guest{booking.guests !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="flex items-center gap-2 text-gray-300">
              <Clock className="w-4 h-4 text-orange-500" />
              <span>
                {nights} Night{nights !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between py-3 border-t border-slate-700">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-orange-500" />
            <span className="text-gray-400">Total Price</span>
          </div>
          <span className="text-2xl font-bold text-white">
            ₦{booking.totalPrice.toLocaleString()}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-4">
          <Link
            href={`/bookings/${booking.id}`}
            className="flex-1 px-4 py-2.5 bg-slate-700 text-white rounded-lg font-semibold hover:bg-slate-600 transition-colors text-center"
          >
            View Details
          </Link>

          {showReviewButton && !booking.review && (
            <Link
              href={`/hotels/${booking.room?.hotelId}/review?bookingId=${booking.id}`}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition-all text-center flex items-center justify-center gap-2"
            >
              <Star className="w-4 h-4" />
              Leave Review
            </Link>
          )}

          {canCancel && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="px-4 py-2.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg font-semibold hover:bg-red-500/30 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Cancel Modal (simplified - would need full implementation) */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowCancelModal(false)}
          />
          <div className="relative bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-700">
            <h3 className="text-xl font-bold text-white mb-4">
              Cancel Booking?
            </h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to cancel this booking? This action cannot
              be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg font-semibold hover:bg-slate-600 transition-colors"
              >
                Keep Booking
              </button>
              <button
                onClick={() => {
                  // Handle cancellation
                  setShowCancelModal(false)
                }}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
