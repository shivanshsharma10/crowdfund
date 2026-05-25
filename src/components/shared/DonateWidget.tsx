"use client";
// src/components/shared/DonateWidget.tsx
// Client component — opens Razorpay checkout overlay

import { useState, useCallback } from "react";
import { Heart, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: { name?: string; email?: string };
  theme?: { color?: string };
  handler: (response: RazorpayResponse) => void;
  modal?: { ondismiss?: () => void };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open(): void;
}

const PRESET_AMOUNTS = [500, 1000, 2500, 5000];

interface DonateWidgetProps {
  campaignId: string;
  campaignTitle: string;
}

type Step = "form" | "loading" | "success" | "error";

export function DonateWidget({ campaignId, campaignTitle }: DonateWidgetProps) {
  const [step, setStep] = useState<Step>("form");
  const [amount, setAmount] = useState<string>("");
  const [customAmount, setCustomAmount] = useState<string>("");
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const selectedAmount = amount || customAmount;

  // Load Razorpay script lazily
  const loadRazorpay = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) return resolve();
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
      document.head.appendChild(script);
    });
  }, []);

  const handleDonate = async () => {
    // ── Client-side validation ───────────────────────────────────
    const amountNum = parseFloat(selectedAmount);
    if (!selectedAmount || isNaN(amountNum) || amountNum < 1) {
      setErrorMsg("Please enter a valid amount (minimum ₹1)");
      return;
    }
    if (!donorName.trim()) {
      setErrorMsg("Please enter your name");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donorEmail)) {
      setErrorMsg("Please enter a valid email address");
      return;
    }

    setErrorMsg("");
    setStep("loading");

    try {
      // ── 1. Load Razorpay SDK ──────────────────────────────────
      await loadRazorpay();

      // ── 2. Create order on backend ────────────────────────────
      const res = await fetch("/api/donate/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId,
          amount: amountNum,
          donorName: donorName.trim(),
          donorEmail: donorEmail.trim().toLowerCase(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to initialize payment");
      }

      // ── 3. Open Razorpay checkout overlay ─────────────────────
      const rzp = new window.Razorpay({
        key: data.keyId,
        amount: amountNum * 100, // paise
        currency: "INR",
        name: "Fundwise",
        description: campaignTitle,
        order_id: data.orderId,
        prefill: { name: donorName, email: donorEmail },
        theme: { color: "#16a34a" },
        handler: (_response: RazorpayResponse) => {
          // Payment captured — webhook will verify & update DB
          // We just show success to the user here
          setStep("success");
        },
        modal: {
          ondismiss: () => {
            // User closed the overlay without paying
            setStep("form");
          },
        },
      });

      rzp.open();
      // After opening, reset loading (overlay is visible)
      setStep("form");
    } catch (err) {
      console.error("[DonateWidget]", err);
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setStep("error");
    }
  };

  // ── Success screen ─────────────────────────────────────────────
  if (step === "success") {
    return (
      <div className="text-center py-6 space-y-4">
        <div className="w-14 h-14 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-7 h-7 text-emerald-600" />
        </div>
        <div>
          <h3 className="font-semibold text-stone-900 mb-1">
            Thank you, {donorName.split(" ")[0]}!
          </h3>
          <p className="text-sm text-stone-500">
            Your donation of ₹{selectedAmount} is being processed. You&apos;ll
            receive a confirmation email shortly.
          </p>
        </div>
        <button
          onClick={() => {
            setStep("form");
            setAmount("");
            setCustomAmount("");
            setDonorName("");
            setDonorEmail("");
          }}
          className="text-sm text-emerald-600 hover:text-emerald-700 font-medium underline underline-offset-2"
        >
          Donate again
        </button>
      </div>
    );
  }

  // ── Form screen ────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Amount presets */}
      <div>
        <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-2">
          Select Amount
        </label>
        <div className="grid grid-cols-2 gap-2 mb-2">
          {PRESET_AMOUNTS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                setAmount(String(preset));
                setCustomAmount("");
              }}
              className={cn(
                "py-2.5 rounded-xl border text-sm font-semibold transition-all",
                amount === String(preset)
                  ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                  : "bg-white border-stone-200 text-stone-700 hover:border-emerald-400 hover:text-emerald-700"
              )}
            >
              ₹{preset.toLocaleString("en-IN")}
            </button>
          ))}
        </div>
        {/* Custom amount */}
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm font-medium">
            ₹
          </span>
          <input
            type="number"
            placeholder="Other amount"
            value={customAmount}
            onChange={(e) => {
              setCustomAmount(e.target.value);
              setAmount("");
            }}
            min={1}
            className={cn(
              "w-full pl-8 pr-4 py-2.5 rounded-xl border text-sm font-medium transition-colors outline-none",
              customAmount
                ? "border-emerald-400 ring-1 ring-emerald-200"
                : "border-stone-200 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200"
            )}
          />
        </div>
      </div>

      {/* Donor info */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-1.5">
            Your Name
          </label>
          <input
            type="text"
            placeholder="Full name"
            value={donorName}
            onChange={(e) => setDonorName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200 outline-none transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-1.5">
            Email Address
          </label>
          <input
            type="email"
            placeholder="you@example.com"
            value={donorEmail}
            onChange={(e) => setDonorEmail(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200 outline-none transition-colors"
          />
        </div>
      </div>

      {/* Error message */}
      {(step === "error" || errorMsg) && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-red-700">{errorMsg || "Something went wrong. Please try again."}</p>
        </div>
      )}

      {/* Submit button */}
      <button
        onClick={handleDonate}
        disabled={step === "loading" || !selectedAmount}
        className={cn(
          "w-full py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-sm",
          step === "loading" || !selectedAmount
            ? "bg-stone-100 text-stone-400 cursor-not-allowed"
            : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200 hover:shadow-md hover:shadow-emerald-200"
        )}
      >
        {step === "loading" ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Initializing...
          </>
        ) : (
          <>
            <Heart className="w-4 h-4" />
            Donate
            {selectedAmount && ` ₹${parseFloat(selectedAmount).toLocaleString("en-IN")}`}
          </>
        )}
      </button>
    </div>
  );
}
