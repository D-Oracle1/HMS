import { NextRequest, NextResponse } from 'next/server'
import { findNearbyHotels } from 'db/geolocation'

/**
 * Find nearby hotels using PostGIS
 * GET /api/hotels/nearby
 *
 * Query parameters:
 * - lat: number (required - user's latitude)
 * - lng: number (required - user's longitude)
 * - radius: number (optional - search radius in km, default 10)
 * - limit: number (optional - max results, default 20)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Validate required parameters
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')

    if (!lat || !lng) {
      return NextResponse.json(
        {
          error: 'Missing required parameters',
          message: 'Both lat and lng are required',
        },
        { status: 400 }
      )
    }

    const latitude = parseFloat(lat)
    const longitude = parseFloat(lng)

    // Validate coordinates
    if (
      isNaN(latitude) ||
      isNaN(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return NextResponse.json(
        {
          error: 'Invalid coordinates',
          message: 'Latitude must be between -90 and 90, longitude between -180 and 180',
        },
        { status: 400 }
      )
    }

    // Optional parameters
    const radius = searchParams.get('radius')
      ? parseFloat(searchParams.get('radius')!)
      : 10
    const limit = searchParams.get('limit')
      ? parseInt(searchParams.get('limit')!)
      : 20

    // Validate radius and limit
    if (radius <= 0 || radius > 100) {
      return NextResponse.json(
        {
          error: 'Invalid radius',
          message: 'Radius must be between 0 and 100 km',
        },
        { status: 400 }
      )
    }

    if (limit <= 0 || limit > 100) {
      return NextResponse.json(
        {
          error: 'Invalid limit',
          message: 'Limit must be between 1 and 100',
        },
        { status: 400 }
      )
    }

    // Find nearby hotels
    const hotels = await findNearbyHotels(latitude, longitude, radius, limit)

    return NextResponse.json(
      {
        hotels,
        userLocation: {
          latitude,
          longitude,
        },
        radius,
        total: hotels.length,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    )
  } catch (error: any) {
    console.error('Nearby hotels API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to find nearby hotels',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
