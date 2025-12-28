import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from 'db'
import { logAudit, AuditAction } from 'db/auditLog'

/**
 * Update review (verify/unverify, moderate)
 * PATCH /api/reviews/[reviewId]
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { reviewId: string } }
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
    const { isVerified } = body

    // Get review
    const review = await prisma.review.findUnique({
      where: { id: params.reviewId },
      include: {
        hotel: true,
      },
    })

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }

    // Check tenant access
    if (review.hotel.tenantId !== user.tenantId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Update review
    const updatedReview = await prisma.review.update({
      where: { id: params.reviewId },
      data: {
        isVerified: isVerified !== undefined ? isVerified : review.isVerified,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        hotel: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Log audit
    await logAudit({
      action: AuditAction.BOOKING_UPDATED,
      userId: user.id,
      tenantId: user.tenantId,
      resourceId: params.reviewId,
      resourceType: 'REVIEW',
      metadata: {
        isVerified,
      },
    })

    return NextResponse.json({
      success: true,
      review: updatedReview,
    })
  } catch (error: any) {
    console.error('Update review error:', error)
    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500 }
    )
  }
}

/**
 * Delete review
 * DELETE /api/reviews/[reviewId]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { reviewId: string } }
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

    // Get review
    const review = await prisma.review.findUnique({
      where: { id: params.reviewId },
      include: {
        hotel: true,
      },
    })

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }

    // Check tenant access
    if (review.hotel.tenantId !== user.tenantId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Recalculate hotel rating after deleting review
    const hotel = await prisma.hotel.findUnique({
      where: { id: review.hotelId },
      include: {
        reviews: {
          where: {
            id: {
              not: review.id, // Exclude the review being deleted
            },
          },
        },
      },
    })

    if (hotel) {
      const remainingReviews = hotel.reviews
      const newRating =
        remainingReviews.length > 0
          ? remainingReviews.reduce((sum, r) => sum + r.rating, 0) /
            remainingReviews.length
          : 0

      // Update hotel rating
      await prisma.hotel.update({
        where: { id: review.hotelId },
        data: {
          rating: newRating,
          reviewCount: remainingReviews.length,
        },
      })
    }

    // Delete review
    await prisma.review.delete({
      where: { id: params.reviewId },
    })

    // Log audit
    await logAudit({
      action: AuditAction.BOOKING_UPDATED,
      userId: user.id,
      tenantId: user.tenantId,
      resourceId: params.reviewId,
      resourceType: 'REVIEW',
      metadata: {
        action: 'deleted',
        hotelId: review.hotelId,
        rating: review.rating,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Review deleted successfully',
    })
  } catch (error: any) {
    console.error('Delete review error:', error)
    return NextResponse.json(
      { error: 'Failed to delete review' },
      { status: 500 }
    )
  }
}
