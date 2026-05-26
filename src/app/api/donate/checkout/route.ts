// src/app/api/donate/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripeClient } from "@/lib/stripe";
import { CampaignStatus } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { campaignId, amount, donorName, donorEmail } = body as {
      campaignId?: string;
      amount?: number;
      donorName?: string;
      donorEmail?: string;
    };

    // ── Validation ──────────────────────────────────────────────
    if (!campaignId || !amount || !donorName || !donorEmail) {
      return NextResponse.json(
        { error: "campaignId, amount, donorName, and donorEmail are required" },
        { status: 400 }
      );
    }

    const amountNum = parseFloat(String(amount));
    if (isNaN(amountNum) || amountNum < 1) {
      return NextResponse.json({ error: "amount must be at least 1" }, { status: 400 });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donorEmail)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    // ── Verify campaign ─────────────────────────────────────────
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true, status: true, title: true },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    if (campaign.status !== CampaignStatus.ACTIVE) {
      return NextResponse.json(
        { error: "This campaign is not currently accepting donations" },
        { status: 400 }
      );
    }

    // ── Stripe PaymentIntent ────────────────────────────────────
    const stripe = getStripeClient();
    const amountCents = Math.round(amountNum * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: "usd",
      receipt_email: donorEmail.trim().toLowerCase(),
      // Required for Indian Stripe accounts processing export transactions
      shipping: {
        name: donorName.trim(),
        address: {
          line1: "International",
          country: "US",
        },
      },
      metadata: {
        campaignId,
        campaignTitle: campaign.title,
        donorName: donorName.trim(),
        donorEmail: donorEmail.trim().toLowerCase(),
      },
      description: `Donation to: ${campaign.title}`,
    });

    await prisma.donation.create({
      data: {
        amount: amountNum,
        paymentId: paymentIntent.id,
        donorName: donorName.trim(),
        donorEmail: donorEmail.trim().toLowerCase(),
        campaignId,
        status: "PENDING",
        gateway: "STRIPE",
        currency: "USD",
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount: amountNum,
      currency: "USD",
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    });
  } catch (error) {
    console.error("[POST /api/donate/checkout]", error);
    return NextResponse.json(
      { error: "Failed to initialize payment. Please try again." },
      { status: 500 }
    );
  }
}