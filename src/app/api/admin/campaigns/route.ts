// src/app/api/admin/campaigns/route.ts
// Admin: full CRUD for campaigns (protected by middleware)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CampaignStatus } from "@prisma/client";

// GET /api/admin/campaigns — all campaigns with all statuses
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as CampaignStatus | null;
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);
    const skip = (page - 1) * limit;

    const where = status ? { status } : {};

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              donations: { where: { status: "SUCCESS" } },
            },
          },
        },
      }),
      prisma.campaign.count({ where }),
    ]);

    return NextResponse.json({
      campaigns,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[GET /api/admin/campaigns]", error);
    return NextResponse.json({ error: "Failed to fetch campaigns" }, { status: 500 });
  }
}

// POST /api/admin/campaigns — create a new campaign
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, targetAmount, imageUrl, status } = body;

    if (!title?.trim() || !description?.trim() || !targetAmount) {
      return NextResponse.json(
        { error: "title, description, and targetAmount are required" },
        { status: 400 }
      );
    }

    const target = parseFloat(String(targetAmount));
    if (isNaN(target) || target <= 0) {
      return NextResponse.json(
        { error: "targetAmount must be a positive number" },
        { status: 400 }
      );
    }

    const adminEmail = process.env.ADMIN_EMAIL ?? "admin@example.com";

    // Upsert the admin user record so the FK constraint is satisfied
    const adminUser = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {},
      create: {
        email: adminEmail,
        passwordHash: "env_managed",
        role: "ADMIN",
      },
    });

    const campaign = await prisma.campaign.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        targetAmount: target,
        imageUrl: imageUrl?.trim() || null,
        status: (status as CampaignStatus) ?? CampaignStatus.ACTIVE,
        creatorId: adminUser.id,
      },
    });

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/admin/campaigns]", error);
    return NextResponse.json({ error: "Failed to create campaign" }, { status: 500 });
  }
}
