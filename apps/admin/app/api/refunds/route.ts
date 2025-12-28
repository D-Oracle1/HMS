import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { processRefund } from 'db/payment';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;

    // Only admins can process refunds
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { bookingId, amount, reason, paymentIntentId } = body;

    if (!bookingId || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Process refund in Stripe if payment ID provided
    if (paymentIntentId) {
      try {
        await stripe.refunds.create({
          payment_intent: paymentIntentId,
          amount: amount ? Math.round(amount * 100) : undefined, // Partial or full refund
          reason: 'requested_by_customer',
        });
      } catch (error) {
        console.error('Stripe refund error:', error);
        return NextResponse.json(
          { error: 'Failed to process Stripe refund' },
          { status: 500 }
        );
      }
    }

    // Process refund in database
    const success = await processRefund({
      bookingId,
      amount: amount || 0,
      reason,
      userId: user.id,
    });

    if (success) {
      return NextResponse.json({ success: true, message: 'Refund processed successfully' });
    } else {
      return NextResponse.json(
        { error: 'Failed to process refund' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing refund:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
