"use client";
// src/components/shared/DonateWidget.tsx

import { useState, useCallback, useEffect, useRef } from "react";
import { Heart, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    Stripe: (key: string) => StripeInstance;
  }
}

interface StripeInstance {
  elements(options: object): StripeElements;
  confirmPayment(options: object): Promise<{ error?: { message: string } }>;
}
interface StripeElements {
  create(type: string, options?: object): StripeElement;
  submit(): Promise<{ error?: { message: string } }>;
}
interface StripeElement {
  mount(selector: string): void;
  destroy(): void;
}

type Step = "form" | "stripe-elements" | "loading" | "success" | "error";

const USD_PRESETS = [5, 10, 25, 50];

interface DonateWidgetProps {
  campaignId: string;
  campaignTitle: string;
}

export function DonateWidget({ campaignId, campaignTitle }: DonateWidgetProps) {
  const [step, setStep] = useState<Step>("form");
  const [amount, setAmount] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [stripeLoading, setStripeLoading] = useState(false);

  const stripeRef = useRef<StripeInstance | null>(null);
  const elementsRef = useRef<StripeElements | null>(null);
  const paymentElementRef = useRef<StripeElement | null>(null);

  const selectedAmount = amount || customAmount;

  useEffect(() => {
    return () => {
      paymentElementRef.current?.destroy();
      paymentElementRef.current = null;
    };
  }, []);

  const loadStripe = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (typeof window.Stripe === "function") return resolve();
      const script = document.createElement("script");
      script.src = "https://js.stripe.com/v3/";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Stripe SDK"));
      document.head.appendChild(script);
    });
  }, []);

  const validate = () => {
    const amountNum = parseFloat(selectedAmount);
    if (!selectedAmount || isNaN(amountNum) || amountNum < 1) {
      setErrorMsg("Please enter a valid amount (minimum $1)");
      return false;
    }
    if (!donorName.trim()) {
      setErrorMsg("Please enter your name");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donorEmail)) {
      setErrorMsg("Please enter a valid email address");
      return false;
    }
    return true;
  };

  // ── Step 1: create PaymentIntent, mount Stripe Element ────────
  const handleStripeInit = async () => {
    if (!validate()) return;
    setErrorMsg("");
    setStep("loading");

    try {
      await loadStripe();

      const res = await fetch("/api/donate/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaignId,
          amount: parseFloat(selectedAmount),
          donorName: donorName.trim(),
          donorEmail: donorEmail.trim().toLowerCase(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to initialize payment");

      const stripe = window.Stripe(data.publishableKey);
      stripeRef.current = stripe;

      const elements = stripe.elements({
        clientSecret: data.clientSecret,
        appearance: {
          theme: "stripe",
          variables: { colorPrimary: "#16a34a", borderRadius: "12px" },
        },
      });
      elementsRef.current = elements;

      const paymentElement = elements.create("payment", {
        layout: "tabs",
        fields: {
          billingDetails: {
            name: "auto",
            email: "auto",
            address: "auto",
          },
        },
        defaultValues: {
          billingDetails: { name: donorName, email: donorEmail },
        },
      });
      paymentElementRef.current = paymentElement;

      setStep("stripe-elements");
      setTimeout(() => paymentElement.mount("#stripe-payment-element"), 50);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setStep("error");
    }
  };

  // ── Step 2: confirm payment ───────────────────────────────────
  const handleStripeConfirm = async () => {
    if (!elementsRef.current || !stripeRef.current) return;
    setStripeLoading(true);
    setErrorMsg("");

    try {
      const { error: submitError } = await elementsRef.current.submit();
      if (submitError) throw new Error(submitError.message);

      const { error } = await stripeRef.current.confirmPayment({
        elements: elementsRef.current,
        redirect: "if_required",
      });

      if (error) throw new Error(error.message);
      setStep("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Payment failed. Please try again.");
    } finally {
      setStripeLoading(false);
    }
  };

  // ── Success ───────────────────────────────────────────────────
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
            Your donation of ${parseFloat(selectedAmount).toLocaleString()} is being processed.
            You&apos;ll receive a confirmation email shortly.
          </p>
        </div>
        <button
          onClick={() => {
            setStep("form");
            setAmount("");
            setCustomAmount("");
            setDonorName("");
            setDonorEmail("");
            setErrorMsg("");
          }}
          className="text-sm text-emerald-600 hover:text-emerald-700 font-medium underline underline-offset-2"
        >
          Donate again
        </button>
      </div>
    );
  }

  // ── Stripe payment element ─────────────────────────────────────
  if (step === "stripe-elements") {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-2 text-sm text-stone-500">
          <button
            onClick={() => {
              paymentElementRef.current?.destroy();
              setStep("form");
            }}
            className="text-emerald-600 hover:text-emerald-700 font-medium"
          >
            ← Back
          </button>
          <span>·</span>
          <span>Donating ${parseFloat(selectedAmount).toLocaleString()} USD</span>
        </div>

        <div id="stripe-payment-element" className="min-h-[200px]" />

        {errorMsg && (
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200">
            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-700">{errorMsg}</p>
          </div>
        )}

        <button
          onClick={handleStripeConfirm}
          disabled={stripeLoading}
          className={cn(
            "w-full py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-sm",
            stripeLoading
              ? "bg-stone-100 text-stone-400 cursor-not-allowed"
              : "bg-emerald-600 text-white hover:bg-emerald-700"
          )}
        >
          {stripeLoading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
          ) : (
            <><Heart className="w-4 h-4" /> Confirm Donation</>
          )}
        </button>
      </div>
    );
  }

  // ── Main form ─────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* Amount presets */}
      <div>
        <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-2">
          Select Amount (USD)
        </label>
        <div className="grid grid-cols-2 gap-2 mb-2">
          {USD_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => { setAmount(String(preset)); setCustomAmount(""); }}
              className={cn(
                "py-2.5 rounded-xl border text-sm font-semibold transition-all",
                amount === String(preset)
                  ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                  : "bg-white border-stone-200 text-stone-700 hover:border-emerald-400 hover:text-emerald-700"
              )}
            >
              ${preset}
            </button>
          ))}
        </div>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm font-medium">
            $
          </span>
          <input
            type="number"
            placeholder="Other amount"
            value={customAmount}
            onChange={(e) => { setCustomAmount(e.target.value); setAmount(""); }}
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

      {/* Error */}
      {(step === "error" || errorMsg) && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-red-700">{errorMsg || "Something went wrong. Please try again."}</p>
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleStripeInit}
        disabled={step === "loading" || !selectedAmount}
        className={cn(
          "w-full py-3.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-sm",
          step === "loading" || !selectedAmount
            ? "bg-stone-100 text-stone-400 cursor-not-allowed"
            : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200 hover:shadow-md"
        )}
      >
        {step === "loading" ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Initializing...</>
        ) : (
          <>
            <Heart className="w-4 h-4" />
            Donate{selectedAmount && ` $${parseFloat(selectedAmount).toLocaleString()}`}
          </>
        )}
      </button>

      <p className="text-center text-xs text-stone-400">
        Secured by Stripe · 100% to campaign
      </p>
    </div>
  );
}