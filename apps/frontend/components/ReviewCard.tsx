'use client'

import { Star, User, ThumbsUp, CheckCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface ReviewCardProps {
  review: {
    id: string
    rating: number
    comment: string | null
    isVerified: boolean
    createdAt: Date | string
    user: {
      name: string | null
      email: string
      avatar?: string | null
    }
  }
}

export function ReviewCard({ review }: ReviewCardProps) {
  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-600'
            }`}
          />
        ))}
      </div>
    )
  }

  const createdDate =
    typeof review.createdAt === 'string'
      ? new Date(review.createdAt)
      : review.createdAt

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-xl p-5">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {review.user.avatar ? (
            <img
              src={review.user.avatar}
              alt={review.user.name || 'User'}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
          )}
        </div>

        {/* Review Content */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-white">
                  {review.user.name || 'Anonymous'}
                </h4>
                {review.isVerified && (
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-green-500/20 border border-green-500/30 rounded-full">
                    <CheckCircle className="w-3 h-3 text-green-400" />
                    <span className="text-xs text-green-400 font-medium">
                      Verified Stay
                    </span>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-400">
                {formatDistanceToNow(createdDate, { addSuffix: true })}
              </p>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2">
              {renderStars(review.rating)}
              <span className="text-sm font-semibold text-white">
                {review.rating}.0
              </span>
            </div>
          </div>

          {/* Comment */}
          {review.comment && (
            <p className="text-gray-300 leading-relaxed">{review.comment}</p>
          )}

          {/* Helpful Button */}
          <button className="flex items-center gap-2 mt-3 px-3 py-1.5 text-sm text-gray-400 hover:text-white bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors">
            <ThumbsUp className="w-4 h-4" />
            <span>Helpful</span>
          </button>
        </div>
      </div>
    </div>
  )
}
