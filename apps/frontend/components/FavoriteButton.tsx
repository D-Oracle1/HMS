'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface FavoriteButtonProps {
  hotelId: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'icon' | 'button'
  className?: string
}

export function FavoriteButton({
  hotelId,
  size = 'md',
  variant = 'icon',
  className = ''
}: FavoriteButtonProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [isFavorited, setIsFavorited] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Check favorite status on mount
  useEffect(() => {
    if (session?.user?.id) {
      checkFavoriteStatus()
    }
  }, [session, hotelId])

  const checkFavoriteStatus = async () => {
    try {
      const response = await fetch(`/api/favorites/${hotelId}`)
      if (response.ok) {
        const data = await response.json()
        setIsFavorited(data.isFavorited)
      }
    } catch (error) {
      console.error('Error checking favorite status:', error)
    }
  }

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Require authentication
    if (!session?.user) {
      router.push('/login?callbackUrl=' + encodeURIComponent(window.location.pathname))
      return
    }

    setIsLoading(true)

    try {
      const url = '/api/favorites'
      const method = isFavorited ? 'DELETE' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ hotelId })
      })

      if (response.ok) {
        setIsFavorited(!isFavorited)
      } else {
        const error = await response.json()
        console.error('Error toggling favorite:', error)
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={toggleFavorite}
        disabled={isLoading}
        className={`
          ${sizeClasses[size]}
          rounded-full
          flex items-center justify-center
          transition-all
          ${
            isFavorited
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-white/90 hover:bg-white text-slate-600 hover:text-red-500'
          }
          shadow-md hover:shadow-lg
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
        title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
      >
        <svg
          className={`${iconSizes[size]} transition-transform ${isLoading ? 'animate-pulse' : ''} ${isFavorited ? 'fill-current' : ''}`}
          fill={isFavorited ? 'currentColor' : 'none'}
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      </button>
    )
  }

  // Button variant
  return (
    <button
      onClick={toggleFavorite}
      disabled={isLoading}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg
        transition-all
        ${
          isFavorited
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      <svg
        className={`${iconSizes[size]} ${isLoading ? 'animate-pulse' : ''}`}
        fill={isFavorited ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      <span className="font-medium">
        {isFavorited ? 'Saved' : 'Save'}
      </span>
    </button>
  )
}
