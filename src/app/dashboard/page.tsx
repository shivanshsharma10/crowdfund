// src/app/dashboard/page.tsx
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CheckCircle2, Clock, XCircle, Heart, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();

  // Fetch donations by this user's email
  const userEmail = user?.primaryEmailAddress?.emailAddress;

  const donations = userEmail
    ? await prisma.donation.findMany({
        where: { donorEmail: userEmail },
        orderBy: { createdAt: "desc" },
        include: {
          campaign: {
            select: { id: true, title: true, status: true },
          },
        },
      })
    : [];

  const totalDonated = donations
    .filter((d) => d.status === "SUCCESS")
    .reduce((sum, d) => sum + Number(d.amount), 0);

  const successCount = donations.filter((d) => d.status === "SUCCESS").length;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700 transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Campaigns
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stone-900 mb-1">
          My Donations
        </h1>
        <p className="text-stone-500">
          Welcome back, {user?.firstName ?? "there"}!
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Heart className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-sm text-stone-500">Total Donated</span>
          </div>
          <p className="text-2xl font-bold text-stone-900">
            {formatCurrency(totalDonated)}
          </p>
          <p className="text-xs text-stone-400 mt-0.5">
            ≈ ${totalDonated.toFixed(0)} USD
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-sm text-stone-500">Successful</span>
          </div>
          <p className="text-2xl font-bold text-stone-900">{successCount}</p>
          <p className="text-xs text-stone-400 mt-0.5">donations completed</p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center">
              <Clock className="w-4 h-4 text-stone-500" />
            </div>
            <span className="text-sm text-stone-500">Total Attempts</span>
          </div>
          <p className="text-2xl font-bold text-stone-900">{donations.length}</p>
          <p className="text-xs text-stone-400 mt-0.5">all time</p>
        </div>
      </div>

      {/* Donation history */}
      <div className="bg-white rounded-2xl border border-stone-200">
        <div className="px-6 py-4 border-b border-stone-100">
          <h2 className="font-semibold text-stone-900">Donation History</h2>
        </div>

        {donations.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4">
              <Heart className="w-6 h-6 text-stone-400" />
            </div>
            <p className="text-stone-500 mb-4">No donations yet</p>
            <Link
              href="/"
              className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Browse campaigns →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {donations.map((donation) => (
              <div
                key={donation.id}
                className="flex items-center justify-between px-6 py-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    {donation.status === "SUCCESS" ? (
                      <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      </div>
                    ) : donation.status === "PENDING" ? (
                      <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-amber-600" />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center">
                        <XCircle className="w-5 h-5 text-red-500" />
                      </div>
                    )}
                  </div>
                  <div>
                    <Link
                      href={`/campaigns/${donation.campaign.id}`}
                      className="text-sm font-medium text-stone-900 hover:text-emerald-600 transition-colors"
                    >
                      {donation.campaign.title}
                    </Link>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {formatDate(donation.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm font-bold text-stone-900">
                    {formatCurrency(Number(donation.amount))}
                  </p>
                  <p className="text-xs text-stone-400">
                    ${Number(donation.amount).toFixed(0)} USD
                  </p>
                  <span
                    className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                      donation.status === "SUCCESS"
                        ? "bg-emerald-100 text-emerald-700"
                        : donation.status === "PENDING"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {donation.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}