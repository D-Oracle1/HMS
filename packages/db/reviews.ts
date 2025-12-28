import { prisma } from './index'

export interface ReviewInput {
  hotelId: string
  userId: string
  rating: number
  comment?: string
  bookingId?: string
  // Category ratings (Booking.com style)
  cleanliness?: number
  location?: number
  service?: number
  value?: number
}

export interface PaginationParams {
  page?: number
  limit?: number
}

/**
 * Create a new review
 * @param data - Review data
 * @returns Created review
 */
export async function createReview(data: ReviewInput) {
  // Validate rating (1-5 stars)
  if (data.rating < 1 || data.rating > 5) {
    throw new Error('Rating must be between 1 and 5')
  }

  // If bookingId is provided, verify it exists and belongs to the user
  if (data.bookingId) {
    const booking = await prisma.booking.findFirst({
      where: {
        id: data.bookingId,
        userId: data.userId,
        hotelId: data.hotelId,
        status: 'COMPLETED', // Only allow reviews for completed stays
      },
    })

    if (!booking) {
      throw new Error(
        'Invalid booking ID or booking not completed'
      )
    }

    // Check if review already exists for this booking
    const existingReview = await prisma.review.findUnique({
      where: { bookingId: data.bookingId },
    })

    if (existingReview) {
      throw new Error('Review already exists for this booking')
    }
  }

  // Validate category ratings if provided
  const validateCategoryRating = (rating: number | undefined, name: string) => {
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      throw new Error(`${name} rating must be between 1 and 5`)
    }
  }

  validateCategoryRating(data.cleanliness, 'Cleanliness')
  validateCategoryRating(data.location, 'Location')
  validateCategoryRating(data.service, 'Service')
  validateCategoryRating(data.value, 'Value')

  // Create review
  const review = await prisma.review.create({
    data: {
      hotelId: data.hotelId,
      userId: data.userId,
      rating: data.rating,
      comment: data.comment,
      bookingId: data.bookingId,
      isVerified: !!data.bookingId, // Verified if linked to booking
      cleanliness: data.cleanliness,
      location: data.location,
      service: data.service,
      value: data.value,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
  })

  // Update hotel rating and review count
  await updateHotelRating(data.hotelId)

  return review
}

/**
 * Update hotel's average rating and review count
 * This should be called whenever a review is created, updated, or deleted
 * @param hotelId - Hotel ID to update
 */
export async function updateHotelRating(hotelId: string): Promise<void> {
  const result = await prisma.review.aggregate({
    where: { hotelId },
    _avg: {
      rating: true,
    },
    _count: {
      id: true,
    },
  })

  await prisma.hotel.update({
    where: { id: hotelId },
    data: {
      rating: result._avg.rating || 0,
      reviewCount: result._count.id,
    },
  })
}

/**
 * Check if a user can review a hotel
 * User can review if they have a completed booking at the hotel
 * @param userId - User ID
 * @param hotelId - Hotel ID
 * @returns true if user can review, false otherwise
 */
export async function canUserReview(
  userId: string,
  hotelId: string
): Promise<boolean> {
  const completedBooking = await prisma.booking.findFirst({
    where: {
      userId,
      hotelId,
      status: 'COMPLETED',
    },
  })

  return !!completedBooking
}

/**
 * Get reviews for a hotel with pagination
 * @param hotelId - Hotel ID
 * @param params - Pagination parameters
 * @returns Reviews with pagination info
 */
export async function getHotelReviews(
  hotelId: string,
  params: PaginationParams = {}
) {
  const page = params.page || 1
  const limit = params.limit || 10
  const skip = (page - 1) * limit

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { hotelId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    }),
    prisma.review.count({
      where: { hotelId },
    }),
  ])

  return {
    reviews,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  }
}

/**
 * Get reviews by user
 * @param userId - User ID
 * @param params - Pagination parameters
 * @returns User's reviews with pagination
 */
export async function getUserReviews(
  userId: string,
  params: PaginationParams = {}
) {
  const page = params.page || 1
  const limit = params.limit || 10
  const skip = (page - 1) * limit

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { userId },
      include: {
        hotel: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    }),
    prisma.review.count({
      where: { userId },
    }),
  ])

  return {
    reviews,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  }
}

/**
 * Update a review
 * @param reviewId - Review ID
 * @param userId - User ID (for authorization)
 * @param data - Updated review data
 * @returns Updated review
 */
export async function updateReview(
  reviewId: string,
  userId: string,
  data: {
    rating?: number
    comment?: string
    cleanliness?: number
    location?: number
    service?: number
    value?: number
  }
) {
  // Verify review belongs to user
  const review = await prisma.review.findFirst({
    where: {
      id: reviewId,
      userId,
    },
  })

  if (!review) {
    throw new Error('Review not found or unauthorized')
  }

  // Validate rating if provided
  if (data.rating && (data.rating < 1 || data.rating > 5)) {
    throw new Error('Rating must be between 1 and 5')
  }

  // Validate category ratings if provided
  const validateCategoryRating = (rating: number | undefined, name: string) => {
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      throw new Error(`${name} rating must be between 1 and 5`)
    }
  }

  validateCategoryRating(data.cleanliness, 'Cleanliness')
  validateCategoryRating(data.location, 'Location')
  validateCategoryRating(data.service, 'Service')
  validateCategoryRating(data.value, 'Value')

  const updated = await prisma.review.update({
    where: { id: reviewId },
    data: {
      ...(data.rating && { rating: data.rating }),
      ...(data.comment !== undefined && { comment: data.comment }),
      ...(data.cleanliness !== undefined && { cleanliness: data.cleanliness }),
      ...(data.location !== undefined && { location: data.location }),
      ...(data.service !== undefined && { service: data.service }),
      ...(data.value !== undefined && { value: data.value }),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
  })

  // Update hotel rating if rating changed
  if (data.rating) {
    await updateHotelRating(review.hotelId)
  }

  return updated
}

/**
 * Delete a review
 * @param reviewId - Review ID
 * @param userId - User ID (for authorization)
 */
export async function deleteReview(
  reviewId: string,
  userId: string
): Promise<void> {
  // Verify review belongs to user
  const review = await prisma.review.findFirst({
    where: {
      id: reviewId,
      userId,
    },
  })

  if (!review) {
    throw new Error('Review not found or unauthorized')
  }

  await prisma.review.delete({
    where: { id: reviewId },
  })

  // Update hotel rating
  await updateHotelRating(review.hotelId)
}

/**
 * Get rating distribution for a hotel
 * Returns count of reviews for each star rating (1-5)
 * @param hotelId - Hotel ID
 * @returns Rating distribution
 */
export async function getRatingDistribution(hotelId: string): Promise<{
  1: number
  2: number
  3: number
  4: number
  5: number
  total: number
  average: number
}> {
  const reviews = await prisma.review.findMany({
    where: { hotelId },
    select: { rating: true },
  })

  const distribution = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    total: reviews.length,
    average: 0,
  }

  reviews.forEach((review) => {
    distribution[review.rating as 1 | 2 | 3 | 4 | 5]++
  })

  if (reviews.length > 0) {
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0)
    distribution.average = Math.round((sum / reviews.length) * 10) / 10
  }

  return distribution
}

/**
 * Get featured reviews (verified, high-rated reviews)
 * @param hotelId - Hotel ID
 * @param limit - Maximum number of reviews (default: 3)
 * @returns Featured reviews
 */
export async function getFeaturedReviews(
  hotelId: string,
  limit: number = 3
) {
  return await prisma.review.findMany({
    where: {
      hotelId,
      isVerified: true,
      rating: {
        gte: 4, // Only 4 and 5 star reviews
      },
      comment: {
        not: null, // Must have a comment
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  })
}

/**
 * Get pending reviews for a user
 * Returns completed bookings that haven't been reviewed yet
 * @param userId - User ID
 * @returns Bookings pending review
 */
export async function getPendingReviews(userId: string) {
  const completedBookings = await prisma.booking.findMany({
    where: {
      userId,
      status: 'COMPLETED',
      review: null, // No review yet
    },
    include: {
      hotel: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
        },
      },
      room: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      checkOut: 'desc',
    },
  })

  return completedBookings
}

/**
 * Get category rating averages for a hotel (Booking.com style)
 * @param hotelId - Hotel ID
 * @returns Average ratings for each category
 */
export async function getCategoryRatings(hotelId: string): Promise<{
  cleanliness: number
  location: number
  service: number
  value: number
  overall: number
  count: number
}> {
  const result = await prisma.review.aggregate({
    where: {
      hotelId,
      isVerified: true // Only count verified reviews for category ratings
    },
    _avg: {
      cleanliness: true,
      location: true,
      service: true,
      value: true,
      rating: true,
    },
    _count: {
      id: true,
    },
  })

  return {
    cleanliness: Math.round((result._avg.cleanliness || 0) * 10) / 10,
    location: Math.round((result._avg.location || 0) * 10) / 10,
    service: Math.round((result._avg.service || 0) * 10) / 10,
    value: Math.round((result._avg.value || 0) * 10) / 10,
    overall: Math.round((result._avg.rating || 0) * 10) / 10,
    count: result._count.id,
  }
}
