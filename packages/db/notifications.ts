import { prisma } from './index'

/**
 * Notification helper functions
 */

export enum NotificationType {
  BOOKING_CONFIRMED = 'BOOKING_CONFIRMED',
  BOOKING_CANCELLED = 'BOOKING_CANCELLED',
  BOOKING_REMINDER = 'BOOKING_REMINDER',
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  REFUND_PROCESSED = 'REFUND_PROCESSED',
  REVIEW_REMINDER = 'REVIEW_REMINDER',
  REVIEW_RESPONSE = 'REVIEW_RESPONSE',
  SPECIAL_OFFER = 'SPECIAL_OFFER',
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT',
}

export interface CreateNotificationParams {
  userId: string
  type: NotificationType | string
  title: string
  message: string
  data?: Record<string, any>
}

/**
 * Create a notification for a user
 */
export async function createNotification(
  params: CreateNotificationParams
): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        data: params.data ? JSON.stringify(params.data) : null,
      },
    })
  } catch (error) {
    console.error('Failed to create notification:', error)
    // Don't throw - notifications should not break the application
  }
}

/**
 * Send booking confirmation notification
 */
export async function notifyBookingConfirmed(
  userId: string,
  bookingId: string,
  hotelName: string,
  checkIn: Date,
  checkOut: Date
): Promise<void> {
  await createNotification({
    userId,
    type: NotificationType.BOOKING_CONFIRMED,
    title: 'Booking Confirmed!',
    message: `Your booking at ${hotelName} has been confirmed. Check-in: ${checkIn.toLocaleDateString()}`,
    data: {
      bookingId,
      hotelName,
      checkIn: checkIn.toISOString(),
      checkOut: checkOut.toISOString(),
    },
  })
}

/**
 * Send booking cancellation notification
 */
export async function notifyBookingCancelled(
  userId: string,
  bookingId: string,
  hotelName: string,
  refundAmount: number
): Promise<void> {
  await createNotification({
    userId,
    type: NotificationType.BOOKING_CANCELLED,
    title: 'Booking Cancelled',
    message: `Your booking at ${hotelName} has been cancelled. ${refundAmount > 0 ? `Refund of ₦${refundAmount.toLocaleString()} will be processed.` : ''}`,
    data: {
      bookingId,
      hotelName,
      refundAmount,
    },
  })
}

/**
 * Send payment success notification
 */
export async function notifyPaymentSuccess(
  userId: string,
  bookingId: string,
  amount: number,
  hotelName: string
): Promise<void> {
  await createNotification({
    userId,
    type: NotificationType.PAYMENT_SUCCESS,
    title: 'Payment Successful',
    message: `Your payment of ₦${amount.toLocaleString()} for ${hotelName} has been processed successfully.`,
    data: {
      bookingId,
      amount,
      hotelName,
    },
  })
}

/**
 * Send payment failed notification
 */
export async function notifyPaymentFailed(
  userId: string,
  bookingId: string,
  amount: number,
  reason?: string
): Promise<void> {
  await createNotification({
    userId,
    type: NotificationType.PAYMENT_FAILED,
    title: 'Payment Failed',
    message: `Your payment of ₦${amount.toLocaleString()} failed. ${reason || 'Please try again.'}`,
    data: {
      bookingId,
      amount,
      reason,
    },
  })
}

/**
 * Send refund processed notification
 */
export async function notifyRefundProcessed(
  userId: string,
  bookingId: string,
  refundAmount: number,
  hotelName: string
): Promise<void> {
  await createNotification({
    userId,
    type: NotificationType.REFUND_PROCESSED,
    title: 'Refund Processed',
    message: `Your refund of ₦${refundAmount.toLocaleString()} for ${hotelName} has been processed. It will appear in your account within 5-10 business days.`,
    data: {
      bookingId,
      refundAmount,
      hotelName,
    },
  })
}

/**
 * Send check-in reminder notification
 */
export async function notifyCheckInReminder(
  userId: string,
  bookingId: string,
  hotelName: string,
  checkIn: Date,
  roomName: string
): Promise<void> {
  await createNotification({
    userId,
    type: NotificationType.BOOKING_REMINDER,
    title: 'Check-in Reminder',
    message: `Don't forget! Your check-in at ${hotelName} (${roomName}) is tomorrow at ${checkIn.toLocaleTimeString()}.`,
    data: {
      bookingId,
      hotelName,
      roomName,
      checkIn: checkIn.toISOString(),
    },
  })
}

/**
 * Send review reminder notification
 */
export async function notifyReviewReminder(
  userId: string,
  bookingId: string,
  hotelName: string
): Promise<void> {
  await createNotification({
    userId,
    type: NotificationType.REVIEW_REMINDER,
    title: 'Share Your Experience',
    message: `How was your stay at ${hotelName}? Leave a review to help other travelers.`,
    data: {
      bookingId,
      hotelName,
    },
  })
}

/**
 * Get user's unread notification count
 */
export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: {
      userId,
      read: false,
    },
  })
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string): Promise<void> {
  await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  })
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string): Promise<number> {
  const result = await prisma.notification.updateMany({
    where: {
      userId,
      read: false,
    },
    data: {
      read: true,
    },
  })

  return result.count
}

/**
 * Delete old read notifications (cleanup task)
 * Deletes notifications older than 30 days that have been read
 */
export async function cleanupOldNotifications(): Promise<number> {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const result = await prisma.notification.deleteMany({
    where: {
      read: true,
      createdAt: {
        lt: thirtyDaysAgo,
      },
    },
  })

  return result.count
}
