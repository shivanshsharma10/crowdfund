// src/app/api/admin/campaigns/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CampaignStatus } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

// GET /api/admin/campaigns/[id]
export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        donations: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        _count: {
          select: { donations: { where: { status: "SUCCESS" } } },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error(`[GET /api/admin/campaigns/${id}]`, error);
    return NextResponse.json({ error: "Failed to fetch campaign" }, { status: 500 });
  }
}

// PATCH /api/admin/campaigns/[id]
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { title, description, targetAmount, imageUrl, status } = body;

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (targetAmount !== undefined) {
      const t = parseFloat(String(targetAmount));
      if (isNaN(t) || t <= 0) {
        return NextResponse.json(
          { error: "targetAmount must be a positive number" },
          { status: 400 }
        );
      }
      updateData.targetAmount = t;
    }
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl?.trim() || null;
    if (status !== undefined) updateData.status = status as CampaignStatus;

    const campaign = await prisma.campaign.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error(`[PATCH /api/admin/campaigns/${id}]`, error);
    return NextResponse.json({ error: "Failed to update campaign" }, { status: 500 });
  }
}

// DELETE /api/admin/campaigns/[id]
export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  try {
    // Delete donations first (FK constraint)
    await prisma.donation.deleteMany({ where: { campaignId: id } });
    await prisma.campaign.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`[DELETE /api/admin/campaigns/${id}]`, error);
    return NextResponse.json({ error: "Failed to delete campaign" }, { status: 500 });
  }
}
