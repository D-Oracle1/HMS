import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import {
  getTenantRevenueReport,
  getOccupancyReport,
  getHotelPerformanceComparison,
  getPopularRooms,
  getBookingStatusBreakdown,
} from 'db/analytics';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;

    // Only admins can access analytics
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!user.tenantId) {
      return NextResponse.json({ error: 'No tenant associated' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';

    // Calculate date range based on period
    let startDate: Date;
    let endDate: Date = new Date();

    switch (period) {
      case 'week':
        startDate = subMonths(endDate, 0);
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate = startOfMonth(endDate);
        endDate = endOfMonth(endDate);
        break;
      case 'quarter':
        startDate = subMonths(endDate, 3);
        break;
      case 'year':
        startDate = subMonths(endDate, 12);
        break;
      default:
        startDate = startOfMonth(endDate);
        endDate = endOfMonth(endDate);
    }

    // Fetch all analytics data in parallel
    const [
      revenueReport,
      hotelPerformance,
      popularRooms,
      bookingStatusBreakdown,
    ] = await Promise.all([
      getTenantRevenueReport(user.tenantId, startDate, endDate),
      getHotelPerformanceComparison(user.tenantId, startDate, endDate),
      getPopularRooms(user.tenantId, 5),
      getBookingStatusBreakdown(user.tenantId),
    ]);

    return NextResponse.json({
      period,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      revenue: revenueReport,
      hotels: hotelPerformance,
      popularRooms,
      bookingStatus: bookingStatusBreakdown,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
