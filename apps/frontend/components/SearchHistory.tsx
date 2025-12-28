'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface SearchHistoryItem {
  query: string
  location?: string
  checkIn?: string
  checkOut?: string
  guests?: number
  timestamp: string
}

export function SearchHistory() {
  const router = useRouter()
  const [history, setHistory] = useState<SearchHistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchSearchHistory()
  }, [])

  const fetchSearchHistory = async () => {
    try {
      // In a real implementation, this would be an API call
      // For now, load from localStorage as a fallback
      const stored = localStorage.getItem('searchHistory')
      if (stored) {
        setHistory(JSON.parse(stored))
      }
    } catch (error) {
      console.error('Error fetching search history:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearchClick = (item: SearchHistoryItem) => {
    const params = new URLSearchParams()
    if (item.query) params.set('q', item.query)
    if (item.location) params.set('location', item.location)
    if (item.checkIn) params.set('checkIn', item.checkIn)
    if (item.checkOut) params.set('checkOut', item.checkOut)
    if (item.guests) params.set('guests', item.guests.toString())

    router.push(`/search?${params.toString()}`)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const getTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) {
      return `${diffMins}m ago`
    } else if (diffHours < 24) {
      return `${diffHours}h ago`
    } else {
      return `${diffDays}d ago`
    }
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-slate-200 rounded-lg" />
        ))}
      </div>
    )
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <svg
          className="w-12 h-12 mx-auto mb-3 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <p>No recent searches</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Recent Searches</h3>
        <button
          onClick={() => {
            localStorage.removeItem('searchHistory')
            setHistory([])
          }}
          className="text-sm text-slate-600 hover:text-slate-900"
        >
          Clear all
        </button>
      </div>

      {history.slice(0, 5).map((item, index) => (
        <button
          key={index}
          onClick={() => handleSearchClick(item)}
          className="w-full flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:border-orange-300 hover:bg-orange-50 transition-all text-left"
        >
          <div className="flex-shrink-0 w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
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
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {item.query && (
                <span className="font-medium text-slate-900 truncate">
                  {item.query}
                </span>
              )}
              {item.location && (
                <span className="text-sm text-slate-600 truncate">
                  in {item.location}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-sm text-slate-600">
              {item.checkIn && item.checkOut && (
                <span>
                  {formatDate(item.checkIn)} - {formatDate(item.checkOut)}
                </span>
              )}
              {item.guests && (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  {item.guests}
                </span>
              )}
              <span className="ml-auto text-xs">
                {getTimeAgo(item.timestamp)}
              </span>
            </div>
          </div>

          <div className="flex-shrink-0">
            <svg
              className="w-5 h-5 text-slate-400"
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
          </div>
        </button>
      ))}
    </div>
  )
}
