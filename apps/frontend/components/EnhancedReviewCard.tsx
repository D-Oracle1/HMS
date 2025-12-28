'use client'

interface CategoryRating {
  label: string
  score: number
  icon: React.ReactNode
}

interface EnhancedReviewCardProps {
  review: {
    id: string
    rating: number
    comment?: string | null
    cleanliness?: number | null
    location?: number | null
    service?: number | null
    value?: number | null
    isVerified: boolean
    createdAt: Date | string
    user: {
      name?: string | null
      avatar?: string | null
    }
  }
  showCategories?: boolean
}

export function EnhancedReviewCard({
  review,
  showCategories = true
}: EnhancedReviewCardProps) {
  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <svg
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'
        }`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
        />
      </svg>
    ))
  }

  const categoryRatings: CategoryRating[] = []

  if (review.cleanliness) {
    categoryRatings.push({
      label: 'Cleanliness',
      score: review.cleanliness,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      )
    })
  }

  if (review.location) {
    categoryRatings.push({
      label: 'Location',
      score: review.location,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      )
    })
  }

  if (review.service) {
    categoryRatings.push({
      label: 'Service',
      score: review.service,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      )
    })
  }

  if (review.value) {
    categoryRatings.push({
      label: 'Value for Money',
      score: review.value,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      )
    })
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          {review.user.avatar ? (
            <img
              src={review.user.avatar}
              alt={review.user.name || 'User'}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <span className="text-orange-600 font-semibold text-sm">
                {(review.user.name || 'U')[0].toUpperCase()}
              </span>
            </div>
          )}

          {/* User Info */}
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-slate-900">
                {review.user.name || 'Anonymous'}
              </h4>
              {review.isVerified && (
                <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Verified
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500">{formatDate(review.createdAt)}</p>
          </div>
        </div>

        {/* Overall Rating */}
        <div className="flex items-center gap-1">
          {renderStars(review.rating)}
        </div>
      </div>

      {/* Comment */}
      {review.comment && (
        <p className="text-slate-700 leading-relaxed">{review.comment}</p>
      )}

      {/* Category Ratings */}
      {showCategories && categoryRatings.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-200">
          {categoryRatings.map((category) => (
            <div key={category.label} className="space-y-2">
              <div className="flex items-center gap-2 text-slate-600">
                {category.icon}
                <span className="text-sm font-medium">{category.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-orange-500 h-2 rounded-full"
                    style={{ width: `${(category.score / 5) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-slate-900">
                  {category.score.toFixed(1)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Category Rating Summary Component
export function CategoryRatingSummary({
  ratings
}: {
  ratings: {
    cleanliness: number
    location: number
    service: number
    value: number
    overall: number
    count: number
  }
}) {
  const categories = [
    { label: 'Cleanliness', score: ratings.cleanliness, color: 'blue' },
    { label: 'Location', score: ratings.location, color: 'green' },
    { label: 'Service', score: ratings.service, color: 'purple' },
    { label: 'Value', score: ratings.value, color: 'orange' }
  ]

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900">Guest Ratings</h3>
        <div className="text-center">
          <div className="text-3xl font-bold text-orange-600">
            {ratings.overall.toFixed(1)}
          </div>
          <div className="text-sm text-slate-600">{ratings.count} reviews</div>
        </div>
      </div>

      <div className="space-y-4">
        {categories.map((category) => (
          <div key={category.label} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">
                {category.label}
              </span>
              <span className="text-sm font-semibold text-slate-900">
                {category.score.toFixed(1)}
              </span>
            </div>
            <div className="flex-1 bg-slate-200 rounded-full h-2">
              <div
                className="bg-orange-500 h-2 rounded-full transition-all"
                style={{ width: `${(category.score / 5) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
