"use client";
// src/app/admin/login/page.tsx

import { useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Heart, Loader2, Eye, EyeOff, AlertCircle } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Login failed"); return; }
      router.push(redirect);
      router.refresh();
    } catch { setError("Network error. Please try again."); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 opacity-[0.025] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #1c1917 1px, transparent 0)", backgroundSize: "32px 32px" }} />
      <div className="relative w-full max-w-sm">
        <div className="bg-white rounded-2xl border border-stone-200 shadow-lg shadow-stone-100 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-stone-900 mb-4 shadow-md">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <h1 className="text-xl font-bold text-stone-900 tracking-tight">Admin Portal</h1>
            <p className="text-sm text-stone-500 mt-1">Sign in to manage campaigns</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-1.5">Email</label>
              <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:border-stone-400 focus:ring-2 focus:ring-stone-100 outline-none transition-all placeholder:text-stone-300" />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-stone-600 uppercase tracking-wide mb-1.5">Password</label>
              <div className="relative">
                <input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-4 py-2.5 pr-10 rounded-xl border border-stone-200 text-sm focus:border-stone-400 focus:ring-2 focus:ring-stone-100 outline-none transition-all placeholder:text-stone-300" />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors" tabIndex={-1}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {error && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-50 border border-red-200">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-red-700">{error}</p>
              </div>
            )}
            <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-stone-900 text-white text-sm font-semibold hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2">
              {loading ? (<><Loader2 className="w-4 h-4 animate-spin" />Signing in...</>) : "Sign In"}
            </button>
          </form>
        </div>
        <p className="text-center text-xs text-stone-400 mt-4">Protected area · Fundwise Administration</p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
