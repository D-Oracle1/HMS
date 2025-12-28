import { NextRequest, NextResponse } from 'next/server'
import { checkAvailability, getRoomCalendar } from 'db/availability'

/**
 * Check room availability for specific dates or get monthly calendar
 * GET /api/rooms/[roomId]/availability
 *
 * Query parameters:
 * For availability check:
 * - checkIn: string (ISO date) - required with checkOut
 * - checkOut: string (ISO date) - required with checkIn
 *
 * For calendar view:
 * - year: number - required with month
 * - month: number (1-12) - required with year
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const { roomId } = params
    const { searchParams } = new URL(request.url)

    const checkIn = searchParams.get('checkIn')
    const checkOut = searchParams.get('checkOut')
    const year = searchParams.get('year')
    const month = searchParams.get('month')

    // Calendar view
    if (year && month) {
      const yearNum = parseInt(year)
      const monthNum = parseInt(month)

      if (isNaN(yearNum) || isNaN(monthNum)) {
        return NextResponse.json(
          {
            error: 'Invalid parameters',
            message: 'Year and month must be numbers',
          },
          { status: 400 }
        )
      }

      if (monthNum < 1 || monthNum > 12) {
        return NextResponse.json(
          {
            error: 'Invalid month',
            message: 'Month must be between 1 and 12',
          },
          { status: 400 }
        )
      }

      const calendar = await getRoomCalendar(roomId, yearNum, monthNum)

      return NextResponse.json(
        {
          roomId,
          year: yearNum,
          month: monthNum,
          calendar,
        },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          },
        }
      )
    }

    // Availability check for specific dates
    if (checkIn && checkOut) {
      const checkInDate = new Date(checkIn)
      const checkOutDate = new Date(checkOut)

      // Validate dates
      if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
        return NextResponse.json(
          {
            error: 'Invalid dates',
            message: 'Check-in and check-out must be valid dates',
          },
          { status: 400 }
        )
      }

      if (checkInDate >= checkOutDate) {
        return NextResponse.json(
          {
            error: 'Invalid date range',
            message: 'Check-in must be before check-out',
          },
          { status: 400 }
        )
      }

      if (checkInDate < new Date()) {
        return NextResponse.json(
          {
            error: 'Invalid check-in date',
            message: 'Check-in cannot be in the past',
          },
          { status: 400 }
        )
      }

      const available = await checkAvailability(
        roomId,
        checkInDate,
        checkOutDate
      )

      return NextResponse.json(
        {
          roomId,
          checkIn,
          checkOut,
          available,
        },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
          },
        }
      )
    }

    // Missing required parameters
    return NextResponse.json(
      {
        error: 'Missing parameters',
        message:
          'Provide either (checkIn and checkOut) or (year and month)',
      },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Availability API error:', error)

    if (error.message.includes('not found')) {
      return NextResponse.json(
        {
          error: 'Room not found',
          message: error.message,
        },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to check availability',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
