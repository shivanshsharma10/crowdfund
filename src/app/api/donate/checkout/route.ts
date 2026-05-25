// src/app/api/donate/checkout/route.ts
// Creates a Razorpay order and a PENDING donation record atomically

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRazorpayClient, rupeesToPaise } from "@/lib/razorpay";
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
      return NextResponse.json(
        { error: "amount must be at least ₹1" },
        { status: 400 }
      );
    }

    // Email basic validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donorEmail)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    // ── Verify campaign exists and is ACTIVE ────────────────────
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

    // ── Create Razorpay order ───────────────────────────────────
    const razorpay = getRazorpayClient();
    const order = await razorpay.orders.create({
      amount: rupeesToPaise(amountNum),
      currency: "INR",
      receipt: `donation_${campaignId.slice(-8)}_${Date.now()}`,
      notes: {
        campaignId,
        campaignTitle: campaign.title,
        donorEmail,
        donorName,
      },
    });

    // ── Persist a PENDING donation record ──────────────────────
    const donation = await prisma.donation.create({
      data: {
        amount: amountNum,
        paymentId: order.id, // Store Razorpay order ID initially
        donorName: donorName.trim(),
        donorEmail: donorEmail.trim().toLowerCase(),
        campaignId,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      orderId: order.id,
      donationId: donation.id,
      amount: amountNum,
      currency: "INR",
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("[POST /api/donate/checkout]", error);
    return NextResponse.json(
      { error: "Failed to initialize payment. Please try again." },
      { status: 500 }
    );
  }
}
