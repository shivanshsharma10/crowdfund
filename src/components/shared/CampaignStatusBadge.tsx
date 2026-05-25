// src/components/shared/CampaignStatusBadge.tsx

import { CampaignStatus } from "@prisma/client";

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  const map: Record<CampaignStatus, { label: string; className: string }> = {
    ACTIVE: {
      label: "Active",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    PAUSED: {
      label: "Paused",
      className: "bg-amber-50 text-amber-700 border-amber-200",
    },
    COMPLETED: {
      label: "Completed",
      className: "bg-blue-50 text-blue-700 border-blue-200",
    },
  };

  const { label, className } = map[status];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${className}`}
    >
      {label}
    </span>
  );
}
