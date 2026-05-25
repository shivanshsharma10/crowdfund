// src/app/admin/campaigns/new/page.tsx

import { CampaignForm } from "@/components/shared/CampaignForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewCampaignPage() {
  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <Link
          href="/admin/campaigns"
          className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Campaigns
        </Link>
        <h1 className="text-2xl font-bold text-stone-900 font-display">
          New Campaign
        </h1>
        <p className="text-stone-500 text-sm mt-0.5">
          Create a new fundraising campaign
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8">
        <CampaignForm mode="create" />
      </div>
    </div>
  );
}
