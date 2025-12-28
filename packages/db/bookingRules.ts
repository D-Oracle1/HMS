import { prisma } from './index';
import { differenceInDays } from 'date-fns';

/**
 * Booking rules validation utilities
 */

export interface BookingRuleValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface BlackoutDateRange {
  start: string; // ISO date string
  end: string; // ISO date string
  reason?: string;
}

/**
 * Validate booking against hotel rules
 */
export async function validateBookingRules(
  hotelId: string,
  checkIn: Date,
  checkOut: Date
): Promise<BookingRuleValidationResult> {
  const errors: string[] = [];

  try {
    // Fetch hotel with rules
    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelId },
      select: {
        minStayDays: true,
        maxStayDays: true,
        blackoutDates: true,
      },
    });

    if (!hotel) {
      return {
        isValid: false,
        errors: ['Hotel not found'],
      };
    }

    // Calculate stay duration
    const stayDuration = differenceInDays(checkOut, checkIn);

    // Validate minimum stay
    if (stayDuration < hotel.minStayDays) {
      errors.push(
        `Minimum stay is ${hotel.minStayDays} night${hotel.minStayDays > 1 ? 's' : ''}`
      );
    }

    // Validate maximum stay
    if (stayDuration > hotel.maxStayDays) {
      errors.push(
        `Maximum stay is ${hotel.maxStayDays} night${hotel.maxStayDays > 1 ? 's' : ''}`
      );
    }

    // Validate against blackout dates
    if (hotel.blackoutDates) {
      const blackoutDates = hotel.blackoutDates as BlackoutDateRange[];

      for (const blackout of blackoutDates) {
        const blackoutStart = new Date(blackout.start);
        const blackoutEnd = new Date(blackout.end);

        // Check if booking overlaps with blackout period
        const overlaps =
          (checkIn >= blackoutStart && checkIn <= blackoutEnd) ||
          (checkOut >= blackoutStart && checkOut <= blackoutEnd) ||
          (checkIn <= blackoutStart && checkOut >= blackoutEnd);

        if (overlaps) {
          const reason = blackout.reason || 'not available for booking';
          errors.push(
            `Selected dates overlap with a blackout period (${reason})`
          );
        }
      }
    }

    // Validate that check-in is before check-out
    if (checkIn >= checkOut) {
      errors.push('Check-out date must be after check-in date');
    }

    // Validate that check-in is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (checkIn < today) {
      errors.push('Check-in date cannot be in the past');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  } catch (error) {
    console.error('Error validating booking rules:', error);
    return {
      isValid: false,
      errors: ['An error occurred while validating booking rules'],
    };
  }
}

/**
 * Check room availability for given dates
 */
export async function checkRoomAvailability(
  roomId: string,
  checkIn: Date,
  checkOut: Date,
  excludeBookingId?: string
): Promise<boolean> {
  try {
    // Find overlapping bookings
    const overlappingBookings = await prisma.booking.findMany({
      where: {
        roomId,
        id: excludeBookingId ? { not: excludeBookingId } : undefined,
        status: {
          in: ['PENDING', 'CONFIRMED'],
        },
        OR: [
          // Booking starts during the period
          {
            checkIn: {
              gte: checkIn,
              lt: checkOut,
            },
          },
          // Booking ends during the period
          {
            checkOut: {
              gt: checkIn,
              lte: checkOut,
            },
          },
          // Booking encompasses the entire period
          {
            checkIn: {
              lte: checkIn,
            },
            checkOut: {
              gte: checkOut,
            },
          },
        ],
      },
    });

    return overlappingBookings.length === 0;
  } catch (error) {
    console.error('Error checking room availability:', error);
    return false;
  }
}

/**
 * Add blackout dates to a hotel
 */
export async function addBlackoutDates(
  hotelId: string,
  blackoutDates: BlackoutDateRange[]
): Promise<void> {
  const hotel = await prisma.hotel.findUnique({
    where: { id: hotelId },
    select: { blackoutDates: true },
  });

  if (!hotel) {
    throw new Error('Hotel not found');
  }

  const existingBlackouts = (hotel.blackoutDates as BlackoutDateRange[]) || [];
  const updatedBlackouts = [...existingBlackouts, ...blackoutDates];

  await prisma.hotel.update({
    where: { id: hotelId },
    data: {
      blackoutDates: updatedBlackouts,
    },
  });
}

/**
 * Remove blackout dates from a hotel
 */
export async function removeBlackoutDates(
  hotelId: string,
  startDate: string
): Promise<void> {
  const hotel = await prisma.hotel.findUnique({
    where: { id: hotelId },
    select: { blackoutDates: true },
  });

  if (!hotel) {
    throw new Error('Hotel not found');
  }

  const existingBlackouts = (hotel.blackoutDates as BlackoutDateRange[]) || [];
  const updatedBlackouts = existingBlackouts.filter(
    (blackout) => blackout.start !== startDate
  );

  await prisma.hotel.update({
    where: { id: hotelId },
    data: {
      blackoutDates: updatedBlackouts,
    },
  });
}
