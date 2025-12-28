import { NextRequest, NextResponse } from 'next/server'
import { searchHotels, SearchParams } from 'db/search'

/**
 * Advanced hotel search API
 * GET /api/search
 *
 * Query parameters:
 * - query: string (hotel name or city search)
 * - location: string (city name or "lat,lng")
 * - checkIn: string (ISO date)
 * - checkOut: string (ISO date)
 * - guests: number
 * - minPrice: number
 * - maxPrice: number
 * - amenities: string (comma-separated)
 * - rating: number (minimum rating)
 * - roomType: string
 * - sort: 'relevance' | 'price_low' | 'price_high' | 'rating' | 'distance'
 * - page: number
 * - limit: number
 * - featured: boolean
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Build search parameters
    const params: SearchParams = {
      query: searchParams.get('query') || undefined,
      location: searchParams.get('location') || undefined,
      checkIn: searchParams.get('checkIn') || undefined,
      checkOut: searchParams.get('checkOut') || undefined,
      guests: searchParams.get('guests')
        ? parseInt(searchParams.get('guests')!)
        : undefined,
      minPrice: searchParams.get('minPrice')
        ? parseFloat(searchParams.get('minPrice')!)
        : undefined,
      maxPrice: searchParams.get('maxPrice')
        ? parseFloat(searchParams.get('maxPrice')!)
        : undefined,
      amenities: searchParams.get('amenities')
        ? searchParams.get('amenities')!.split(',')
        : undefined,
      rating: searchParams.get('rating')
        ? parseFloat(searchParams.get('rating')!)
        : undefined,
      roomType: searchParams.get('roomType') || undefined,
      sort: (searchParams.get('sort') as any) || 'relevance',
      page: searchParams.get('page')
        ? parseInt(searchParams.get('page')!)
        : 1,
      limit: searchParams.get('limit')
        ? parseInt(searchParams.get('limit')!)
        : 20,
      featured: searchParams.get('featured') === 'true',
    }

    // Execute search
    const results = await searchHotels(params)

    return NextResponse.json(results, {
      headers: {
        'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=300',
      },
    })
  } catch (error: any) {
    console.error('Search API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to search hotels',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
