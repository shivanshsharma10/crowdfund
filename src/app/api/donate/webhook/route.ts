// src/app/api/donate/webhook/route.ts
// Razorpay Webhook Handler — atomic transactional payment capture

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { DonationStatus } from "@prisma/client";

// Razorpay sends the raw body as-is for signature verification.
// Next.js 15 App Router gives us the raw body via request.text().

export async function POST(request: NextRequest): Promise<NextResponse> {
  // ── 1. Read raw body (required for HMAC verification) ─────────
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return json({ error: "Cannot read request body" }, 400);
  }

  // ── 2. Verify Razorpay webhook signature ──────────────────────
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[Webhook] RAZORPAY_WEBHOOK_SECRET is not configured");
    return json({ error: "Webhook secret not configured" }, 500);
  }

  const razorpaySignature = request.headers.get("x-razorpay-signature");
  if (!razorpaySignature) {
    return json({ error: "Missing Razorpay signature header" }, 400);
  }

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  const isValid = crypto.timingSafeEqual(
    Buffer.from(expectedSignature, "hex"),
    Buffer.from(razorpaySignature, "hex")
  );

  if (!isValid) {
    console.warn("[Webhook] Invalid signature — possible forgery attempt");
    return json({ error: "Invalid signature" }, 401);
  }

  // ── 3. Parse event payload ─────────────────────────────────────
  let event: RazorpayWebhookEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return json({ error: "Malformed JSON payload" }, 400);
  }

  console.info(`[Webhook] Received event: ${event.event}`);

  // ── 4. Route event handlers ────────────────────────────────────
  switch (event.event) {
    case "payment.captured":
      return handlePaymentCaptured(event);

    case "payment.failed":
      return handlePaymentFailed(event);

    default:
      // Acknowledge unknown events gracefully (Razorpay retries on non-2xx)
      return json({ received: true, handled: false });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Handler: payment.captured
// Atomically updates Donation → SUCCESS and increments Campaign.raisedAmount
// ─────────────────────────────────────────────────────────────────────────────
async function handlePaymentCaptured(
  event: RazorpayWebhookEvent
): Promise<NextResponse> {
  const payment = event.payload.payment?.entity;
  if (!payment) {
    console.error("[Webhook] payment.captured: missing payment entity");
    return json({ error: "Missing payment entity" }, 400);
  }

  const { id: paymentId, order_id: orderId, amount: amountPaise } = payment;

  // Razorpay sends amounts in paise (smallest currency unit); convert to rupees
  const amountInRupees = amountPaise / 100;

  // Find the pending donation by the Razorpay order ID (created during checkout)
  const donation = await prisma.donation.findUnique({
    where: { paymentId: orderId },
  });

  if (!donation) {
    // This can happen for orders not initiated by this platform — safe to ignore
    console.warn(`[Webhook] No donation found for order_id: ${orderId}`);
    return json({ received: true, handled: false });
  }

  if (donation.status === DonationStatus.SUCCESS) {
    // Idempotency guard — already processed (Razorpay retries webhooks)
    console.info(`[Webhook] Donation ${donation.id} already marked SUCCESS — skipping`);
    return json({ received: true, handled: true, idempotent: true });
  }

  // ── Atomic transaction: update Donation + Campaign ─────────────
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Mark donation as SUCCESS and store the actual payment ID
      await tx.donation.update({
        where: { id: donation.id },
        data: {
          status: DonationStatus.SUCCESS,
          paymentId: paymentId, // replace order_id with actual payment_id
        },
      });

      // 2. Increment campaign's raisedAmount
      await tx.campaign.update({
        where: { id: donation.campaignId },
        data: {
          raisedAmount: {
            increment: amountInRupees,
          },
        },
      });
    });

    console.info(
      `[Webhook] ✅ Donation ${donation.id} captured. Campaign ${donation.campaignId} +₹${amountInRupees}`
    );
    return json({ received: true, handled: true });
  } catch (error) {
    console.error("[Webhook] Transaction failed:", error);
    // Return 500 so Razorpay retries the webhook
    return json({ error: "Database transaction failed" }, 500);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Handler: payment.failed
// ─────────────────────────────────────────────────────────────────────────────
async function handlePaymentFailed(
  event: RazorpayWebhookEvent
): Promise<NextResponse> {
  const payment = event.payload.payment?.entity;
  if (!payment) return json({ error: "Missing payment entity" }, 400);

  const { order_id: orderId } = payment;

  try {
    await prisma.donation.updateMany({
      where: {
        paymentId: orderId,
        status: DonationStatus.PENDING, // only update if still pending
      },
      data: { status: DonationStatus.FAILED },
    });

    console.info(`[Webhook] Payment failed for order_id: ${orderId}`);
    return json({ received: true, handled: true });
  } catch (error) {
    console.error("[Webhook] Failed to update donation status:", error);
    return json({ error: "Database update failed" }, 500);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function json(body: object, status = 200): NextResponse {
  return NextResponse.json(body, { status });
}

// ─────────────────────────────────────────────────────────────────────────────
// Type definitions for Razorpay webhook events
// ─────────────────────────────────────────────────────────────────────────────
interface RazorpayPaymentEntity {
  id: string;
  order_id: string;
  amount: number; // in paise
  currency: string;
  status: string;
  email?: string;
  contact?: string;
  notes?: Record<string, string>;
}

interface RazorpayWebhookEvent {
  event: string;
  payload: {
    payment?: {
      entity: RazorpayPaymentEntity;
    };
  };
  created_at: number;
}
