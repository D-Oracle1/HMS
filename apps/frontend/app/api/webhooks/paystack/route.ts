import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { confirmBooking } from 'db/payment'
import { logAudit, AuditAction } from 'db/auditLog'

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!

/**
 * Paystack webhook handler
 * POST /api/webhooks/paystack
 *
 * Handles Paystack webhook events:
 * - charge.success: Payment completed successfully
 * - charge.failed: Payment failed
 * - refund.processed: Refund processed
 * - charge.dispute.created: Dispute created
 */
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await request.text()
    const signature = request.headers.get('x-paystack-signature')

    if (!signature) {
      console.error('[Paystack Webhook] Missing signature')
      return NextResponse.json(
        {
          error: 'Missing signature',
        },
        { status: 400 }
      )
    }

    // Verify webhook signature
    const hash = crypto
      .createHmac('sha512', PAYSTACK_SECRET_KEY)
      .update(body)
      .digest('hex')

    if (hash !== signature) {
      console.error('[Paystack Webhook] Invalid signature')
      await logAudit({
        action: AuditAction.WEBHOOK_SIGNATURE_INVALID,
        userId: undefined,
        resourceId: undefined,
        resourceType: 'PAYMENT',
        metadata: {
          source: 'paystack',
          signature,
          expectedHash: hash,
        },
      })

      return NextResponse.json(
        {
          error: 'Invalid signature',
        },
        { status: 401 }
      )
    }

    // Parse webhook event
    const event = JSON.parse(body)

    console.log('[Paystack Webhook] Event received:', event.event)

    // Handle different event types
    switch (event.event) {
      case 'charge.success': {
        const { reference, metadata } = event.data

        console.log('[Paystack Webhook] Processing successful charge:', reference)

        try {
          // Confirm booking
          const booking = await confirmBooking(reference)

          console.log('[Paystack Webhook] Booking confirmed:', booking.id)

          await logAudit({
            action: AuditAction.PAYMENT_SUCCESS,
            userId: metadata?.userId || undefined,
            resourceId: booking.id,
            resourceType: 'BOOKING',
            metadata: {
              reference,
              amount: event.data.amount / 100, // Convert from kobo
              channel: event.data.channel,
              paystackId: event.data.id,
            },
          })

          return NextResponse.json({
            success: true,
            message: 'Booking confirmed',
            bookingId: booking.id,
          })
        } catch (error: any) {
          console.error('[Paystack Webhook] Error confirming booking:', error)

          await logAudit({
            action: AuditAction.PAYMENT_CONFIRMATION_FAILED,
            userId: metadata?.userId || undefined,
            resourceId: reference,
            resourceType: 'PAYMENT',
            metadata: {
              reference,
              error: error.message,
            },
          })

          // Still return 200 to acknowledge webhook
          return NextResponse.json({
            success: false,
            error: error.message,
          })
        }
      }

      case 'charge.failed': {
        const { reference, metadata } = event.data

        console.log('[Paystack Webhook] Payment failed:', reference)

        await logAudit({
          action: AuditAction.PAYMENT_FAILED,
          userId: metadata?.userId || undefined,
          resourceId: reference,
          resourceType: 'PAYMENT',
          metadata: {
            reference,
            reason: event.data.gateway_response || 'Unknown error',
          },
        })

        return NextResponse.json({
          success: true,
          message: 'Payment failure logged',
        })
      }

      case 'refund.processed': {
        const { reference, refund } = event.data

        console.log('[Paystack Webhook] Refund processed:', reference)

        await logAudit({
          action: AuditAction.REFUND_COMPLETED,
          userId: undefined,
          resourceId: reference,
          resourceType: 'PAYMENT',
          metadata: {
            reference,
            refundAmount: refund.amount / 100,
            refundId: refund.id,
            status: refund.status,
          },
        })

        return NextResponse.json({
          success: true,
          message: 'Refund logged',
        })
      }

      case 'charge.dispute.created': {
        const { reference, dispute } = event.data

        console.log('[Paystack Webhook] Dispute created:', reference)

        await logAudit({
          action: AuditAction.PAYMENT_DISPUTE_CREATED,
          userId: undefined,
          resourceId: reference,
          resourceType: 'PAYMENT',
          metadata: {
            reference,
            disputeId: dispute.id,
            reason: dispute.reason,
            status: dispute.status,
          },
        })

        // TODO: Send notification to admin
        console.warn('[ALERT] Payment dispute created for reference:', reference)

        return NextResponse.json({
          success: true,
          message: 'Dispute logged',
        })
      }

      default:
        console.log('[Paystack Webhook] Unhandled event type:', event.event)

        await logAudit({
          action: AuditAction.WEBHOOK_EVENT_UNHANDLED,
          userId: undefined,
          resourceId: undefined,
          resourceType: 'PAYMENT',
          metadata: {
            event: event.event,
            data: event.data,
          },
        })

        return NextResponse.json({
          success: true,
          message: 'Event acknowledged',
        })
    }
  } catch (error: any) {
    console.error('[Paystack Webhook] Error processing webhook:', error)

    await logAudit({
      action: AuditAction.WEBHOOK_ERROR,
      userId: undefined,
      resourceId: undefined,
      resourceType: 'PAYMENT',
      metadata: {
        error: error.message,
        stack: error.stack,
      },
    })

    // Always return 200 to prevent Paystack from retrying
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 200 }
    )
  }
}

// Disable body parsing for webhook signature verification
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
