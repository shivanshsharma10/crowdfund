"use client";
// src/components/shared/CampaignForm.tsx

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { CampaignStatus } from "@prisma/client";

interface CampaignFormProps {
  mode: "create" | "edit";
  campaignId?: string;
  initialData?: {
    title: string;
    description: string;
    targetAmount: number;
    imageUrl?: string | null;
    status: CampaignStatus;
  };
}

export function CampaignForm({ mode, campaignId, initialData }: CampaignFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [targetAmount, setTargetAmount] = useState(
    initialData?.targetAmount ? String(initialData.targetAmount) : ""
  );
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl ?? "");
  const [status, setStatus] = useState<CampaignStatus>(
    initialData?.status ?? CampaignStatus.ACTIVE
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    const target = parseFloat(targetAmount);
    if (isNaN(target) || target <= 0) {
      setError("Target amount must be a positive number");
      setLoading(false);
      return;
    }

    try {
      const url =
        mode === "create"
          ? "/api/admin/campaigns"
          : `/api/admin/campaigns/${campaignId}`;
      const method = mode === "create" ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          targetAmount: target,
          imageUrl: imageUrl.trim() || null,
          status,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Operation failed");
        return;
      }

      setSuccess(true);
      if (mode === "create") {
        setTimeout(() => router.push("/admin/campaigns"), 1000);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 outline-none transition-all placeholder:text-stone-300 bg-white";
  const labelClass =
    "block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Title */}
      <div>
        <label className={labelClass}>Campaign Title *</label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Give your campaign a compelling title"
          className={inputClass}
        />
      </div>

      {/* Description */}
      <div>
        <label className={labelClass}>Description *</label>
        <textarea
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Tell the story behind this campaign. Why does it matter?"
          rows={6}
          className={`${inputClass} resize-none`}
        />
      </div>

      {/* Target amount & Image URL side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Target Amount (₹) *</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm">₹</span>
            <input
              type="number"
              required
              min={1}
              step="0.01"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              placeholder="50000"
              className={`${inputClass} pl-8`}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as CampaignStatus)}
            className={inputClass}
          >
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">Paused</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      {/* Image URL */}
      <div>
        <label className={labelClass}>Cover Image URL</label>
        <input
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://example.com/image.jpg"
          className={inputClass}
        />
        {imageUrl && (
          <div className="mt-2 rounded-xl overflow-hidden border border-stone-200 aspect-video bg-stone-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={(e) =>
                ((e.target as HTMLImageElement).style.display = "none")
              }
            />
          </div>
        )}
      </div>

      {/* Feedback */}
      {error && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-emerald-800 font-medium">
            {mode === "create"
              ? "Campaign created successfully! Redirecting..."
              : "Campaign updated successfully!"}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-emerald-200"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {mode === "create" ? "Creating..." : "Saving..."}
            </>
          ) : mode === "create" ? (
            "Create Campaign"
          ) : (
            "Save Changes"
          )}
        </button>

        <button
          type="button"
          onClick={() => router.push("/admin/campaigns")}
          className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-sm font-medium hover:border-stone-300 hover:bg-stone-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
