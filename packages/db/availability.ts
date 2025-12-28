import { prisma } from './index'
import { acquireLock, releaseLock, isLocked } from './redis'

export interface DateRange {
  checkIn: Date
  checkOut: Date
}

/**
 * Check if a room is available for given dates
 * @param roomId - Room ID to check
 * @param checkIn - Check-in date
 * @param checkOut - Check-out date
 * @returns true if available, false if already booked
 */
export async function checkAvailability(
  roomId: string,
  checkIn: Date,
  checkOut: Date
): Promise<boolean> {
  // Validate dates
  if (checkIn >= checkOut) {
    throw new Error('Check-in date must be before check-out date')
  }

  if (checkIn < new Date()) {
    throw new Error('Check-in date cannot be in the past')
  }

  // Check if room exists and is available
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: { id: true, status: true, available: true },
  })

  if (!room) {
    throw new Error('Room not found')
  }

  if (!room.available) {
    return false
  }

  if (room.status !== 'AVAILABLE') {
    return false
  }

  // Check for overlapping bookings
  const overlappingBookings = await prisma.booking.findFirst({
    where: {
      roomId,
      status: {
        in: ['CONFIRMED', 'PENDING'], // Only check active bookings
      },
      OR: [
        // New booking starts during existing booking
        {
          checkIn: {
            lte: checkIn,
          },
          checkOut: {
            gt: checkIn,
          },
        },
        // New booking ends during existing booking
        {
          checkIn: {
            lt: checkOut,
          },
          checkOut: {
            gte: checkOut,
          },
        },
        // New booking completely contains existing booking
        {
          checkIn: {
            gte: checkIn,
          },
          checkOut: {
            lte: checkOut,
          },
        },
      ],
    },
  })

  return !overlappingBookings
}

/**
 * Lock a room during the booking process to prevent double booking
 * This creates a temporary lock in Redis that expires after the specified duration
 * @param roomId - Room ID to lock
 * @param checkIn - Check-in date
 * @param checkOut - Check-out date
 * @param durationSeconds - Lock duration in seconds (default: 600 = 10 minutes)
 * @returns true if lock acquired, false if already locked
 */
export async function lockRoom(
  roomId: string,
  checkIn: Date,
  checkOut: Date,
  durationSeconds: number = 600
): Promise<boolean> {
  const lockKey = `room:${roomId}:${checkIn.toISOString()}:${checkOut.toISOString()}`
  return await acquireLock(lockKey, durationSeconds)
}

/**
 * Release a room lock
 * @param roomId - Room ID to unlock
 * @param checkIn - Check-in date
 * @param checkOut - Check-out date
 */
export async function releaseRoom(
  roomId: string,
  checkIn: Date,
  checkOut: Date
): Promise<void> {
  const lockKey = `room:${roomId}:${checkIn.toISOString()}:${checkOut.toISOString()}`
  await releaseLock(lockKey)
}

/**
 * Check if a room is currently locked
 * @param roomId - Room ID to check
 * @param checkIn - Check-in date
 * @param checkOut - Check-out date
 * @returns true if locked, false otherwise
 */
export async function isRoomLocked(
  roomId: string,
  checkIn: Date,
  checkOut: Date
): Promise<boolean> {
  const lockKey = `room:${roomId}:${checkIn.toISOString()}:${checkOut.toISOString()}`
  return await isLocked(lockKey)
}

/**
 * Get room availability calendar for a specific month
 * Returns an array of dates with their availability status
 * @param roomId - Room ID
 * @param year - Year (YYYY)
 * @param month - Month (1-12)
 * @returns Array of dates with availability
 */
export async function getRoomCalendar(
  roomId: string,
  year: number,
  month: number
): Promise<
  Array<{
    date: Date
    available: boolean
    price?: number
  }>
> {
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)

  // Get room details
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: { price: true, status: true, available: true },
  })

  if (!room) {
    throw new Error('Room not found')
  }

  // Get all bookings for this room in the month
  const bookings = await prisma.booking.findMany({
    where: {
      roomId,
      status: {
        in: ['CONFIRMED', 'PENDING'],
      },
      OR: [
        {
          checkIn: {
            gte: firstDay,
            lte: lastDay,
          },
        },
        {
          checkOut: {
            gte: firstDay,
            lte: lastDay,
          },
        },
        {
          AND: [
            {
              checkIn: {
                lte: firstDay,
              },
            },
            {
              checkOut: {
                gte: lastDay,
              },
            },
          ],
        },
      ],
    },
    select: {
      checkIn: true,
      checkOut: true,
    },
  })

  // Build calendar
  const calendar: Array<{
    date: Date
    available: boolean
    price?: number
  }> = []

  const currentDate = new Date(firstDay)
  while (currentDate <= lastDay) {
    const isBooked = bookings.some((booking) => {
      return (
        currentDate >= new Date(booking.checkIn) &&
        currentDate < new Date(booking.checkOut)
      )
    })

    calendar.push({
      date: new Date(currentDate),
      available:
        !isBooked && room.available && room.status === 'AVAILABLE',
      price: room.price,
    })

    currentDate.setDate(currentDate.getDate() + 1)
  }

  return calendar
}

/**
 * Get multiple rooms' availability for date range
 * Useful for showing available rooms in search results
 * @param roomIds - Array of room IDs
 * @param checkIn - Check-in date
 * @param checkOut - Check-out date
 * @returns Map of roomId to availability status
 */
export async function checkMultipleRoomsAvailability(
  roomIds: string[],
  checkIn: Date,
  checkOut: Date
): Promise<Map<string, boolean>> {
  const availability = new Map<string, boolean>()

  // Get all rooms' basic info
  const rooms = await prisma.room.findMany({
    where: {
      id: {
        in: roomIds,
      },
    },
    select: {
      id: true,
      available: true,
      status: true,
    },
  })

  // Get all overlapping bookings
  const bookings = await prisma.booking.findMany({
    where: {
      roomId: {
        in: roomIds,
      },
      status: {
        in: ['CONFIRMED', 'PENDING'],
      },
      OR: [
        {
          checkIn: {
            lte: checkIn,
          },
          checkOut: {
            gt: checkIn,
          },
        },
        {
          checkIn: {
            lt: checkOut,
          },
          checkOut: {
            gte: checkOut,
          },
        },
        {
          checkIn: {
            gte: checkIn,
          },
          checkOut: {
            lte: checkOut,
          },
        },
      ],
    },
    select: {
      roomId: true,
    },
  })

  const bookedRoomIds = new Set(bookings.map((b) => b.roomId))

  for (const room of rooms) {
    availability.set(
      room.id,
      room.available &&
        room.status === 'AVAILABLE' &&
        !bookedRoomIds.has(room.id)
    )
  }

  return availability
}

/**
 * Calculate number of nights between check-in and check-out
 * @param checkIn - Check-in date
 * @param checkOut - Check-out date
 * @returns Number of nights
 */
export function calculateNights(checkIn: Date, checkOut: Date): number {
  const diffTime = checkOut.getTime() - checkIn.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

/**
 * Validate booking dates against hotel rules
 * @param hotelId - Hotel ID
 * @param checkIn - Check-in date
 * @param checkOut - Check-out date
 * @returns Validation result with error message if invalid
 */
export async function validateBookingDates(
  hotelId: string,
  checkIn: Date,
  checkOut: Date
): Promise<{
  valid: boolean
  error?: string
}> {
  const hotel = await prisma.hotel.findUnique({
    where: { id: hotelId },
    select: {
      minStayDays: true,
      maxStayDays: true,
      blackoutDates: true,
    },
  })

  if (!hotel) {
    return {
      valid: false,
      error: 'Hotel not found',
    }
  }

  const nights = calculateNights(checkIn, checkOut)

  // Check minimum stay
  if (nights < hotel.minStayDays) {
    return {
      valid: false,
      error: `Minimum stay is ${hotel.minStayDays} night(s)`,
    }
  }

  // Check maximum stay
  if (nights > hotel.maxStayDays) {
    return {
      valid: false,
      error: `Maximum stay is ${hotel.maxStayDays} night(s)`,
    }
  }

  // Check blackout dates
  if (hotel.blackoutDates) {
    try {
      const blackoutRanges = JSON.parse(hotel.blackoutDates) as Array<{
        start: string
        end: string
      }>

      for (const range of blackoutRanges) {
        const blackoutStart = new Date(range.start)
        const blackoutEnd = new Date(range.end)

        // Check if any day of the booking overlaps with blackout dates
        if (
          (checkIn >= blackoutStart && checkIn <= blackoutEnd) ||
          (checkOut >= blackoutStart && checkOut <= blackoutEnd) ||
          (checkIn <= blackoutStart && checkOut >= blackoutEnd)
        ) {
          return {
            valid: false,
            error:
              'Selected dates include blackout period when bookings are not allowed',
          }
        }
      }
    } catch (error) {
      console.error('Error parsing blackout dates:', error)
    }
  }

  return { valid: true }
}
