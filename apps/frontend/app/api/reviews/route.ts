import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  getHotelReviews,
  createReview,
  canUserReview,
} from 'db/reviews'
import { reviewSchema } from 'db/validation'

/**
 * Get reviews for a hotel
 * GET /api/reviews?hotelId=xxx&page=1&limit=10
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const hotelId = searchParams.get('hotelId')

    if (!hotelId) {
      return NextResponse.json(
        {
          error: 'Missing parameter',
          message: 'hotelId is required',
        },
        { status: 400 }
      )
    }

    const page = searchParams.get('page')
      ? parseInt(searchParams.get('page')!)
      : 1
    const limit = searchParams.get('limit')
      ? parseInt(searchParams.get('limit')!)
      : 10

    const result = await getHotelReviews(hotelId, { page, limit })

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    })
  } catch (error: any) {
    console.error('Get reviews error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch reviews',
        message: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * Create a new review
 * POST /api/reviews
 *
 * Body: {
 *   hotelId: string
 *   rating: number (1-5)
 *   comment?: string
 *   bookingId?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'You must be logged in to leave a review',
        },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()

    const validation = reviewSchema.safeParse(body)

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

    const { hotelId, rating, comment, bookingId } = validation.data

    // Check if user can review this hotel
    const canReview = await canUserReview(
      (session.user as any).id,
      hotelId
    )

    if (!canReview) {
      return NextResponse.json(
        {
          error: 'Not allowed',
          message:
            'You can only review hotels where you have completed a stay',
        },
        { status: 403 }
      )
    }

    // Create review
    const review = await createReview({
      hotelId,
      userId: (session.user as any).id,
      rating,
      comment,
      bookingId,
    })

    return NextResponse.json(
      {
        success: true,
        review,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Create review error:', error)

    if (error.message.includes('already exists')) {
      return NextResponse.json(
        {
          error: 'Duplicate review',
          message: error.message,
        },
        { status: 409 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to create review',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
