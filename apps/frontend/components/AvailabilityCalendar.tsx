'use client'

import { useState } from 'react'

interface AvailabilityData {
  date: string
  available: boolean
  price?: number
  minStay?: number
}

interface AvailabilityCalendarProps {
  roomId: string
  availability: AvailabilityData[]
  onDateSelect?: (startDate: string, endDate: string) => void
  selectedStartDate?: string
  selectedEndDate?: string
  currency?: string
}

export function AvailabilityCalendar({
  roomId,
  availability,
  onDateSelect,
  selectedStartDate,
  selectedEndDate,
  currency = '₦'
}: AvailabilityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectingStart, setSelectingStart] = useState<string | null>(
    selectedStartDate || null
  )
  const [selectingEnd, setSelectingEnd] = useState<string | null>(
    selectedEndDate || null
  )

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate()

  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay()

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ]

  const formatDate = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const getAvailabilityForDate = (date: string): AvailabilityData | undefined => {
    return availability.find(a => a.date === date)
  }

  const handleDateClick = (date: string, isAvailable: boolean) => {
    if (!isAvailable) return

    if (!selectingStart || (selectingStart && selectingEnd)) {
      // Start new selection
      setSelectingStart(date)
      setSelectingEnd(null)
    } else {
      // Complete selection
      const start = new Date(selectingStart)
      const end = new Date(date)

      if (end >= start) {
        setSelectingEnd(date)
        if (onDateSelect) {
          onDateSelect(selectingStart, date)
        }
      } else {
        // If selected end is before start, swap them
        setSelectingStart(date)
        setSelectingEnd(selectingStart)
        if (onDateSelect) {
          onDateSelect(date, selectingStart)
        }
      }
    }
  }

  const isInSelectedRange = (date: string) => {
    if (!selectingStart) return false
    if (!selectingEnd) return date === selectingStart

    const current = new Date(date)
    const start = new Date(selectingStart)
    const end = new Date(selectingEnd)

    return current >= start && current <= end
  }

  const nextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    )
  }

  const prevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    )
  }

  const clearSelection = () => {
    setSelectingStart(null)
    setSelectingEnd(null)
  }

  const renderCalendar = () => {
    const days = []
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()

    // Empty cells for days before month starts
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="p-2" />)
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDate(year, month, day)
      const availData = getAvailabilityForDate(dateStr)
      const isAvailable = availData?.available ?? false
      const price = availData?.price
      const isSelected = isInSelectedRange(dateStr)
      const isToday =
        new Date().toISOString().split('T')[0] === dateStr

      days.push(
        <button
          key={dateStr}
          onClick={() => handleDateClick(dateStr, isAvailable)}
          disabled={!isAvailable}
          className={`
            p-2 rounded-lg text-sm transition-all relative
            ${
              isAvailable
                ? 'hover:bg-orange-100 cursor-pointer'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }
            ${isSelected ? 'bg-orange-500 text-white hover:bg-orange-600' : ''}
            ${isToday && !isSelected ? 'ring-2 ring-orange-400' : ''}
          `}
        >
          <div className="font-semibold">{day}</div>
          {isAvailable && price && (
            <div className={`text-xs ${isSelected ? 'text-white' : 'text-slate-600'}`}>
              {currency}{price.toLocaleString()}
            </div>
          )}
          {!isAvailable && (
            <div className="text-xs text-slate-500">N/A</div>
          )}
        </button>
      )
    }

    return days
  }

  const selectedNights = () => {
    if (!selectingStart || !selectingEnd) return 0
    const start = new Date(selectingStart)
    const end = new Date(selectingEnd)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const totalPrice = () => {
    if (!selectingStart || !selectingEnd) return 0

    let total = 0
    const start = new Date(selectingStart)
    const end = new Date(selectingEnd)

    for (
      let d = new Date(start);
      d <= end;
      d.setDate(d.getDate() + 1)
    ) {
      const dateStr = d.toISOString().split('T')[0]
      const availData = getAvailabilityForDate(dateStr)
      if (availData?.price) {
        total += availData.price
      }
    }

    return total
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-slate-900">
          Select Dates
        </h3>
        {(selectingStart || selectingEnd) && (
          <button
            onClick={clearSelection}
            className="text-sm text-orange-600 hover:text-orange-700 font-medium"
          >
            Clear selection
          </button>
        )}
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={prevMonth}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <svg
            className="w-5 h-5 text-slate-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <h4 className="text-lg font-semibold text-slate-900">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h4>

        <button
          onClick={nextMonth}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <svg
            className="w-5 h-5 text-slate-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div
            key={day}
            className="text-center text-xs font-semibold text-slate-600 p-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>

      {/* Selection Summary */}
      {selectingStart && selectingEnd && (
        <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Check-in:</span>
              <span className="font-semibold text-slate-900">
                {new Date(selectingStart).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Check-out:</span>
              <span className="font-semibold text-slate-900">
                {new Date(selectingEnd).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Nights:</span>
              <span className="font-semibold text-slate-900">
                {selectedNights()}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-orange-300">
              <span className="text-slate-900 font-semibold">Total:</span>
              <span className="text-lg font-bold text-orange-600">
                {currency}{totalPrice().toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-500 rounded" />
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 ring-2 ring-orange-400 rounded" />
          <span>Today</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-slate-100 rounded" />
          <span>Unavailable</span>
        </div>
      </div>
    </div>
  )
}
