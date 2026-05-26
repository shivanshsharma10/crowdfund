import { prisma } from "@/lib/prisma";
import { formatUsdAsInr, calcProgress } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let campaigns: any[] = [];
  try {
    campaigns = await prisma.campaign.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { donations: { where: { status: "SUCCESS" } } } },
      },
    });
  } catch {
    campaigns = [];
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-stone-900 mb-2">Active Campaigns</h1>
        <p className="text-stone-500">Support a cause you care about.</p>
      </div>

      {campaigns.length === 0 ? (
        <div className="text-center py-20 text-stone-400">
          No active campaigns right now. Check back soon.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => {
            const progress = calcProgress(
              Number(campaign.raisedAmount),
              Number(campaign.targetAmount)
            );
            return (
              <Link href={`/campaigns/${campaign.id}`} key={campaign.id}>
                <div className="bg-white rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow p-5">
                  <div className="aspect-video rounded-xl overflow-hidden bg-stone-100 mb-4">
                    {campaign.imageUrl ? (
                      <img src={campaign.imageUrl} alt={campaign.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl opacity-20">🎯</div>
                    )}
                  </div>
                  <h2 className="font-semibold text-stone-900 mb-1 line-clamp-2">{campaign.title}</h2>
                  <p className="text-sm text-stone-500 mb-4 line-clamp-2">{campaign.description}</p>
                  <div className="h-1.5 bg-stone-100 rounded-full mb-2 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-stone-900">{formatUsdAsInr(Number(campaign.raisedAmount))}</span>
                    <span className="text-stone-400">{progress}% funded</span>
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-xs text-stone-400">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    {campaign._count.donations} supporters
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}