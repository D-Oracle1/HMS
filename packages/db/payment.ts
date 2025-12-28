import { prisma } from './index'
import { logAudit, AuditAction } from './auditLog'
import { checkAvailability, lockRoom, releaseRoom } from './availability'
import { sendEmail } from './emailService'
import {
  notifyBookingConfirmed,
  notifyPaymentSuccess,
  notifyRefundProcessed,
} from './notifications'
import axios from 'axios'

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'

// Paystack API client
const paystackAPI = axios.create({
  baseURL: 'https://api.paystack.co',
  headers: {
    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
})

export interface PaymentRecord {
  id: string
  bookingId: string
  amount: number
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED'
  paymentMethod: string
  transactionId: string
  createdAt: Date
}

export interface RefundRequest {
  bookingId: string
  amount: number
  reason: string
  userId: string
}

export interface BookingData {
  userId: string
  roomId: string
  hotelId: string
  checkIn: Date
  checkOut: Date
  guestName: string
  guestEmail: string
  guestPhone: string
  guests: number
  specialRequests?: string
}

/**
 * Initialize Paystack payment transaction
 * @param email - Customer email
 * @param amount - Amount in kobo (NGN minor unit, multiply by 100)
 * @param reference - Unique transaction reference
 * @param metadata - Additional data to attach to the transaction
 * @returns Paystack initialization response with authorization_url
 */
export async function initializePaystackPayment(params: {
  email: string
  amount: number // in kobo
  reference: string
  metadata: Record<string, any>
  callbackUrl?: string
}) {
  try {
    const response = await paystackAPI.post('/transaction/initialize', {
      email: params.email,
      amount: params.amount,
      reference: params.reference,
      callback_url:
        params.callbackUrl || `${FRONTEND_URL}/booking/success`,
      metadata: params.metadata,
      currency: 'NGN',
    })

    if (response.data.status) {
      return {
        authorizationUrl: response.data.data.authorization_url,
        accessCode: response.data.data.access_code,
        reference: response.data.data.reference,
      }
    }

    throw new Error(response.data.message || 'Payment initialization failed')
  } catch (error: any) {
    console.error('Paystack initialization error:', error.response?.data || error)
    throw new Error(
      error.response?.data?.message || 'Failed to initialize payment'
    )
  }
}

/**
 * Verify Paystack payment transaction
 * @param reference - Transaction reference
 * @returns Verification data
 */
export async function verifyPaystackPayment(reference: string) {
  try {
    const response = await paystackAPI.get(`/transaction/verify/${reference}`)

    if (response.data.status && response.data.data.status === 'success') {
      return {
        success: true,
        amount: response.data.data.amount / 100, // Convert from kobo to naira
        currency: response.data.data.currency,
        reference: response.data.data.reference,
        paidAt: response.data.data.paid_at,
        channel: response.data.data.channel,
        metadata: response.data.data.metadata,
      }
    }

    return {
      success: false,
      message: response.data.data.gateway_response || 'Payment verification failed',
    }
  } catch (error: any) {
    console.error('Paystack verification error:', error.response?.data || error)
    throw new Error(
      error.response?.data?.message || 'Failed to verify payment'
    )
  }
}

/**
 * Initiate Paystack refund
 * @param reference - Original transaction reference
 * @param amount - Amount to refund (optional, defaults to full amount)
 * @returns Refund response
 */
export async function initiatePaystackRefund(
  reference: string,
  amount?: number
) {
  try {
    const payload: any = {
      transaction: reference,
    }

    if (amount) {
      payload.amount = amount * 100 // Convert to kobo
    }

    const response = await paystackAPI.post('/refund', payload)

    if (response.data.status) {
      return {
        success: true,
        refundId: response.data.data.id,
        status: response.data.data.status,
        message: response.data.message,
      }
    }

    throw new Error(response.data.message || 'Refund initiation failed')
  } catch (error: any) {
    console.error('Paystack refund error:', error.response?.data || error)
    throw new Error(
      error.response?.data?.message || 'Failed to initiate refund'
    )
  }
}

/**
 * Create a booking with payment
 * This creates the booking in PENDING status and initializes Paystack payment
 * @param data - Booking data
 * @returns Booking and payment URL
 */
export async function createBookingWithPayment(data: BookingData) {
  // 1. Validate room availability
  const isAvailable = await checkAvailability(
    data.roomId,
    data.checkIn,
    data.checkOut
  )

  if (!isAvailable) {
    throw new Error('Room is not available for the selected dates')
  }

  // 2. Lock the room for 10 minutes during checkout
  const locked = await lockRoom(data.roomId, data.checkIn, data.checkOut, 600)

  if (!locked) {
    throw new Error('Room is currently being booked by another user. Please try again.')
  }

  try {
    // 3. Calculate price
    const totalPrice = await calculateBookingPrice(
      data.roomId,
      data.checkIn,
      data.checkOut
    )

    // 4. Create booking in PENDING status
    const booking = await prisma.booking.create({
      data: {
        userId: data.userId,
        roomId: data.roomId,
        hotelId: data.hotelId,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        totalPrice,
        status: 'PENDING',
        guestName: data.guestName,
        guestEmail: data.guestEmail,
        guestPhone: data.guestPhone,
        guests: data.guests,
        specialRequests: data.specialRequests,
      },
      include: {
        room: {
          select: {
            name: true,
          },
        },
        hotel: {
          select: {
            name: true,
          },
        },
      },
    })

    // 5. Generate unique payment reference
    const reference = `booking_${booking.id}_${Date.now()}`

    // 6. Create payment transaction record
    await prisma.paymentTransaction.create({
      data: {
        bookingId: booking.id,
        amount: totalPrice,
        currency: 'NGN',
        paymentMethod: 'paystack',
        paystackRef: reference,
        status: 'PENDING',
        metadata: JSON.stringify({
          userId: data.userId,
          roomId: data.roomId,
          hotelId: data.hotelId,
        }),
      },
    })

    // 7. Initialize Paystack payment
    const payment = await initializePaystackPayment({
      email: data.guestEmail,
      amount: Math.round(totalPrice * 100), // Convert to kobo
      reference,
      metadata: {
        bookingId: booking.id,
        userId: data.userId,
        roomId: data.roomId,
        hotelId: data.hotelId,
        hotelName: booking.hotel.name,
        roomName: booking.room.name,
      },
    })

    // 8. Log audit
    await logAudit({
      action: AuditAction.BOOKING_CREATED,
      userId: data.userId,
      resourceId: booking.id,
      resourceType: 'BOOKING',
      metadata: {
        roomId: data.roomId,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        totalPrice,
        reference,
      },
    })

    return {
      booking,
      paymentUrl: payment.authorizationUrl,
      reference: payment.reference,
    }
  } catch (error) {
    // Release lock on error
    await releaseRoom(data.roomId, data.checkIn, data.checkOut)
    throw error
  }
}

/**
 * Confirm booking after successful payment
 * This is called from the Paystack webhook or after payment verification
 * @param reference - Paystack transaction reference
 * @returns Updated booking
 */
export async function confirmBooking(reference: string) {
  // 1. Verify payment with Paystack
  const verification = await verifyPaystackPayment(reference)

  if (!verification.success) {
    throw new Error('Payment verification failed')
  }

  // 2. Find payment transaction
  const transaction = await prisma.paymentTransaction.findUnique({
    where: { paystackRef: reference },
    include: {
      booking: {
        include: {
          user: true,
          room: {
            select: {
              name: true,
            },
          },
          hotel: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  })

  if (!transaction) {
    throw new Error('Payment transaction not found')
  }

  // 3. Update transaction status
  await prisma.paymentTransaction.update({
    where: { id: transaction.id },
    data: {
      status: 'SUCCESS',
      paymentMethod: verification.channel,
    },
  })

  // 4. Update booking status and room availability
  const booking = await prisma.booking.update({
    where: { id: transaction.bookingId },
    data: {
      status: 'CONFIRMED',
      paymentId: reference,
    },
  })

  // 5. Update room status to OCCUPIED
  await prisma.room.update({
    where: { id: transaction.booking.roomId },
    data: {
      status: 'OCCUPIED',
    },
  })

  // 6. Release room lock
  await releaseRoom(
    transaction.booking.roomId,
    transaction.booking.checkIn,
    transaction.booking.checkOut
  )

  // 7. Send confirmation email
  try {
    await sendEmail({
      to: transaction.booking.guestEmail,
      subject: `Booking Confirmation - ${transaction.booking.hotel.name}`,
      template: 'bookingConfirmation',
      data: {
        guestName: transaction.booking.guestName,
        hotelName: transaction.booking.hotel.name,
        roomName: transaction.booking.room.name,
        checkIn: transaction.booking.checkIn.toLocaleDateString(),
        checkOut: transaction.booking.checkOut.toLocaleDateString(),
        totalPrice: transaction.booking.totalPrice,
        bookingId: transaction.booking.id,
      },
    })
  } catch (emailError) {
    console.error('Failed to send confirmation email:', emailError)
    // Don't fail the booking if email fails
  }

  // 7.5. Send in-app notifications
  try {
    await notifyBookingConfirmed(
      transaction.booking.userId,
      transaction.booking.id,
      transaction.booking.hotel.name,
      transaction.booking.checkIn,
      transaction.booking.checkOut
    )

    await notifyPaymentSuccess(
      transaction.booking.userId,
      transaction.booking.id,
      transaction.booking.totalPrice,
      transaction.booking.hotel.name
    )
  } catch (notificationError) {
    console.error('Failed to send notifications:', notificationError)
    // Don't fail the booking if notifications fail
  }

  // 8. Log audit
  await logAudit({
    action: AuditAction.PAYMENT_CONFIRMED,
    userId: transaction.booking.userId,
    resourceId: transaction.bookingId,
    resourceType: 'BOOKING',
    metadata: {
      reference,
      amount: verification.amount,
      channel: verification.channel,
    },
  })

  return booking
}

/**
 * Process refund for a booking
 * @param request - Refund request data
 * @returns Refund success status
 */
export async function processRefund(request: RefundRequest): Promise<boolean> {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: request.bookingId },
      include: {
        hotel: true,
        transactions: {
          where: {
            status: 'SUCCESS',
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    })

    if (!booking) {
      throw new Error('Booking not found')
    }

    if (!booking.transactions[0]) {
      throw new Error('No successful payment found for this booking')
    }

    // Calculate refund amount based on cancellation policy
    const now = new Date()
    const checkInDate = new Date(booking.checkIn)
    const daysUntilCheckIn = Math.ceil(
      (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )

    let refundAmount = 0
    if (daysUntilCheckIn > 7) {
      refundAmount = booking.totalPrice // Full refund
    } else if (daysUntilCheckIn >= 3) {
      refundAmount = booking.totalPrice * 0.5 // 50% refund
    } else {
      // Apply cancellation fee
      const cancellationFee = booking.hotel.cancellationFee || 0
      refundAmount = Math.max(0, booking.totalPrice - cancellationFee)
    }

    // Initiate Paystack refund
    const refund = await initiatePaystackRefund(
      booking.transactions[0].paystackRef!,
      refundAmount
    )

    // Update payment transaction
    await prisma.paymentTransaction.update({
      where: { id: booking.transactions[0].id },
      data: {
        status: 'REFUNDED',
      },
    })

    // Update booking status
    await prisma.booking.update({
      where: { id: request.bookingId },
      data: {
        status: 'CANCELLED',
        cancellationReason: request.reason,
        cancelledAt: new Date(),
      },
    })

    // Send refund notification
    try {
      await notifyRefundProcessed(
        booking.userId,
        booking.id,
        refundAmount,
        booking.hotel.name
      )
    } catch (notificationError) {
      console.error('Failed to send refund notification:', notificationError)
    }

    // Log audit
    await logAudit({
      action: AuditAction.REFUND_PROCESSED,
      userId: request.userId,
      resourceId: request.bookingId,
      resourceType: 'BOOKING',
      metadata: {
        originalAmount: booking.totalPrice,
        refundAmount,
        reason: request.reason,
        refundId: refund.refundId,
      },
    })

    return true
  } catch (error) {
    console.error('Error processing refund:', error)
    return false
  }
}

/**
 * Get payment history for a user
 */
export async function getUserPaymentHistory(userId: string) {
  const transactions = await prisma.paymentTransaction.findMany({
    where: {
      booking: {
        userId,
      },
    },
    include: {
      booking: {
        include: {
          room: {
            select: {
              name: true,
            },
          },
          hotel: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return transactions.map((transaction) => ({
    id: transaction.id,
    bookingId: transaction.bookingId,
    hotelName: transaction.booking.hotel.name,
    roomName: transaction.booking.room.name,
    checkIn: transaction.booking.checkIn,
    checkOut: transaction.booking.checkOut,
    amount: transaction.amount,
    currency: transaction.currency,
    status: transaction.status,
    paymentMethod: transaction.paymentMethod,
    paystackRef: transaction.paystackRef,
    createdAt: transaction.createdAt,
  }))
}

/**
 * Get payment statistics for a tenant
 */
export async function getPaymentStats(tenantId: string) {
  const transactions = await prisma.paymentTransaction.findMany({
    where: {
      booking: {
        hotel: {
          tenantId,
        },
      },
    },
    include: {
      booking: {
        select: {
          status: true,
        },
      },
    },
  })

  const successfulTransactions = transactions.filter(
    (t) => t.status === 'SUCCESS'
  )
  const totalRevenue = successfulTransactions.reduce(
    (sum, t) => sum + t.amount,
    0
  )
  const refundedTransactions = transactions.filter(
    (t) => t.status === 'REFUNDED'
  )
  const refundedAmount = refundedTransactions.reduce(
    (sum, t) => sum + t.amount,
    0
  )

  const pendingPayments = await prisma.booking.count({
    where: {
      hotel: {
        tenantId,
      },
      status: 'PENDING',
    },
  })

  return {
    totalRevenue,
    netRevenue: totalRevenue - refundedAmount,
    successfulTransactions: successfulTransactions.length,
    refundedTransactions: refundedTransactions.length,
    pendingPayments,
    totalTransactions: transactions.length,
    successRate:
      transactions.length > 0
        ? (successfulTransactions.length / transactions.length) * 100
        : 0,
  }
}

/**
 * Calculate booking price with discounts
 * @param roomId - Room ID
 * @param checkIn - Check-in date
 * @param checkOut - Check-out date
 * @returns Total price in NGN
 */
export async function calculateBookingPrice(
  roomId: string,
  checkIn: Date,
  checkOut: Date
): Promise<number> {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
  })

  if (!room) {
    throw new Error('Room not found')
  }

  const nights = Math.ceil(
    (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
  )

  // Base price
  let totalPrice = room.price * nights

  // Apply discounts for longer stays
  if (nights >= 14) {
    totalPrice *= 0.85 // 15% off for 14+ nights
  } else if (nights >= 7) {
    totalPrice *= 0.9 // 10% off for 7+ nights
  }

  return Math.round(totalPrice * 100) / 100 // Round to 2 decimal places
}
