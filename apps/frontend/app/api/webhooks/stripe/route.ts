import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-11-20.acacia",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object as Stripe.Checkout.Session;

      // Update booking status to CONFIRMED
      if (session.metadata?.roomId) {
        try {
          await prisma.booking.updateMany({
            where: {
              roomId: session.metadata.roomId,
              status: "PENDING",
            },
            data: {
              status: "CONFIRMED",
              paymentId: session.id,
            },
          });

          console.log(`Booking confirmed for room: ${session.metadata.roomId}`);
        } catch (error) {
          console.error("Error updating booking:", error);
        }
      }
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
