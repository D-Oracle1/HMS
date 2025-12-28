import { prisma } from './index'
import { checkMultipleRoomsAvailability } from './availability'
import { calculateDistance, findNearbyHotels, geocodeAddress } from './geolocation'
import { getCache, setCache, CACHE_TTL } from './redis'

export interface SearchParams {
  query?: string // Hotel name or city search
  location?: string // City name or "lat,lng"
  checkIn?: string
  checkOut?: string
  guests?: number
  minPrice?: number
  maxPrice?: number
  amenities?: string[] // Array of amenities to filter
  rating?: number // Minimum rating
  roomType?: string // Room type filter
  sort?: 'relevance' | 'price_low' | 'price_high' | 'rating' | 'distance'
  page?: number
  limit?: number
  featured?: boolean // Show only featured hotels
}

export interface SearchResult {
  hotels: Array<{
    id: string
    name: string
    address: string
    city: string | null
    imageUrl: string | null
    rating: number
    reviewCount: number
    minPrice: number
    distance?: number
    featured: boolean
    verified: boolean
    amenities: string[]
    availableRooms: number
  }>
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
  filters: {
    minPrice: number
    maxPrice: number
    availableAmenities: string[]
    cities: string[]
  }
}

/**
 * Advanced hotel search with filters, sorting, and availability checking
 * @param params - Search parameters
 * @returns Search results with pagination and filters
 */
export async function searchHotels(params: SearchParams): Promise<SearchResult> {
  const page = params.page || 1
  const limit = params.limit || 20
  const skip = (page - 1) * limit

  // Check cache first
  const cacheKey = `search:${JSON.stringify(params)}`
  const cached = await getCache<SearchResult>(cacheKey)
  if (cached) {
    return cached
  }

  // Build where clause
  const where: any = {
    // Always show only active hotels from active tenants
    tenant: {
      isActive: true,
    },
  }

  // Text search (hotel name or description)
  if (params.query) {
    where.OR = [
      {
        name: {
          contains: params.query,
          mode: 'insensitive',
        },
      },
      {
        description: {
          contains: params.query,
          mode: 'insensitive',
        },
      },
      {
        city: {
          contains: params.query,
          mode: 'insensitive',
        },
      },
    ]
  }

  // Rating filter
  if (params.rating) {
    where.rating = {
      gte: params.rating,
    }
  }

  // Featured filter
  if (params.featured) {
    where.featured = true
  }

  // City/Location search
  let userLocation: { latitude: number; longitude: number } | null = null

  if (params.location) {
    // Check if location is coordinates (lat,lng) or city name
    const coordsMatch = params.location.match(/^(-?\d+\.?\d*),(-?\d+\.?\d*)$/)

    if (coordsMatch) {
      // It's coordinates
      const [, lat, lng] = coordsMatch
      userLocation = {
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
      }

      // Use PostGIS for nearby search (more efficient)
      if (params.sort === 'distance' || !params.sort) {
        const nearbyHotels = await findNearbyHotels(
          userLocation.latitude,
          userLocation.longitude,
          50 // 50km radius
        )

        // Return early with nearby results
        const filteredHotels = await applyAdditionalFilters(
          nearbyHotels.map((h) => h.id),
          params
        )

        return {
          hotels: filteredHotels.slice(skip, skip + limit),
          pagination: {
            page,
            limit,
            total: filteredHotels.length,
            totalPages: Math.ceil(filteredHotels.length / limit),
            hasMore: page * limit < filteredHotels.length,
          },
          filters: await getSearchFilters(),
        }
      }
    } else {
      // It's a city name
      where.city = {
        contains: params.location,
        mode: 'insensitive',
      }
    }
  }

  // Get all hotels matching basic criteria
  const hotels = await prisma.hotel.findMany({
    where,
    include: {
      rooms: {
        where: {
          available: true,
          status: 'AVAILABLE',
        },
        select: {
          id: true,
          price: true,
          roomType: {
            select: {
              name: true,
            },
          },
          amenities: true,
        },
      },
    },
    orderBy: getSortOrder(params.sort || 'relevance'),
  })

  // Apply price filter
  let filteredHotels = hotels.filter((hotel) => {
    if (hotel.rooms.length === 0) return false

    const minPrice = Math.min(...hotel.rooms.map((r) => r.price))

    if (params.minPrice && minPrice < params.minPrice) return false
    if (params.maxPrice && minPrice > params.maxPrice) return false

    return true
  })

  // Apply amenities filter
  if (params.amenities && params.amenities.length > 0) {
    filteredHotels = filteredHotels.filter((hotel) => {
      const hotelAmenities = hotel.amenities
        ? JSON.parse(hotel.amenities)
        : []
      return params.amenities!.every((amenity) =>
        hotelAmenities.includes(amenity)
      )
    })
  }

  // Apply room type filter
  if (params.roomType) {
    filteredHotels = filteredHotels.filter((hotel) => {
      return hotel.rooms.some((room) => room.roomType?.name === params.roomType)
    })
  }

  // Check availability if dates provided
  if (params.checkIn && params.checkOut) {
    const checkIn = new Date(params.checkIn)
    const checkOut = new Date(params.checkOut)

    for (const hotel of filteredHotels) {
      const roomIds = hotel.rooms.map((r) => r.id)
      const availability = await checkMultipleRoomsAvailability(
        roomIds,
        checkIn,
        checkOut
      )

      // Filter out unavailable rooms
      hotel.rooms = hotel.rooms.filter((room) => availability.get(room.id))
    }

    // Remove hotels with no available rooms
    filteredHotels = filteredHotels.filter((hotel) => hotel.rooms.length > 0)
  }

  // Calculate distance if user location is known
  if (userLocation) {
    filteredHotels = filteredHotels
      .map((hotel) => ({
        ...hotel,
        distance:
          hotel.latitude && hotel.longitude
            ? calculateDistance(
                userLocation!.latitude,
                userLocation!.longitude,
                hotel.latitude,
                hotel.longitude
              )
            : undefined,
      }))
      .sort((a, b) => {
        if (params.sort === 'distance' && a.distance && b.distance) {
          return a.distance - b.distance
        }
        return 0
      })
  }

  // Format results
  const results = filteredHotels.map((hotel) => ({
    id: hotel.id,
    name: hotel.name,
    address: hotel.address,
    city: hotel.city,
    imageUrl: hotel.imageUrl,
    rating: hotel.rating,
    reviewCount: hotel.reviewCount,
    minPrice: Math.min(...hotel.rooms.map((r) => r.price)),
    distance: (hotel as any).distance,
    featured: hotel.featured,
    verified: hotel.verified,
    amenities: hotel.amenities ? JSON.parse(hotel.amenities) : [],
    availableRooms: hotel.rooms.length,
  }))

  // Pagination
  const paginatedResults = results.slice(skip, skip + limit)

  const searchResult: SearchResult = {
    hotels: paginatedResults,
    pagination: {
      page,
      limit,
      total: results.length,
      totalPages: Math.ceil(results.length / limit),
      hasMore: page * limit < results.length,
    },
    filters: await getSearchFilters(),
  }

  // Cache results for 2 minutes
  await setCache(cacheKey, searchResult, CACHE_TTL.FIVE_MINUTES)

  return searchResult
}

/**
 * Apply additional filters to hotel IDs
 * Helper function for nearby search
 */
async function applyAdditionalFilters(
  hotelIds: string[],
  params: SearchParams
) {
  const hotels = await prisma.hotel.findMany({
    where: {
      id: {
        in: hotelIds,
      },
    },
    include: {
      rooms: {
        where: {
          available: true,
          status: 'AVAILABLE',
        },
        select: {
          id: true,
          price: true,
          roomType: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  })

  let filtered = hotels.filter((hotel) => {
    if (hotel.rooms.length === 0) return false

    const minPrice = Math.min(...hotel.rooms.map((r) => r.price))

    if (params.minPrice && minPrice < params.minPrice) return false
    if (params.maxPrice && minPrice > params.maxPrice) return false
    if (params.rating && hotel.rating < params.rating) return false

    return true
  })

  if (params.amenities && params.amenities.length > 0) {
    filtered = filtered.filter((hotel) => {
      const hotelAmenities = hotel.amenities
        ? JSON.parse(hotel.amenities)
        : []
      return params.amenities!.every((amenity) =>
        hotelAmenities.includes(amenity)
      )
    })
  }

  return filtered.map((hotel) => ({
    id: hotel.id,
    name: hotel.name,
    address: hotel.address,
    city: hotel.city,
    imageUrl: hotel.imageUrl,
    rating: hotel.rating,
    reviewCount: hotel.reviewCount,
    minPrice: Math.min(...hotel.rooms.map((r) => r.price)),
    featured: hotel.featured,
    verified: hotel.verified,
    amenities: hotel.amenities ? JSON.parse(hotel.amenities) : [],
    availableRooms: hotel.rooms.length,
  }))
}

/**
 * Get sort order for Prisma query
 */
function getSortOrder(sort: string): any {
  switch (sort) {
    case 'price_low':
      return { rooms: { _min: { price: 'asc' } } }
    case 'price_high':
      return { rooms: { _min: { price: 'desc' } } }
    case 'rating':
      return { rating: 'desc' }
    case 'relevance':
    default:
      return [{ featured: 'desc' }, { rating: 'desc' }]
  }
}

/**
 * Get available filters for search
 * Returns price range and available amenities
 */
async function getSearchFilters() {
  const hotels = await prisma.hotel.findMany({
    where: {
      tenant: { isActive: true },
    },
    include: {
      rooms: {
        where: {
          available: true,
        },
        select: {
          price: true,
        },
      },
    },
    select: {
      amenities: true,
      city: true,
      rooms: true,
    },
  })

  const prices = hotels.flatMap((h) => h.rooms.map((r) => r.price))
  const amenitiesSet = new Set<string>()
  const citiesSet = new Set<string>()

  hotels.forEach((hotel) => {
    if (hotel.amenities) {
      const amenities = JSON.parse(hotel.amenities)
      amenities.forEach((a: string) => amenitiesSet.add(a))
    }
    if (hotel.city) {
      citiesSet.add(hotel.city)
    }
  })

  return {
    minPrice: prices.length > 0 ? Math.min(...prices) : 0,
    maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
    availableAmenities: Array.from(amenitiesSet),
    cities: Array.from(citiesSet).sort(),
  }
}

/**
 * Get autocomplete suggestions for search
 * @param query - Search query
 * @param limit - Maximum suggestions (default: 5)
 * @returns Suggestions for hotels and cities
 */
export async function getSearchSuggestions(
  query: string,
  limit: number = 5
) {
  if (!query || query.length < 2) {
    return {
      hotels: [],
      cities: [],
    }
  }

  const [hotels, cities] = await Promise.all([
    // Hotel name suggestions
    prisma.hotel.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive',
        },
        tenant: {
          isActive: true,
        },
      },
      select: {
        id: true,
        name: true,
        city: true,
        imageUrl: true,
      },
      take: limit,
      orderBy: {
        featured: 'desc',
      },
    }),

    // City suggestions
    prisma.hotel.groupBy({
      by: ['city'],
      where: {
        city: {
          contains: query,
          mode: 'insensitive',
          not: null,
        },
        tenant: {
          isActive: true,
        },
      },
      take: limit,
    }),
  ])

  return {
    hotels,
    cities: cities.map((c) => c.city).filter((c): c is string => c !== null),
  }
}
