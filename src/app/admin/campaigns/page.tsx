// src/app/admin/campaigns/page.tsx

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatCurrency, formatDate, calcProgress } from "@/lib/utils";
import { Plus, Pencil, Eye } from "lucide-react";
import { DeleteCampaignButton } from "@/components/shared/DeleteCampaignButton";
import { CampaignStatusBadge } from "@/components/shared/CampaignStatusBadge";

export const dynamic = "force-dynamic";

async function getCampaigns() {
  return prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { donations: { where: { status: "SUCCESS" } } } },
    },
  });
}

export default async function AdminCampaignsPage() {
  const campaigns = await getCampaigns();

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 font-display">Campaigns</h1>
          <p className="text-stone-500 text-sm mt-0.5">
            {campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Link
          href="/admin/campaigns/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-200"
        >
          <Plus className="w-4 h-4" />
          New Campaign
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {campaigns.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-4xl mb-3 opacity-20">📣</div>
            <p className="text-stone-500 text-sm mb-4">No campaigns yet.</p>
            <Link
              href="/admin/campaigns/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create your first campaign
            </Link>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-100">
                <th className="text-left px-6 py-4 text-xs font-semibold text-stone-500 uppercase tracking-wider">
                  Campaign
                </th>
                <th className="text-left px-4 py-4 text-xs font-semibold text-stone-500 uppercase tracking-wider hidden md:table-cell">
                  Progress
                </th>
                <th className="text-left px-4 py-4 text-xs font-semibold text-stone-500 uppercase tracking-wider hidden lg:table-cell">
                  Raised
                </th>
                <th className="text-left px-4 py-4 text-xs font-semibold text-stone-500 uppercase tracking-wider hidden lg:table-cell">
                  Donors
                </th>
                <th className="text-left px-4 py-4 text-xs font-semibold text-stone-500 uppercase tracking-wider hidden xl:table-cell">
                  Created
                </th>
                <th className="text-left px-4 py-4 text-xs font-semibold text-stone-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-xs font-semibold text-stone-500 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {campaigns.map((campaign) => {
                const progress = calcProgress(
                  Number(campaign.raisedAmount),
                  Number(campaign.targetAmount)
                );
                return (
                  <tr
                    key={campaign.id}
                    className="hover:bg-stone-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-stone-900 text-sm max-w-48 truncate">
                        {campaign.title}
                      </div>
                      <div className="text-xs text-stone-400 mt-0.5">
                        {formatCurrency(Number(campaign.targetAmount))} goal
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <div className="flex items-center gap-2.5">
                        <div className="w-24 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-stone-600">
                          {progress}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <span className="text-sm font-semibold text-emerald-700">
                        {formatCurrency(Number(campaign.raisedAmount))}
                      </span>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <span className="text-sm text-stone-600">
                        {campaign._count.donations}
                      </span>
                    </td>
                    <td className="px-4 py-4 hidden xl:table-cell">
                      <span className="text-xs text-stone-400">
                        {formatDate(campaign.createdAt)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <CampaignStatusBadge status={campaign.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 justify-end">
                        <Link
                          href={`/campaigns/${campaign.id}`}
                          target="_blank"
                          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
                          title="View public page"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/admin/campaigns/${campaign.id}`}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <DeleteCampaignButton
                          campaignId={campaign.id}
                          campaignTitle={campaign.title}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
