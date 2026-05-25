// src/app/api/campaigns/route.ts
// Public: GET active campaigns | Admin: POST create campaign

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CampaignStatus } from "@prisma/client";

// GET /api/campaigns — public list of ACTIVE campaigns
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as CampaignStatus | null;
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "12", 10), 50);
    const skip = (page - 1) * limit;

    const where = status ? { status } : { status: CampaignStatus.ACTIVE };

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          description: true,
          targetAmount: true,
          raisedAmount: true,
          imageUrl: true,
          status: true,
          createdAt: true,
          _count: { select: { donations: { where: { status: "SUCCESS" } } } },
        },
      }),
      prisma.campaign.count({ where }),
    ]);

    return NextResponse.json({
      campaigns,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[GET /api/campaigns]", error);
    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 });
  }
}
