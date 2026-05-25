// src/app/(public)/page.tsx




export const dynamic = 'force-dynamic';

import Link from "next/link";

import { prisma } from "@/lib/prisma";

import { formatCurrency, calcProgress, truncate } from "@/lib/utils";
import { ArrowRight, Users, Target, Zap } from "lucide-react";

export const revalidate = 60; // ISR — revalidate every minute

async function getStats() {
  const [totalCampaigns, totalDonations, totalRaisedResult] = await Promise.all([
    prisma.campaign.count({ where: { status: "ACTIVE" } }),
    prisma.donation.count({ where: { status: "SUCCESS" } }),
    prisma.donation.aggregate({
      where: { status: "SUCCESS" },
      _sum: { amount: true },
    }),
  ]);
  return {
    totalCampaigns,
    totalDonations,
    totalRaised: Number(totalRaisedResult._sum.amount ?? 0),
  };
}

async function getCampaigns() {
  return prisma.campaign.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    take: 9,
    select: {
      id: true,
      title: true,
      description: true,
      targetAmount: true,
      raisedAmount: true,
      imageUrl: true,
      createdAt: true,
      _count: { select: { donations: { where: { status: "SUCCESS" } } } },
    },
  });
}

export default async function HomePage() {
  const [stats, campaigns] = await Promise.all([getStats(), getCampaigns()]);

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white border-b border-stone-100">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(#1c1917 1px, transparent 1px), linear-gradient(90deg, #1c1917 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative max-w-6xl mx-auto px-6 py-20 lg:py-28">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold tracking-wide uppercase mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Community Crowdfunding
            </span>

            <h1 className="font-display text-5xl lg:text-6xl font-bold text-stone-900 leading-[1.08] tracking-tight mb-6">
              Fund the causes
              <br />
              <span className="text-emerald-600">that matter most.</span>
            </h1>

            <p className="text-lg text-stone-500 leading-relaxed mb-8 max-w-lg">
              Support verified campaigns by real people. Every rupee goes directly
              to the cause — transparent, secure, and meaningful.
            </p>

            <div className="flex items-center gap-4">
              <a
                href="#campaigns"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-200"
              >
                Browse Campaigns
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────────── */}
      <section className="bg-stone-900 text-white">
        <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div className="text-center sm:text-left">
            <div className="text-3xl font-bold font-display text-emerald-400 mb-1">
              {formatCurrency(stats.totalRaised)}
            </div>
            <div className="text-sm text-stone-400 font-medium">Total Raised</div>
          </div>
          <div className="text-center sm:text-left border-t sm:border-t-0 sm:border-l border-stone-700 sm:pl-8 pt-8 sm:pt-0">
            <div className="text-3xl font-bold font-display text-white mb-1">
              {stats.totalDonations.toLocaleString("en-IN")}
            </div>
            <div className="text-sm text-stone-400 font-medium">Donations Made</div>
          </div>
          <div className="text-center sm:text-left border-t sm:border-t-0 sm:border-l border-stone-700 sm:pl-8 pt-8 sm:pt-0">
            <div className="text-3xl font-bold font-display text-white mb-1">
              {stats.totalCampaigns}
            </div>
            <div className="text-sm text-stone-400 font-medium">Active Campaigns</div>
          </div>
        </div>
      </section>

      {/* ── Campaign Grid ─────────────────────────────────────────── */}
      <section id="campaigns" className="max-w-6xl mx-auto px-6 py-16">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="font-display text-3xl font-bold text-stone-900 mb-2">
              Active Campaigns
            </h2>
            <p className="text-stone-500 text-sm">
              Every campaign is reviewed and verified by our team.
            </p>
          </div>
        </div>

        {campaigns.length === 0 ? (
          <div className="text-center py-20 text-stone-400">
            <Target className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No active campaigns at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign, i) => {
              const progress = calcProgress(
                Number(campaign.raisedAmount),
                Number(campaign.targetAmount)
              );
              return (
                <Link
                  key={campaign.id}
                  href={`/campaigns/${campaign.id}`}
                  className="group bg-white rounded-2xl border border-stone-200 overflow-hidden hover:border-stone-300 hover:shadow-lg transition-all duration-300"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  {/* Campaign image */}
                  <div className="aspect-[16/9] bg-gradient-to-br from-stone-100 to-stone-200 overflow-hidden relative">
                    {campaign.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={campaign.imageUrl}
                        alt={campaign.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-4xl opacity-20">🎯</span>
                      </div>
                    )}
                    {/* Progress overlay pill */}
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-xs font-bold text-emerald-700 shadow-sm">
                      {progress}%
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="p-5">
                    <h3 className="font-semibold text-stone-900 mb-1.5 leading-snug group-hover:text-emerald-700 transition-colors">
                      {campaign.title}
                    </h3>
                    <p className="text-sm text-stone-500 mb-4 leading-relaxed">
                      {truncate(campaign.description, 90)}
                    </p>

                    {/* Progress bar */}
                    <div className="h-1.5 bg-stone-100 rounded-full mb-3 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    {/* Amounts */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-bold text-stone-900">
                          {formatCurrency(Number(campaign.raisedAmount))}
                        </div>
                        <div className="text-xs text-stone-400">
                          of {formatCurrency(Number(campaign.targetAmount))}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-stone-400">
                        <Users className="w-3.5 h-3.5" />
                        {campaign._count.donations} donors
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ── How It Works ─────────────────────────────────────────── */}
      <section id="how-it-works" className="bg-white border-t border-stone-100 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold text-stone-900 mb-3">
              How It Works
            </h2>
            <p className="text-stone-500 max-w-md mx-auto text-sm">
              Simple, transparent, and secure. Your donation reaches the campaign
              directly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Target className="w-5 h-5 text-emerald-600" />,
                step: "01",
                title: "Choose a Campaign",
                desc: "Browse verified campaigns and find a cause that resonates with you.",
              },
              {
                icon: <Zap className="w-5 h-5 text-emerald-600" />,
                step: "02",
                title: "Make a Donation",
                desc: "Pay securely via Razorpay — UPI, cards, net banking, and wallets.",
              },
              {
                icon: <Users className="w-5 h-5 text-emerald-600" />,
                step: "03",
                title: "Track Impact",
                desc: "Watch the campaign progress in real-time as the community rallies.",
              },
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                    {item.icon}
                  </div>
                  <span className="text-xs font-bold text-stone-300 tracking-widest">
                    {item.step}
                  </span>
                </div>
                <h3 className="font-semibold text-stone-900 mb-2">{item.title}</h3>
                <p className="text-sm text-stone-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
