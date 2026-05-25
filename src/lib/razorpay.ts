// src/lib/razorpay.ts
// Server-side Razorpay helpers

import Razorpay from "razorpay";

// Lazily instantiate so missing env vars in build don't crash
let _razorpay: Razorpay | null = null;

export function getRazorpayClient(): Razorpay {
  if (!_razorpay) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      throw new Error("RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set");
    }
    _razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
  }
  return _razorpay;
}

// Convert rupees to paise (Razorpay uses smallest currency unit)
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}
