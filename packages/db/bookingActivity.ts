import { db } from './index'

export type ActivityType = 'booking' | 'view' | 'search'

/**
 * Track a booking activity (for urgency signals)
 */
export async function trackActivity(
  hotelId: string,
  activityType: ActivityType,
  metadata?: {
    roomId?: string
    userId?: string
    source?: string
    [key: string]: any
  }
) {
  try {
    await db.bookingActivity.create({
      data: {
        hotelId,
        roomId: metadata?.roomId,
        activityType,
        metadata: metadata ? JSON.stringify(metadata) : null
      }
    })

    return { success: true }
  } catch (error) {
    console.error('Error tracking activity:', error)
    // Don't throw - tracking failures shouldn't break the app
    return { success: false }
  }
}

/**
 * Get bookings count in last X hours
 */
export async function getRecentBookingsCount(
  hotelId: string,
  hours: number = 24
) {
  try {
    const since = new Date()
    since.setHours(since.getHours() - hours)

    const count = await db.bookingActivity.count({
      where: {
        hotelId,
        activityType: 'booking',
        timestamp: {
          gte: since
        }
      }
    })

    return count
  } catch (error) {
    console.error('Error getting recent bookings count:', error)
    return 0
  }
}

/**
 * Get views count in last X hours
 */
export async function getRecentViewsCount(
  hotelId: string,
  hours: number = 24
) {
  try {
    const since = new Date()
    since.setHours(since.getHours() - hours)

    const count = await db.bookingActivity.count({
      where: {
        hotelId,
        activityType: 'view',
        timestamp: {
          gte: since
        }
      }
    })

    return count
  } catch (error) {
    console.error('Error getting recent views count:', error)
    return 0
  }
}

/**
 * Get room-specific booking activity
 */
export async function getRoomActivity(roomId: string, hours: number = 24) {
  try {
    const since = new Date()
    since.setHours(since.getHours() - hours)

    const activity = await db.bookingActivity.findMany({
      where: {
        roomId,
        timestamp: {
          gte: since
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    })

    const bookings = activity.filter((a) => a.activityType === 'booking').length
    const views = activity.filter((a) => a.activityType === 'view').length

    return { bookings, views, total: activity.length }
  } catch (error) {
    console.error('Error getting room activity:', error)
    return { bookings: 0, views: 0, total: 0 }
  }
}

/**
 * Get hotel's trending status
 */
export async function getHotelTrendingStatus(hotelId: string) {
  try {
    const last24hBookings = await getRecentBookingsCount(hotelId, 24)
    const last24hViews = await getRecentViewsCount(hotelId, 24)

    // Calculate if hotel is "hot" (arbitrary thresholds)
    const isHot = last24hBookings >= 5 || last24hViews >= 50

    return {
      isHot,
      bookingsToday: last24hBookings,
      viewsToday: last24hViews,
      message: isHot
        ? `Booked ${last24hBookings} times in the last 24 hours!`
        : undefined
    }
  } catch (error) {
    console.error('Error getting hotel trending status:', error)
    return {
      isHot: false,
      bookingsToday: 0,
      viewsToday: 0
    }
  }
}

/**
 * Get urgency signals for a hotel
 */
export async function getUrgencySignals(hotelId: string) {
  try {
    // Get recent activity
    const bookings24h = await getRecentBookingsCount(hotelId, 24)
    const views1h = await getRecentViewsCount(hotelId, 1)

    // Check available rooms
    const availableRooms = await db.room.count({
      where: {
        hotelId,
        status: 'AVAILABLE'
      }
    })

    const signals: Array<{
      type: 'bookings' | 'views' | 'availability'
      message: string
      priority: 'high' | 'medium' | 'low'
    }> = []

    // Booking urgency
    if (bookings24h >= 10) {
      signals.push({
        type: 'bookings',
        message: `In high demand - booked ${bookings24h} times today`,
        priority: 'high'
      })
    } else if (bookings24h >= 5) {
      signals.push({
        type: 'bookings',
        message: `Booked ${bookings24h} times in the last 24 hours`,
        priority: 'medium'
      })
    }

    // View urgency
    if (views1h >= 20) {
      signals.push({
        type: 'views',
        message: `${views1h} people are viewing this property`,
        priority: 'high'
      })
    } else if (views1h >= 10) {
      signals.push({
        type: 'views',
        message: `${views1h} people viewing right now`,
        priority: 'medium'
      })
    }

    // Availability urgency
    if (availableRooms <= 2 && availableRooms > 0) {
      signals.push({
        type: 'availability',
        message: `Only ${availableRooms} room${availableRooms > 1 ? 's' : ''} left!`,
        priority: 'high'
      })
    } else if (availableRooms <= 5) {
      signals.push({
        type: 'availability',
        message: `Only ${availableRooms} rooms left`,
        priority: 'medium'
      })
    }

    return signals
  } catch (error) {
    console.error('Error getting urgency signals:', error)
    return []
  }
}

/**
 * Clean old activity records (run periodically)
 */
export async function cleanOldActivity(daysToKeep: number = 30) {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

    const result = await db.bookingActivity.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate
        }
      }
    })

    return { success: true, deletedCount: result.count }
  } catch (error) {
    console.error('Error cleaning old activity:', error)
    return { success: false, deletedCount: 0 }
  }
}

/**
 * Get popular hotels based on activity
 */
export async function getPopularHotels(
  tenantId?: string,
  limit: number = 10,
  hours: number = 24
) {
  try {
    const since = new Date()
    since.setHours(since.getHours() - hours)

    // Get activity counts grouped by hotel
    const activities = await db.bookingActivity.findMany({
      where: {
        timestamp: {
          gte: since
        }
      },
      select: {
        hotelId: true,
        activityType: true
      }
    })

    // Count activities per hotel
    const hotelCounts = new Map<string, { bookings: number; views: number }>()

    activities.forEach((activity) => {
      const current = hotelCounts.get(activity.hotelId) || {
        bookings: 0,
        views: 0
      }

      if (activity.activityType === 'booking') {
        current.bookings++
      } else if (activity.activityType === 'view') {
        current.views++
      }

      hotelCounts.set(activity.hotelId, current)
    })

    // Sort by weighted score (bookings worth more than views)
    const sorted = Array.from(hotelCounts.entries())
      .map(([hotelId, counts]) => ({
        hotelId,
        score: counts.bookings * 10 + counts.views,
        bookings: counts.bookings,
        views: counts.views
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)

    // Fetch hotel details
    const hotelIds = sorted.map((h) => h.hotelId)

    const hotels = await db.hotel.findMany({
      where: {
        id: { in: hotelIds },
        ...(tenantId && { tenantId })
      },
      include: {
        rooms: {
          take: 1,
          orderBy: { price: 'asc' }
        }
      }
    })

    // Merge activity data with hotel data
    return hotels.map((hotel) => {
      const activity = sorted.find((s) => s.hotelId === hotel.id)
      return {
        ...hotel,
        activityScore: activity?.score || 0,
        recentBookings: activity?.bookings || 0,
        recentViews: activity?.views || 0
      }
    })
  } catch (error) {
    console.error('Error getting popular hotels:', error)
    return []
  }
}
