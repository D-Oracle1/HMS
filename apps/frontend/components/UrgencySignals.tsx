'use client'

import { useEffect, useState } from 'react'

interface UrgencySignal {
  type: 'bookings' | 'views' | 'availability'
  message: string
  priority: 'high' | 'medium' | 'low'
}

interface UrgencySignalsProps {
  hotelId: string
  compact?: boolean
  className?: string
}

export function UrgencySignals({
  hotelId,
  compact = false,
  className = ''
}: UrgencySignalsProps) {
  const [signals, setSignals] = useState<UrgencySignal[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchUrgencySignals()
  }, [hotelId])

  const fetchUrgencySignals = async () => {
    try {
      // In a real implementation, this would be an API call
      // For now, we'll simulate it with a timeout
      await new Promise(resolve => setTimeout(resolve, 500))

      // Mock data - replace with actual API call
      const mockSignals: UrgencySignal[] = [
        {
          type: 'bookings',
          message: 'Booked 8 times in the last 24 hours',
          priority: 'medium'
        },
        {
          type: 'views',
          message: '15 people viewing right now',
          priority: 'medium'
        },
        {
          type: 'availability',
          message: 'Only 3 rooms left!',
          priority: 'high'
        }
      ]

      setSignals(mockSignals)
    } catch (error) {
      console.error('Error fetching urgency signals:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading || signals.length === 0) {
    return null
  }

  const getIcon = (type: UrgencySignal['type']) => {
    switch (type) {
      case 'bookings':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )
      case 'views':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        )
      case 'availability':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        )
    }
  }

  const getPriorityStyles = (priority: UrgencySignal['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-50 text-red-700 border-red-200'
      case 'medium':
        return 'bg-orange-50 text-orange-700 border-orange-200'
      case 'low':
        return 'bg-blue-50 text-blue-700 border-blue-200'
    }
  }

  if (compact) {
    // Show only the highest priority signal
    const topSignal = signals.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })[0]

    return (
      <div
        className={`
          inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border
          ${getPriorityStyles(topSignal.priority)}
          ${className}
        `}
      >
        {getIcon(topSignal.type)}
        <span>{topSignal.message}</span>
      </div>
    )
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {signals.map((signal, index) => (
        <div
          key={index}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border
            ${getPriorityStyles(signal.priority)}
          `}
        >
          {getIcon(signal.type)}
          <span>{signal.message}</span>
        </div>
      ))}
    </div>
  )
}

// Badge variant for displaying on hotel cards
export function UrgencyBadge({
  type,
  count
}: {
  type: 'hot' | 'popular' | 'limited'
  count?: number
}) {
  const getBadgeContent = () => {
    switch (type) {
      case 'hot':
        return {
          icon: '🔥',
          text: 'Hot Deal',
          bgColor: 'bg-red-500',
          textColor: 'text-white'
        }
      case 'popular':
        return {
          icon: '⭐',
          text: count ? `${count} booked today` : 'Popular',
          bgColor: 'bg-orange-500',
          textColor: 'text-white'
        }
      case 'limited':
        return {
          icon: '⚡',
          text: count ? `Only ${count} left` : 'Limited',
          bgColor: 'bg-yellow-500',
          textColor: 'text-slate-900'
        }
    }
  }

  const badge = getBadgeContent()

  return (
    <div
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold
        ${badge.bgColor} ${badge.textColor}
        shadow-md
      `}
    >
      <span>{badge.icon}</span>
      <span>{badge.text}</span>
    </div>
  )
}
