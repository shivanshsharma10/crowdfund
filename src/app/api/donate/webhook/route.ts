// src/app/api/donate/stripe-webhook/route.ts
// Stripe Webhook Handler — updates donation status and campaign raised amount

import { NextRequest, NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { DonationStatus } from "@prisma/client";

export async function POST(request: NextRequest): Promise<NextResponse> {
  // ── 1. Read raw body ───────────────────────────────────────────
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return json({ error: "Cannot read request body" }, 400);
  }

  // ── 2. Verify Stripe webhook signature ────────────────────────
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[Stripe Webhook] STRIPE_WEBHOOK_SECRET is not configured");
    return json({ error: "Webhook secret not configured" }, 500);
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return json({ error: "Missing Stripe signature header" }, 400);
  }

  const stripe = getStripeClient();
  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.warn("[Stripe Webhook] Invalid signature:", err);
    return json({ error: "Invalid signature" }, 401);
  }

  console.info(`[Stripe Webhook] Received event: ${event.type}`);

  // ── 3. Route event handlers ────────────────────────────────────
  switch (event.type) {
    case "payment_intent.succeeded":
      return handlePaymentSucceeded(event.data.object);

    case "payment_intent.payment_failed":
      return handlePaymentFailed(event.data.object);

    default:
      return json({ received: true, handled: false });
  }
}

const USD_TO_INR = 84; // ← update this rate periodically

async function handlePaymentSucceeded(paymentIntent: { id: string; amount: number }): Promise<NextResponse> {
  const { id: paymentIntentId, amount: amountCents } = paymentIntent;
  const amountInUsd = amountCents / 100;
  const amountInInr = Math.round(amountInUsd * USD_TO_INR); // convert before storing

  const donation = await prisma.donation.findUnique({
    where: { paymentId: paymentIntentId },
  });

  if (!donation) {
    console.warn(`[Stripe Webhook] No donation found for PaymentIntent: ${paymentIntentId}`);
    return json({ received: true, handled: false });
  }

  if (donation.status === DonationStatus.SUCCESS) {
    console.info(`[Stripe Webhook] Donation ${donation.id} already SUCCESS — skipping`);
    return json({ received: true, handled: true, idempotent: true });
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Store the INR equivalent in donation.amount for consistent display
      await tx.donation.update({
        where: { id: donation.id },
        data: {
          status: DonationStatus.SUCCESS,
          amount: amountInInr,        // ← store INR, not USD
        },
      });

      await tx.campaign.update({
        where: { id: donation.campaignId },
        data: { raisedAmount: { increment: amountInInr } }, // ← increment by INR
      });
    });

    console.info(
      `[Stripe Webhook] ✅ Donation ${donation.id}: $${amountInUsd} = ₹${amountInInr} → campaign ${donation.campaignId}`
    );
    return json({ received: true, handled: true });
  } catch (error) {
    console.error("[Stripe Webhook] Transaction failed:", error);
    return json({ error: "Database transaction failed" }, 500);
  }
}

async function handlePaymentFailed(paymentIntent: { id: string }): Promise<NextResponse> {
  try {
    await prisma.donation.updateMany({
      where: { paymentId: paymentIntent.id, status: DonationStatus.PENDING },
      data: { status: DonationStatus.FAILED },
    });
    return json({ received: true, handled: true });
  } catch (error) {
    console.error("[Stripe Webhook] Failed to update donation:", error);
    return json({ error: "Database update failed" }, 500);
  }
}

function json(body: object, status = 200): NextResponse {
  return NextResponse.json(body, { status });
}