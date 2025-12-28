import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from 'db'
import { logAudit, AuditAction } from 'db/auditLog'
import { processRefund } from 'db/payment'
import { sendEmail } from 'db/emailService'

/**
 * Get a specific booking
 * GET /api/bookings/[bookingId]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const booking = await prisma.booking.findUnique({
      where: { id: params.bookingId },
      include: {
        room: {
          include: {
            hotel: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        review: true,
        transactions: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Check if user owns this booking
    if (booking.userId !== (session.user as any).id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    return NextResponse.json({ booking })
  } catch (error: any) {
    console.error('Get booking error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch booking' },
      { status: 500 }
    )
  }
}

/**
 * Cancel a booking
 * DELETE /api/bookings/[bookingId]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { reason } = body

    if (!reason) {
      return NextResponse.json(
        { error: 'Cancellation reason is required' },
        { status: 400 }
      )
    }

    // Get booking
    const booking = await prisma.booking.findUnique({
      where: { id: params.bookingId },
      include: {
        hotel: true,
        room: true,
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
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Check if user owns this booking
    if (booking.userId !== (session.user as any).id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Check if booking can be cancelled
    if (booking.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Booking is already cancelled' },
        { status: 400 }
      )
    }

    if (booking.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Cannot cancel completed booking' },
        { status: 400 }
      )
    }

    // Calculate refund amount
    const now = new Date()
    const checkInDate = new Date(booking.checkIn)
    const daysUntilCheckIn = Math.ceil(
      (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )

    let refundAmount = 0
    let refundPercentage = 0

    if (daysUntilCheckIn > 7) {
      refundAmount = booking.totalPrice
      refundPercentage = 100
    } else if (daysUntilCheckIn >= 3) {
      refundAmount = booking.totalPrice * 0.5
      refundPercentage = 50
    } else if (daysUntilCheckIn >= 0) {
      const cancellationFee = booking.hotel.cancellationFee || 0
      refundAmount = Math.max(0, booking.totalPrice - cancellationFee)
      refundPercentage = Math.round((refundAmount / booking.totalPrice) * 100)
    }

    // Process refund if payment was made
    if (booking.transactions.length > 0 && refundAmount > 0) {
      await processRefund({
        bookingId: booking.id,
        amount: refundAmount,
        reason,
        userId: (session.user as any).id,
      })
    } else {
      // Just cancel the booking if no payment
      await prisma.booking.update({
        where: { id: params.bookingId },
        data: {
          status: 'CANCELLED',
          cancellationReason: reason,
          cancelledAt: new Date(),
        },
      })

      // Update room status back to AVAILABLE
      await prisma.room.update({
        where: { id: booking.roomId },
        data: {
          status: 'AVAILABLE',
        },
      })
    }

    // Send cancellation email
    try {
      await sendEmail({
        to: booking.guestEmail,
        subject: `Booking Cancelled - ${booking.hotel.name}`,
        template: 'bookingCancellation',
        data: {
          guestName: booking.guestName,
          hotelName: booking.hotel.name,
          roomName: booking.room.name,
          checkIn: booking.checkIn.toLocaleDateString(),
          checkOut: booking.checkOut.toLocaleDateString(),
          refundAmount,
          refundPercentage,
          bookingId: booking.id,
        },
      })
    } catch (emailError) {
      console.error('Failed to send cancellation email:', emailError)
    }

    // Log audit
    await logAudit({
      action: AuditAction.BOOKING_CANCELLED,
      userId: (session.user as any).id,
      resourceId: params.bookingId,
      resourceType: 'BOOKING',
      metadata: {
        reason,
        refundAmount,
        refundPercentage,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Booking cancelled successfully',
      refund: {
        amount: refundAmount,
        percentage: refundPercentage,
      },
    })
  } catch (error: any) {
    console.error('Cancel booking error:', error)
    return NextResponse.json(
      {
        error: 'Failed to cancel booking',
        message: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * Update booking special requests
 * PUT /api/bookings/[bookingId]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { specialRequests } = body

    // Get booking
    const booking = await prisma.booking.findUnique({
      where: { id: params.bookingId },
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Check if user owns this booking
    if (booking.userId !== (session.user as any).id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Cannot update cancelled or completed bookings
    if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Cannot update cancelled or completed booking' },
        { status: 400 }
      )
    }

    // Update booking
    const updatedBooking = await prisma.booking.update({
      where: { id: params.bookingId },
      data: {
        specialRequests,
      },
      include: {
        room: {
          include: {
            hotel: true,
          },
        },
      },
    })

    // Log audit
    await logAudit({
      action: AuditAction.BOOKING_UPDATED,
      userId: (session.user as any).id,
      resourceId: params.bookingId,
      resourceType: 'BOOKING',
      metadata: {
        changes: { specialRequests },
      },
    })

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
    })
  } catch (error: any) {
    console.error('Update booking error:', error)
    return NextResponse.json(
      {
        error: 'Failed to update booking',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
