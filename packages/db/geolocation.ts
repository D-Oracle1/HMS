import { prisma } from './index'
import axios from 'axios'

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY

/**
 * Calculate distance between two points using Haversine formula
 * @param lat1 - Latitude of point 1
 * @param lng1 - Longitude of point 1
 * @param lat2 - Latitude of point 2
 * @param lng2 - Longitude of point 2
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  return Math.round(distance * 10) / 10 // Round to 1 decimal place
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

/**
 * Find hotels near a given location using PostGIS
 * @param latitude - User's latitude
 * @param longitude - User's longitude
 * @param radiusKm - Search radius in kilometers (default: 10km)
 * @param limit - Maximum number of results (default: 20)
 * @returns Array of hotels with distance
 */
export async function findNearbyHotels(
  latitude: number,
  longitude: number,
  radiusKm: number = 10,
  limit: number = 20
) {
  // Using raw SQL with PostGIS ST_Distance function
  const hotels = await prisma.$queryRawUnsafe<
    Array<{
      id: string
      name: string
      address: string
      latitude: number
      longitude: number
      imageUrl: string | null
      rating: number
      reviewCount: number
      city: string | null
      distance: number
    }>
  >(
    `
    SELECT
      id,
      name,
      address,
      latitude,
      longitude,
      "imageUrl",
      rating,
      "reviewCount",
      city,
      ST_Distance(
        ST_MakePoint(longitude, latitude)::geography,
        ST_MakePoint($1, $2)::geography
      ) / 1000 as distance
    FROM "Hotel"
    WHERE
      latitude IS NOT NULL
      AND longitude IS NOT NULL
      AND ST_DWithin(
        ST_MakePoint(longitude, latitude)::geography,
        ST_MakePoint($1, $2)::geography,
        $3 * 1000
      )
    ORDER BY distance ASC
    LIMIT $4
    `,
    longitude,
    latitude,
    radiusKm,
    limit
  )

  return hotels.map((hotel) => ({
    ...hotel,
    distance: Math.round(hotel.distance * 10) / 10, // Round to 1 decimal
  }))
}

/**
 * Geocode an address to latitude/longitude using Google Maps API
 * @param address - Full address string
 * @returns Coordinates and formatted address
 */
export async function geocodeAddress(address: string): Promise<{
  latitude: number
  longitude: number
  formattedAddress: string
  city?: string
  state?: string
  country?: string
  postalCode?: string
} | null> {
  if (!GOOGLE_MAPS_API_KEY) {
    console.error('Google Maps API key not configured')
    return null
  }

  try {
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/geocode/json',
      {
        params: {
          address,
          key: GOOGLE_MAPS_API_KEY,
        },
      }
    )

    if (response.data.status !== 'OK' || !response.data.results[0]) {
      console.error('Geocoding failed:', response.data.status)
      return null
    }

    const result = response.data.results[0]
    const { lat, lng } = result.geometry.location

    // Extract address components
    const addressComponents = result.address_components
    const city = addressComponents.find((c: any) =>
      c.types.includes('locality')
    )?.long_name
    const state = addressComponents.find((c: any) =>
      c.types.includes('administrative_area_level_1')
    )?.long_name
    const country = addressComponents.find((c: any) =>
      c.types.includes('country')
    )?.long_name
    const postalCode = addressComponents.find((c: any) =>
      c.types.includes('postal_code')
    )?.long_name

    return {
      latitude: lat,
      longitude: lng,
      formattedAddress: result.formatted_address,
      city,
      state,
      country,
      postalCode,
    }
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
}

/**
 * Reverse geocode coordinates to an address
 * @param latitude - Latitude
 * @param longitude - Longitude
 * @returns Address information
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<{
  formattedAddress: string
  city?: string
  state?: string
  country?: string
  postalCode?: string
} | null> {
  if (!GOOGLE_MAPS_API_KEY) {
    console.error('Google Maps API key not configured')
    return null
  }

  try {
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/geocode/json',
      {
        params: {
          latlng: `${latitude},${longitude}`,
          key: GOOGLE_MAPS_API_KEY,
        },
      }
    )

    if (response.data.status !== 'OK' || !response.data.results[0]) {
      console.error('Reverse geocoding failed:', response.data.status)
      return null
    }

    const result = response.data.results[0]
    const addressComponents = result.address_components

    const city = addressComponents.find((c: any) =>
      c.types.includes('locality')
    )?.long_name
    const state = addressComponents.find((c: any) =>
      c.types.includes('administrative_area_level_1')
    )?.long_name
    const country = addressComponents.find((c: any) =>
      c.types.includes('country')
    )?.long_name
    const postalCode = addressComponents.find((c: any) =>
      c.types.includes('postal_code')
    )?.long_name

    return {
      formattedAddress: result.formatted_address,
      city,
      state,
      country,
      postalCode,
    }
  } catch (error) {
    console.error('Reverse geocoding error:', error)
    return null
  }
}

/**
 * Calculate estimated travel time between two points using Google Maps Distance Matrix API
 * @param originLat - Origin latitude
 * @param originLng - Origin longitude
 * @param destLat - Destination latitude
 * @param destLng - Destination longitude
 * @param mode - Travel mode: driving, walking, bicycling, transit
 * @returns Travel time in minutes and distance in km
 */
export async function calculateTravelTime(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number,
  mode: 'driving' | 'walking' | 'bicycling' | 'transit' = 'driving'
): Promise<{
  durationMinutes: number
  distanceKm: number
  durationText: string
  distanceText: string
} | null> {
  if (!GOOGLE_MAPS_API_KEY) {
    console.error('Google Maps API key not configured')
    return null
  }

  try {
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/distancematrix/json',
      {
        params: {
          origins: `${originLat},${originLng}`,
          destinations: `${destLat},${destLng}`,
          mode,
          key: GOOGLE_MAPS_API_KEY,
        },
      }
    )

    if (
      response.data.status !== 'OK' ||
      !response.data.rows[0]?.elements[0]
    ) {
      console.error('Distance Matrix failed:', response.data.status)
      return null
    }

    const element = response.data.rows[0].elements[0]

    if (element.status !== 'OK') {
      console.error('Element status:', element.status)
      return null
    }

    return {
      durationMinutes: Math.round(element.duration.value / 60),
      distanceKm: Math.round((element.distance.value / 1000) * 10) / 10,
      durationText: element.duration.text,
      distanceText: element.distance.text,
    }
  } catch (error) {
    console.error('Distance Matrix error:', error)
    return null
  }
}

/**
 * Find hotels by city name
 * @param cityName - City name to search
 * @param limit - Maximum results (default: 20)
 * @returns Array of hotels in the city
 */
export async function findHotelsByCity(
  cityName: string,
  limit: number = 20
) {
  return await prisma.hotel.findMany({
    where: {
      city: {
        contains: cityName,
        mode: 'insensitive',
      },
    },
    take: limit,
    orderBy: {
      rating: 'desc',
    },
    select: {
      id: true,
      name: true,
      address: true,
      city: true,
      state: true,
      latitude: true,
      longitude: true,
      imageUrl: true,
      rating: true,
      reviewCount: true,
      featured: true,
    },
  })
}

/**
 * Validate coordinates
 * @param latitude - Latitude to validate
 * @param longitude - Longitude to validate
 * @returns true if valid, false otherwise
 */
export function isValidCoordinates(
  latitude: number,
  longitude: number
): boolean {
  return (
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  )
}
