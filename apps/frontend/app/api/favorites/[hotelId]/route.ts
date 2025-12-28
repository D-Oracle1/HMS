import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../lib/auth'
import { isHotelFavorited } from '@repo/db/userPreferences'

/**
 * GET /api/favorites/[hotelId] - Check if hotel is favorited
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { hotelId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const isFavorited = await isHotelFavorited(
      session.user.id,
      params.hotelId
    )

    return NextResponse.json({
      success: true,
      isFavorited
    })
  } catch (error) {
    console.error('Error checking favorite status:', error)
    return NextResponse.json(
      { error: 'Failed to check favorite status' },
      { status: 500 }
    )
  }
}
