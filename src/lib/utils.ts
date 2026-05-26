// src/lib/utils.ts

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// USD to INR approximate rate (update periodically or fetch live)
export const USD_TO_INR = 84;

// Format amount in INR
export function formatCurrency(amount: number | string, currency: "INR" | "USD" = "INR"): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (currency === "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(num);
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
}

// Convert USD donation amount to INR for display
export function usdToInr(usd: number): number {
  return Math.round(usd * USD_TO_INR);
}

// Format a USD amount as its INR equivalent
export function formatUsdAsInr(usd: number | string): string {
  const num = typeof usd === "string" ? parseFloat(usd) : usd;
  return formatCurrency(usdToInr(num), "INR");
}

// Calculate campaign progress percentage (capped at 100)
export function calcProgress(raised: number | string, target: number | string): number {
  const r = typeof raised === "string" ? parseFloat(raised) : raised;
  const t = typeof target === "string" ? parseFloat(target) : target;
  if (t <= 0) return 0;
  return Math.min(Math.round((r / t) * 100), 100);
}

// Truncate text with ellipsis
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "…";
}

// Format relative date
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

// Slugify text for display
export function formatStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
}