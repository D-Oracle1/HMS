import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../lib/auth'
import { createBookingWithPayment, BookingData } from 'db/payment'
import { validateBookingDates } from 'db/availability'
import { bookingSchema } from 'db/validation'

/**
 * Create booking and initialize Paystack payment
 * POST /api/checkout
 *
 * Body: {
 *   roomId: string
 *   hotelId: string
 *   checkIn: string (ISO date)
 *   checkOut: string (ISO date)
 *   guestName: string
 *   guestEmail: string
 *   guestPhone: string
 *   guests: number
 *   specialRequests?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'You must be logged in to make a booking',
        },
        { status: 401 }
      )
    }

    const user = session.user as any

    // Parse and validate request body
    const body = await request.json()

    const validation = bookingSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: validation.error.issues[0].message,
          errors: validation.error.issues,
        },
        { status: 400 }
      )
    }

    const {
      roomId,
      hotelId,
      checkIn,
      checkOut,
      guestName,
      guestEmail,
      guestPhone,
      guests,
      specialRequests,
    } = validation.data

    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)

    // Validate booking dates against hotel rules
    const dateValidation = await validateBookingDates(
      hotelId,
      checkInDate,
      checkOutDate
    )

    if (!dateValidation.valid) {
      return NextResponse.json(
        {
          error: 'Invalid booking dates',
          message: dateValidation.error,
        },
        { status: 400 }
      )
    }

    // Create booking and initialize Paystack payment
    const bookingData: BookingData = {
      userId: user.id,
      roomId,
      hotelId,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guestName,
      guestEmail,
      guestPhone,
      guests,
      specialRequests,
    }

    const result = await createBookingWithPayment(bookingData)

    return NextResponse.json({
      success: true,
      booking: {
        id: result.booking.id,
        checkIn: result.booking.checkIn,
        checkOut: result.booking.checkOut,
        totalPrice: result.booking.totalPrice,
        status: result.booking.status,
      },
      payment: {
        url: result.paymentUrl,
        reference: result.reference,
      },
      message: 'Booking created. Redirecting to payment...',
    })
  } catch (error: any) {
    console.error('Checkout error:', error)

    // Handle specific error cases
    if (error.message.includes('not available')) {
      return NextResponse.json(
        {
          error: 'Room unavailable',
          message: error.message,
        },
        { status: 409 }
      )
    }

    if (error.message.includes('currently being booked')) {
      return NextResponse.json(
        {
          error: 'Room locked',
          message: error.message,
        },
        { status: 423 }
      )
    }

    if (error.message.includes('not found')) {
      return NextResponse.json(
        {
          error: 'Not found',
          message: error.message,
        },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        error: 'Checkout failed',
        message: error.message || 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}
