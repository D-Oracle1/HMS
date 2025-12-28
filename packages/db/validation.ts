import { z } from 'zod';

/**
 * Validation schemas for API requests
 */

// User validation
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  tenantId: z.string().optional(),
});

// Booking validation

// Frontend checkout schema (for guest-provided data)
export const bookingSchema = z.object({
  roomId: z.string().min(1, 'Room ID is required'),
  hotelId: z.string().min(1, 'Hotel ID is required'),
  checkIn: z.string().min(1, 'Check-in date is required'),
  checkOut: z.string().min(1, 'Check-out date is required'),
  guestName: z.string().min(2, 'Guest name must be at least 2 characters'),
  guestEmail: z.string().email('Invalid email address'),
  guestPhone: z.string().min(10, 'Phone number must be at least 10 characters'),
  guests: z.number().int().positive('Number of guests must be at least 1'),
  specialRequests: z.string().optional(),
}).refine(
  (data) => new Date(data.checkOut) > new Date(data.checkIn),
  {
    message: 'Check-out date must be after check-in date',
    path: ['checkOut'],
  }
);

// Admin booking creation schema (with userId and totalPrice)
export const createBookingSchema = z.object({
  roomId: z.string().uuid('Invalid room ID'),
  checkIn: z.string().datetime('Invalid check-in date'),
  checkOut: z.string().datetime('Invalid check-out date'),
  userId: z.string().uuid('Invalid user ID'),
  totalPrice: z.number().positive('Total price must be positive'),
}).refine(
  (data) => new Date(data.checkOut) > new Date(data.checkIn),
  {
    message: 'Check-out date must be after check-in date',
    path: ['checkOut'],
  }
);

export const updateBookingSchema = z.object({
  checkIn: z.string().datetime().optional(),
  checkOut: z.string().datetime().optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']).optional(),
});

// Room validation
export const createRoomSchema = z.object({
  name: z.string().min(1, 'Room name is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.number().positive('Price must be positive'),
  capacity: z.number().int().positive('Capacity must be a positive integer'),
  hotelId: z.string().uuid('Invalid hotel ID'),
  imageUrl: z.string().url().optional(),
  available: z.boolean().optional(),
});

export const updateRoomSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(10).optional(),
  price: z.number().positive().optional(),
  capacity: z.number().int().positive().optional(),
  imageUrl: z.string().url().optional(),
  available: z.boolean().optional(),
});

// Hotel validation
export const createHotelSchema = z.object({
  name: z.string().min(2, 'Hotel name must be at least 2 characters'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  tenantId: z.string().uuid('Invalid tenant ID'),
});

export const updateHotelSchema = z.object({
  name: z.string().min(2).optional(),
  address: z.string().min(5).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

// Tenant validation
export const createTenantSchema = z.object({
  name: z.string().min(2, 'Tenant name must be at least 2 characters'),
  subdomain: z.string()
    .min(3, 'Subdomain must be at least 3 characters')
    .max(63, 'Subdomain must be at most 63 characters')
    .regex(/^[a-z0-9-]+$/, 'Subdomain must contain only lowercase letters, numbers, and hyphens'),
  logoUrl: z.string().url().optional(),
  isActive: z.boolean().optional(),
});

export const updateTenantSchema = z.object({
  name: z.string().min(2).optional(),
  subdomain: z.string()
    .min(3)
    .max(63)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  logoUrl: z.string().url().optional(),
  isActive: z.boolean().optional(),
  theme: z.record(z.any()).optional(),
});

// Theme validation
export const themeSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional(),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional(),
  fontFamily: z.string().optional(),
  borderRadius: z.string().optional(),
  logoUrl: z.string().url().optional(),
});

/**
 * Utility function to validate request body
 */
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: z.ZodError;
} {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}

// Review validation
export const reviewSchema = z.object({
  hotelId: z.string().min(1, 'Hotel ID is required'),
  rating: z.number().int().min(1, 'Minimum rating is 1').max(5, 'Maximum rating is 5'),
  comment: z.string().max(1000, 'Comment must be at most 1000 characters').optional(),
  bookingId: z.string().optional(),
});

export const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().max(1000).optional(),
});
