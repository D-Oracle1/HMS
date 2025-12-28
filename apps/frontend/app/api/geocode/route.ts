import { NextRequest, NextResponse } from 'next/server'
import { geocodeAddress, reverseGeocode } from 'db/geolocation'

/**
 * Geocode an address to coordinates or reverse geocode coordinates to address
 * GET /api/geocode
 *
 * Query parameters:
 * - address: string (for forward geocoding)
 * OR
 * - lat: number (for reverse geocoding)
 * - lng: number (for reverse geocoding)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const address = searchParams.get('address')
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')

    // Forward geocoding (address → coordinates)
    if (address) {
      if (address.length < 3) {
        return NextResponse.json(
          {
            error: 'Invalid address',
            message: 'Address must be at least 3 characters long',
          },
          { status: 400 }
        )
      }

      const result = await geocodeAddress(address)

      if (!result) {
        return NextResponse.json(
          {
            error: 'Geocoding failed',
            message: 'Could not find coordinates for the given address',
          },
          { status: 404 }
        )
      }

      return NextResponse.json(result, {
        headers: {
          'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=172800', // 1 day cache
        },
      })
    }

    // Reverse geocoding (coordinates → address)
    if (lat && lng) {
      const latitude = parseFloat(lat)
      const longitude = parseFloat(lng)

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

      const result = await reverseGeocode(latitude, longitude)

      if (!result) {
        return NextResponse.json(
          {
            error: 'Reverse geocoding failed',
            message: 'Could not find address for the given coordinates',
          },
          { status: 404 }
        )
      }

      return NextResponse.json(result, {
        headers: {
          'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=172800',
        },
      })
    }

    // No valid parameters provided
    return NextResponse.json(
      {
        error: 'Missing parameters',
        message: 'Provide either "address" or both "lat" and "lng"',
      },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Geocode API error:', error)
    return NextResponse.json(
      {
        error: 'Geocoding service error',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
