import { prisma } from './index';

/**
 * Audit log system for tracking important actions
 */

export enum AuditAction {
  // User actions
  USER_LOGIN = 'USER_LOGIN',
  USER_LOGOUT = 'USER_LOGOUT',
  USER_REGISTER = 'USER_REGISTER',
  USER_UPDATE = 'USER_UPDATE',
  USER_DELETE = 'USER_DELETE',

  // Booking actions
  BOOKING_CREATE = 'BOOKING_CREATE',
  BOOKING_UPDATE = 'BOOKING_UPDATE',
  BOOKING_CANCEL = 'BOOKING_CANCEL',
  BOOKING_CANCELLED = 'BOOKING_CANCELLED',
  BOOKING_UPDATED = 'BOOKING_UPDATED',
  BOOKING_CONFIRM = 'BOOKING_CONFIRM',
  BOOKING_COMPLETE = 'BOOKING_COMPLETE',

  // Room actions
  ROOM_CREATE = 'ROOM_CREATE',
  ROOM_UPDATE = 'ROOM_UPDATE',
  ROOM_DELETE = 'ROOM_DELETE',

  // Hotel actions
  HOTEL_CREATE = 'HOTEL_CREATE',
  HOTEL_UPDATE = 'HOTEL_UPDATE',
  HOTEL_DELETE = 'HOTEL_DELETE',

  // Tenant actions
  TENANT_CREATE = 'TENANT_CREATE',
  TENANT_UPDATE = 'TENANT_UPDATE',
  TENANT_DELETE = 'TENANT_DELETE',
  TENANT_THEME_UPDATE = 'TENANT_THEME_UPDATE',

  // Payment actions
  PAYMENT_INITIATED = 'PAYMENT_INITIATED',
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  PAYMENT_FAILED = 'PAYMENT_FAILED',

  // Payment webhook actions
  WEBHOOK_SIGNATURE_INVALID = 'WEBHOOK_SIGNATURE_INVALID',
  PAYMENT_CONFIRMATION_FAILED = 'PAYMENT_CONFIRMATION_FAILED',
  REFUND_COMPLETED = 'REFUND_COMPLETED',
  PAYMENT_DISPUTE_CREATED = 'PAYMENT_DISPUTE_CREATED',
  WEBHOOK_EVENT_UNHANDLED = 'WEBHOOK_EVENT_UNHANDLED',
  WEBHOOK_ERROR = 'WEBHOOK_ERROR',
  BOOKING_CREATED = 'BOOKING_CREATED',

  // Payment processing actions
  PAYMENT_CONFIRMED = 'PAYMENT_CONFIRMED',
  REFUND_PROCESSED = 'REFUND_PROCESSED',
}

export interface AuditLogEntry {
  action: AuditAction;
  userId?: string;
  tenantId?: string;
  resourceId?: string;
  resourceType?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an audit event to database
 */
export async function logAudit(entry: AuditLogEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: entry.action,
        userId: entry.userId,
        tenantId: entry.tenantId,
        resourceId: entry.resourceId,
        resourceType: entry.resourceType,
        metadata: entry.metadata ? JSON.stringify(entry.metadata) : undefined,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
      },
    });

    // Also log to console in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('[AUDIT]', JSON.stringify(entry, null, 2));
    }
  } catch (error) {
    console.error('Failed to log audit entry:', error);
    // Don't throw - audit logging should not break the application
  }
}

/**
 * Get audit logs with optional filtering from database
 */
export async function getAuditLogs(filter?: {
  userId?: string;
  tenantId?: string;
  action?: AuditAction;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}): Promise<any[]> {
  const where: any = {};

  if (filter?.userId) {
    where.userId = filter.userId;
  }

  if (filter?.tenantId) {
    where.tenantId = filter.tenantId;
  }

  if (filter?.action) {
    where.action = filter.action;
  }

  if (filter?.startDate || filter?.endDate) {
    where.createdAt = {};
    if (filter.startDate) {
      where.createdAt.gte = filter.startDate;
    }
    if (filter.endDate) {
      where.createdAt.lte = filter.endDate;
    }
  }

  return prisma.auditLog.findMany({
    where,
    orderBy: {
      createdAt: 'desc',
    },
    take: filter?.limit || 100,
  });
}

/**
 * Helper to extract client info from request headers
 */
export function getClientInfo(headers: Headers): {
  ipAddress?: string;
  userAgent?: string;
} {
  const forwardedFor = headers.get('x-forwarded-for');
  const ipAddress = forwardedFor?.split(',')[0].trim() || headers.get('x-real-ip') || undefined;
  const userAgent = headers.get('user-agent') || undefined;

  return { ipAddress, userAgent };
}
