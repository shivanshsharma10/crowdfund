// src/app/(public)/layout.tsx

import Link from "next/link";
import { Heart } from "lucide-react";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Navigation ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-stone-200">
        <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shadow-sm">
              <Heart className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="font-semibold text-stone-900 tracking-tight text-lg">
              Fund<span className="text-emerald-600">wise</span>
            </span>
          </Link>

          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="text-sm text-stone-600 hover:text-stone-900 transition-colors font-medium"
            >
              Campaigns
            </Link>
            <Link
              href="/#how-it-works"
              className="text-sm text-stone-600 hover:text-stone-900 transition-colors font-medium"
            >
              How It Works
            </Link>
          </div>
        </nav>
      </header>

      {/* ── Page content ─────────────────────────────────────────── */}
      <main className="flex-1">{children}</main>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="border-t border-stone-200 bg-white mt-16">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-emerald-600 flex items-center justify-center">
              <Heart className="w-3 h-3 text-white fill-white" />
            </div>
            <span className="text-sm font-medium text-stone-700">Fundwise</span>
          </div>
          <p className="text-sm text-stone-400">
            © {new Date().getFullYear()} Fundwise. Built with purpose.
          </p>
        </div>
      </footer>
    </div>
  );
}
