import { prisma } from './index';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths } from 'date-fns';

/**
 * Revenue and analytics utilities
 */

export interface RevenueReport {
  totalRevenue: number;
  bookingCount: number;
  averageBookingValue: number;
  period: {
    start: Date;
    end: Date;
  };
}

export interface OccupancyReport {
  occupancyRate: number;
  totalRooms: number;
  bookedRooms: number;
  availableRooms: number;
  period: {
    start: Date;
    end: Date;
  };
}

export interface HotelPerformance {
  hotelId: string;
  hotelName: string;
  revenue: number;
  bookings: number;
  occupancyRate: number;
}

/**
 * Get revenue report for a hotel
 */
export async function getRevenueReport(
  hotelId: string,
  startDate: Date,
  endDate: Date
): Promise<RevenueReport> {
  const bookings = await prisma.booking.findMany({
    where: {
      hotelId,
      status: {
        in: ['CONFIRMED', 'COMPLETED'],
      },
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      totalPrice: true,
    },
  });

  const totalRevenue = bookings.reduce((sum, booking) => sum + booking.totalPrice, 0);
  const bookingCount = bookings.length;
  const averageBookingValue = bookingCount > 0 ? totalRevenue / bookingCount : 0;

  return {
    totalRevenue,
    bookingCount,
    averageBookingValue,
    period: {
      start: startDate,
      end: endDate,
    },
  };
}

/**
 * Get occupancy report for a hotel
 */
export async function getOccupancyReport(
  hotelId: string,
  startDate: Date,
  endDate: Date
): Promise<OccupancyReport> {
  // Get total rooms for the hotel
  const totalRooms = await prisma.room.count({
    where: {
      hotelId,
      available: true,
    },
  });

  // Get unique rooms booked during the period
  const bookedRooms = await prisma.booking.findMany({
    where: {
      hotelId,
      status: {
        in: ['CONFIRMED', 'COMPLETED'],
      },
      OR: [
        {
          checkIn: {
            gte: startDate,
            lte: endDate,
          },
        },
        {
          checkOut: {
            gte: startDate,
            lte: endDate,
          },
        },
      ],
    },
    distinct: ['roomId'],
    select: {
      roomId: true,
    },
  });

  const bookedRoomCount = bookedRooms.length;
  const occupancyRate = totalRooms > 0 ? (bookedRoomCount / totalRooms) * 100 : 0;

  return {
    occupancyRate: Math.round(occupancyRate * 100) / 100, // Round to 2 decimal places
    totalRooms,
    bookedRooms: bookedRoomCount,
    availableRooms: totalRooms - bookedRoomCount,
    period: {
      start: startDate,
      end: endDate,
    },
  };
}

/**
 * Get tenant-wide revenue report
 */
export async function getTenantRevenueReport(
  tenantId: string,
  startDate: Date,
  endDate: Date
): Promise<RevenueReport> {
  const bookings = await prisma.booking.findMany({
    where: {
      hotel: {
        tenantId,
      },
      status: {
        in: ['CONFIRMED', 'COMPLETED'],
      },
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      totalPrice: true,
    },
  });

  const totalRevenue = bookings.reduce((sum, booking) => sum + booking.totalPrice, 0);
  const bookingCount = bookings.length;
  const averageBookingValue = bookingCount > 0 ? totalRevenue / bookingCount : 0;

  return {
    totalRevenue,
    bookingCount,
    averageBookingValue,
    period: {
      start: startDate,
      end: endDate,
    },
  };
}

/**
 * Get performance comparison across all hotels for a tenant
 */
export async function getHotelPerformanceComparison(
  tenantId: string,
  startDate: Date,
  endDate: Date
): Promise<HotelPerformance[]> {
  const hotels = await prisma.hotel.findMany({
    where: {
      tenantId,
    },
    include: {
      bookings: {
        where: {
          status: {
            in: ['CONFIRMED', 'COMPLETED'],
          },
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          totalPrice: true,
          roomId: true,
        },
      },
      rooms: {
        where: {
          available: true,
        },
        select: {
          id: true,
        },
      },
    },
  });

  return hotels.map((hotel) => {
    const revenue = hotel.bookings.reduce((sum, booking) => sum + booking.totalPrice, 0);
    const bookings = hotel.bookings.length;
    const uniqueRooms = new Set(hotel.bookings.map((b) => b.roomId)).size;
    const totalRooms = hotel.rooms.length;
    const occupancyRate = totalRooms > 0 ? (uniqueRooms / totalRooms) * 100 : 0;

    return {
      hotelId: hotel.id,
      hotelName: hotel.name,
      revenue,
      bookings,
      occupancyRate: Math.round(occupancyRate * 100) / 100,
    };
  });
}

/**
 * Get platform-wide statistics (for super admin)
 */
export async function getPlatformStatistics(): Promise<{
  totalRevenue: number;
  totalBookings: number;
  totalHotels: number;
  totalUsers: number;
  activeTenants: number;
}> {
  const [bookings, hotelCount, userCount, activeTenantCount] = await Promise.all([
    prisma.booking.findMany({
      where: {
        status: {
          in: ['CONFIRMED', 'COMPLETED'],
        },
      },
      select: {
        totalPrice: true,
      },
    }),
    prisma.hotel.count(),
    prisma.user.count(),
    prisma.tenant.count({
      where: {
        isActive: true,
      },
    }),
  ]);

  const totalRevenue = bookings.reduce((sum, booking) => sum + booking.totalPrice, 0);

  return {
    totalRevenue,
    totalBookings: bookings.length,
    totalHotels: hotelCount,
    totalUsers: userCount,
    activeTenants: activeTenantCount,
  };
}

/**
 * Get monthly revenue trend
 */
export async function getMonthlyRevenueTrend(
  hotelId: string,
  months: number = 6
): Promise<Array<{ month: string; revenue: number; bookings: number }>> {
  const trends: Array<{ month: string; revenue: number; bookings: number }> = [];

  for (let i = months - 1; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(new Date(), i));
    const monthEnd = endOfMonth(subMonths(new Date(), i));

    const report = await getRevenueReport(hotelId, monthStart, monthEnd);

    trends.push({
      month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      revenue: report.totalRevenue,
      bookings: report.bookingCount,
    });
  }

  return trends;
}

/**
 * Export bookings to CSV format
 */
export async function exportBookingsToCSV(
  tenantId: string,
  startDate?: Date,
  endDate?: Date
): Promise<string> {
  const bookings = await prisma.booking.findMany({
    where: {
      hotel: {
        tenantId,
      },
      ...(startDate && endDate
        ? {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          }
        : {}),
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      room: {
        select: {
          name: true,
        },
      },
      hotel: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // CSV header
  const headers = [
    'Booking ID',
    'Guest Name',
    'Guest Email',
    'Hotel',
    'Room',
    'Check In',
    'Check Out',
    'Total Price',
    'Status',
    'Payment ID',
    'Created At',
  ];

  // CSV rows
  const rows = bookings.map((booking) => [
    booking.id,
    booking.user.name || 'N/A',
    booking.user.email,
    booking.hotel.name,
    booking.room.name,
    booking.checkIn.toISOString().split('T')[0],
    booking.checkOut.toISOString().split('T')[0],
    booking.totalPrice.toFixed(2),
    booking.status,
    booking.paymentId || 'N/A',
    booking.createdAt.toISOString().replace('T', ' ').split('.')[0],
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n');

  return csvContent;
}

/**
 * Get popular rooms by booking count
 */
export async function getPopularRooms(
  tenantId: string,
  limit: number = 10
): Promise<Array<{
  roomId: string;
  roomName: string;
  bookingCount: number;
  totalRevenue: number;
}>> {
  const bookings = await prisma.booking.groupBy({
    by: ['roomId'],
    where: {
      room: {
        hotel: {
          tenantId,
        },
      },
      status: {
        not: 'CANCELLED',
      },
    },
    _count: {
      id: true,
    },
    _sum: {
      totalPrice: true,
    },
    orderBy: {
      _count: {
        id: 'desc',
      },
    },
    take: limit,
  });

  // Get room details
  const roomIds = bookings.map((b) => b.roomId);
  const rooms = await prisma.room.findMany({
    where: {
      id: {
        in: roomIds,
      },
    },
    select: {
      id: true,
      name: true,
    },
  });

  const roomMap = new Map(rooms.map((r) => [r.id, r.name]));

  return bookings.map((booking) => ({
    roomId: booking.roomId,
    roomName: roomMap.get(booking.roomId) || 'Unknown Room',
    bookingCount: booking._count.id,
    totalRevenue: booking._sum.totalPrice || 0,
  }));
}

/**
 * Get booking status breakdown
 */
export async function getBookingStatusBreakdown(
  tenantId: string
): Promise<Record<string, number>> {
  const bookings = await prisma.booking.groupBy({
    by: ['status'],
    where: {
      hotel: {
        tenantId,
      },
    },
    _count: {
      id: true,
    },
  });

  return bookings.reduce((acc, booking) => {
    acc[booking.status] = booking._count.id;
    return acc;
  }, {} as Record<string, number>);
}
