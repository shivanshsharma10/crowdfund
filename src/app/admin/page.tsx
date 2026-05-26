// src/app/admin/page.tsx

import { prisma } from "@/lib/prisma";
import { formatUsdAsInr, formatDate } from "@/lib/utils";
import Link from "next/link";
import { TrendingUp, Megaphone, Heart, DollarSign, ArrowRight, Plus } from "lucide-react";

export const dynamic = 'force-dynamic';

async function getDashboardData() {
  const [
    totalCampaigns,
    activeCampaigns,
    totalDonations,
    totalRaisedResult,
    recentDonations,
    topCampaigns,
  ] = await Promise.all([
    prisma.campaign.count(),
    prisma.campaign.count({ where: { status: "ACTIVE" } }),
    prisma.donation.count({ where: { status: "SUCCESS" } }),
    prisma.donation.aggregate({
      where: { status: "SUCCESS" },
      _sum: { amount: true },
    }),
    prisma.donation.findMany({
      where: { status: "SUCCESS" },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { campaign: { select: { title: true } } },
    }),
    prisma.campaign.findMany({
      orderBy: { raisedAmount: "desc" },
      take: 5,
      select: {
        id: true,
        title: true,
        raisedAmount: true,
        targetAmount: true,
        status: true,
      },
    }),
  ]);

  return {
    totalCampaigns,
    activeCampaigns,
    totalDonations,
    totalRaised: Number(totalRaisedResult._sum.amount ?? 0),
    recentDonations,
    topCampaigns,
  };
}

export default async function AdminDashboard() {
  const data = await getDashboardData();

  const stats = [
    {
      label: "Total Raised",
      value: formatUsdAsInr(data.totalRaised),
      icon: <DollarSign className="w-5 h-5" />,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Total Donations",
      value: data.totalDonations.toLocaleString("en-IN"),
      icon: <Heart className="w-5 h-5" />,
      color: "text-rose-600",
      bg: "bg-rose-50",
    },
    {
      label: "Active Campaigns",
      value: data.activeCampaigns,
      icon: <Megaphone className="w-5 h-5" />,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Total Campaigns",
      value: data.totalCampaigns,
      icon: <TrendingUp className="w-5 h-5" />,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 font-display">Dashboard</h1>
          <p className="text-stone-500 text-sm mt-0.5">
            Overview of your crowdfunding platform
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

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm"
          >
            <div
              className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3 ${stat.color}`}
            >
              {stat.icon}
            </div>
            <div className="text-2xl font-bold text-stone-900 font-display">
              {stat.value}
            </div>
            <div className="text-xs text-stone-500 mt-0.5 font-medium">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent donations */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-stone-100">
            <h2 className="font-semibold text-stone-900 text-sm">Recent Donations</h2>
            <Link
              href="/admin/campaigns"
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-stone-50">
            {data.recentDonations.length === 0 ? (
              <p className="text-sm text-stone-400 p-6 text-center">No donations yet.</p>
            ) : (
              data.recentDonations.map((donation) => (
                <div
                  key={donation.id}
                  className="flex items-center justify-between px-6 py-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-sm font-semibold text-stone-600">
                      {donation.donorName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-stone-900">
                        {donation.donorName}
                      </div>
                      <div className="text-xs text-stone-400 truncate max-w-32">
                        {donation.campaign.title}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-emerald-700">
                      {formatUsdAsInr(Number(donation.amount))}
                    </div>
                    <div className="text-xs text-stone-400">
                      {formatDate(donation.createdAt)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top campaigns */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-stone-100">
            <h2 className="font-semibold text-stone-900 text-sm">Top Campaigns</h2>
            <Link
              href="/admin/campaigns"
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
            >
              Manage <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-stone-50">
            {data.topCampaigns.length === 0 ? (
              <p className="text-sm text-stone-400 p-6 text-center">No campaigns yet.</p>
            ) : (
              data.topCampaigns.map((campaign) => {
                const pct = Math.min(
                  Math.round(
                    (Number(campaign.raisedAmount) / Number(campaign.targetAmount)) * 100
                  ),
                  100
                );
                return (
                  <div key={campaign.id} className="px-6 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-stone-900 truncate max-w-48">
                        {campaign.title}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          campaign.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700"
                            : campaign.status === "COMPLETED"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {campaign.status.toLowerCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-stone-600 w-8 text-right">
                        {pct}%
                      </span>
                    </div>
                    <div className="text-xs text-stone-400 mt-1">
                      {formatUsdAsInr(Number(campaign.raisedAmount))} of{" "}
                      {formatUsdAsInr(Number(campaign.targetAmount))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}