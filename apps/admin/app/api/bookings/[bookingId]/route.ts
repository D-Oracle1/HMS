import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from 'db'
import { logAudit, AuditAction } from 'db/auditLog'
import { sendEmail } from 'db/emailService'
import { createNotification, NotificationType } from 'db/notifications'

/**
 * Get booking details
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

    const user = session.user as any

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
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
            phone: true,
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

    // Check tenant access
    if (booking.room.hotel.tenantId !== user.tenantId) {
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
 * Update booking status
 * PATCH /api/bookings/[bookingId]
 */
export async function PATCH(
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

    const user = session.user as any

    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { status, cancellationReason } = body

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Get booking
    const booking = await prisma.booking.findUnique({
      where: { id: params.bookingId },
      include: {
        room: {
          include: {
            hotel: true,
          },
        },
        user: true,
      },
    })

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }

    // Check tenant access
    if (booking.room.hotel.tenantId !== user.tenantId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Update booking
    const updateData: any = {
      status,
    }

    if (status === 'CANCELLED' && cancellationReason) {
      updateData.cancellationReason = cancellationReason
      updateData.cancelledAt = new Date()
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: params.bookingId },
      data: updateData,
      include: {
        room: {
          include: {
            hotel: true,
          },
        },
      },
    })

    // Update room status based on booking status
    if (status === 'CONFIRMED') {
      await prisma.room.update({
        where: { id: booking.roomId },
        data: { status: 'RESERVED' },
      })
    } else if (status === 'CANCELLED') {
      await prisma.room.update({
        where: { id: booking.roomId },
        data: { status: 'AVAILABLE' },
      })
    } else if (status === 'COMPLETED') {
      await prisma.room.update({
        where: { id: booking.roomId },
        data: { status: 'AVAILABLE' },
      })
    }

    // Send notification to user
    let notificationTitle = ''
    let notificationMessage = ''
    let notificationType = NotificationType.SYSTEM_ANNOUNCEMENT

    switch (status) {
      case 'CONFIRMED':
        notificationTitle = 'Booking Confirmed'
        notificationMessage = `Your booking at ${booking.room.hotel.name} has been confirmed by the hotel.`
        notificationType = NotificationType.BOOKING_CONFIRMED
        break
      case 'CANCELLED':
        notificationTitle = 'Booking Cancelled'
        notificationMessage = `Your booking at ${booking.room.hotel.name} has been cancelled. ${cancellationReason || ''}`
        notificationType = NotificationType.BOOKING_CANCELLED
        break
      case 'COMPLETED':
        notificationTitle = 'Stay Completed'
        notificationMessage = `Thank you for staying at ${booking.room.hotel.name}! We hope you had a great experience.`
        break
    }

    if (notificationTitle) {
      await createNotification({
        userId: booking.userId,
        type: notificationType,
        title: notificationTitle,
        message: notificationMessage,
        data: {
          bookingId: booking.id,
          hotelName: booking.room.hotel.name,
        },
      })
    }

    // Send email
    if (status === 'CANCELLED') {
      try {
        await sendEmail({
          to: booking.guestEmail,
          subject: `Booking Cancelled - ${booking.room.hotel.name}`,
          template: 'bookingCancellation',
          data: {
            guestName: booking.guestName,
            hotelName: booking.room.hotel.name,
            roomName: booking.room.name,
            checkIn: booking.checkIn.toLocaleDateString(),
            checkOut: booking.checkOut.toLocaleDateString(),
            reason: cancellationReason,
            bookingId: booking.id,
          },
        })
      } catch (emailError) {
        console.error('Failed to send email:', emailError)
      }
    }

    // Log audit
    await logAudit({
      action: AuditAction.BOOKING_UPDATED,
      userId: user.id,
      tenantId: user.tenantId,
      resourceId: params.bookingId,
      resourceType: 'BOOKING',
      metadata: {
        oldStatus: booking.status,
        newStatus: status,
        cancellationReason,
      },
    })

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
    })
  } catch (error: any) {
    console.error('Update booking error:', error)
    return NextResponse.json(
      { error: 'Failed to update booking' },
      { status: 500 }
    )
  }
}
