// src/app/admin/campaigns/[id]/page.tsx

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CampaignForm } from "@/components/shared/CampaignForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { formatCurrency, calcProgress, formatDate } from "@/lib/utils";

type Params = { params: Promise<{ id: string }> };

export default async function EditCampaignPage({ params }: Params) {
  const { id } = await params;

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      donations: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      _count: { select: { donations: { where: { status: "SUCCESS" } } } },
    },
  });

  if (!campaign) notFound();

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/admin/campaigns"
          className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Campaigns
        </Link>
        <h1 className="text-2xl font-bold text-stone-900 font-display">
          Edit Campaign
        </h1>
        <p className="text-stone-500 text-sm mt-0.5 truncate max-w-lg">
          {campaign.title}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8">
            <CampaignForm
              mode="edit"
              campaignId={id}
              initialData={{
                title: campaign.title,
                description: campaign.description,
                targetAmount: Number(campaign.targetAmount),
                imageUrl: campaign.imageUrl,
                status: campaign.status,
              }}
            />
          </div>
        </div>

        {/* Stats sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
            <h3 className="font-semibold text-stone-900 text-sm mb-4">
              Campaign Stats
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-stone-500">Raised</span>
                <span className="text-sm font-bold text-emerald-700">
                  {formatCurrency(Number(campaign.raisedAmount))}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-stone-500">Goal</span>
                <span className="text-sm font-semibold text-stone-700">
                  {formatCurrency(Number(campaign.targetAmount))}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-stone-500">Donors</span>
                <span className="text-sm font-semibold text-stone-700">
                  {campaign._count.donations}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-stone-500">Created</span>
                <span className="text-xs text-stone-500">
                  {formatDate(campaign.createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Recent donations */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
            <h3 className="font-semibold text-stone-900 text-sm mb-4">
              Recent Donations
            </h3>
            {campaign.donations.length === 0 ? (
              <p className="text-xs text-stone-400 text-center py-4">
                No donations yet.
              </p>
            ) : (
              <div className="space-y-3">
                {campaign.donations.map((d) => (
                  <div key={d.id} className="flex justify-between items-start">
                    <div>
                      <div className="text-xs font-medium text-stone-900">
                        {d.donorName}
                      </div>
                      <div className="text-xs text-stone-400">{d.donorEmail}</div>
                      <div className="text-xs text-stone-400">
                        {formatDate(d.createdAt)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-emerald-700">
                        {formatCurrency(Number(d.amount))}
                      </div>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                          d.status === "SUCCESS"
                            ? "bg-emerald-50 text-emerald-700"
                            : d.status === "FAILED"
                            ? "bg-red-50 text-red-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {d.status.toLowerCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
