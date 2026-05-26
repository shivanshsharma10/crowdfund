// src/app/(public)/campaigns/[id]/page.tsx

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatUsdAsInr, calcProgress, formatDate } from "@/lib/utils";
import { DonateWidget } from "@/components/shared/DonateWidget";
import { Users, Calendar, CheckCircle2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const campaign = await prisma.campaign.findUnique({
    where: { id },
    select: { title: true, description: true },
  });
  if (!campaign) return { title: "Campaign Not Found" };
  return {
    title: campaign.title,
    description: campaign.description.slice(0, 160),
  };
}

async function getCampaign(id: string) {
  return prisma.campaign.findUnique({
    where: { id },
    include: {
      donations: {
        where: { status: "SUCCESS" },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          donorName: true,
          amount: true,
          currency: true,
          createdAt: true,
        },
      },
      _count: { select: { donations: { where: { status: "SUCCESS" } } } },
    },
  });
}

export default async function CampaignPage({ params }: Params) {
  const { id } = await params;
  const campaign = await getCampaign(id);

  if (!campaign) notFound();

  const progress = calcProgress(
    Number(campaign.raisedAmount),
    Number(campaign.targetAmount)
  );

  const raisedInr = formatUsdAsInr(Number(campaign.raisedAmount));
  const targetInr = formatUsdAsInr(Number(campaign.targetAmount));

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700 transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        All Campaigns
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        {/* ── Left ─────────────────────────────── */}
        <div className="lg:col-span-3 space-y-8">
          <div className="aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-stone-100 to-stone-200 border border-stone-200">
            {campaign.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={campaign.imageUrl} alt={campaign.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl opacity-20">🎯</div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              {campaign.status === "ACTIVE" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active
                </span>
              )}
              {campaign.status === "COMPLETED" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                </span>
              )}
              {campaign.status === "PAUSED" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
                  Paused
                </span>
              )}
            </div>

            <h1 className="font-display text-3xl font-bold text-stone-900 leading-tight mb-4">
              {campaign.title}
            </h1>

            <div className="flex items-center gap-5 text-sm text-stone-400">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                Started {formatDate(campaign.createdAt)}
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                {campaign._count.donations} supporters
              </div>
            </div>
          </div>

          <div className="prose prose-stone max-w-none">
            <p className="text-stone-600 leading-relaxed whitespace-pre-line">{campaign.description}</p>
          </div>

          {campaign.donations.length > 0 && (
            <div>
              <h3 className="font-semibold text-stone-900 mb-4 text-sm uppercase tracking-wide">
                Recent Supporters
              </h3>
              <div className="space-y-3">
                {campaign.donations.map((donation) => (
                  <div key={donation.id} className="flex items-center justify-between py-3 border-b border-stone-100 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-sm font-semibold text-stone-600">
                        {donation.donorName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-stone-900">{donation.donorName}</div>
                        <div className="text-xs text-stone-400">{formatDate(donation.createdAt)}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-emerald-700">
                        {formatUsdAsInr(Number(donation.amount))}
                      </div>
                      <div className="text-xs text-stone-400">
                        ${Number(donation.amount).toFixed(0)} USD
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Donate Widget ─────────────── */}
        <div className="lg:col-span-2">
          <div className="sticky top-24">
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 mb-4">
              <div className="mb-1">
                <span className="text-2xl font-bold text-stone-900 font-display">{raisedInr}</span>
                <span className="text-sm text-stone-400 ml-2">raised of {targetInr}</span>
              </div>
              <div className="text-xs text-stone-400 mb-2">
                ≈ ${Number(campaign.raisedAmount).toFixed(0)} USD collected
              </div>

              <div className="h-2 bg-stone-100 rounded-full my-4 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-1000"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-sm text-stone-500 mb-6">
                <span>{progress}% funded</span>
                <span>{campaign._count.donations} donors</span>
              </div>

              {campaign.status === "ACTIVE" ? (
                <DonateWidget campaignId={campaign.id} campaignTitle={campaign.title} />
              ) : (
                <div className="text-center py-4 px-6 rounded-xl bg-stone-50 border border-stone-200">
                  <p className="text-sm text-stone-500">
                    This campaign is currently{" "}
                    <span className="font-medium text-stone-700 lowercase">{campaign.status}</span>{" "}
                    and not accepting donations.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-stone-400 justify-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Secured by Stripe · 100% to campaign
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}