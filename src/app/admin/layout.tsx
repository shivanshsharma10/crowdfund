// src/app/admin/layout.tsx

import Link from "next/link";
import { Heart, LayoutDashboard, Megaphone, LogOut } from "lucide-react";
import { LogoutButton } from "@/components/shared/LogoutButton";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-stone-50">
      {/* ── Sidebar ───────────────────────────────────────────── */}
      <aside className="w-60 flex-shrink-0 bg-stone-900 flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center">
              <Heart className="w-3.5 h-3.5 text-white fill-white" />
            </div>
            <span className="font-semibold text-white tracking-tight">
              Fund<span className="text-emerald-400">wise</span>
            </span>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <p className="px-3 text-xs font-semibold text-stone-500 uppercase tracking-widest mb-3">
            Management
          </p>

          <Link
            href="/admin"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-stone-300 hover:bg-stone-800 hover:text-white transition-colors text-sm font-medium group"
          >
            <LayoutDashboard className="w-4 h-4 text-stone-500 group-hover:text-emerald-400 transition-colors" />
            Dashboard
          </Link>

          <Link
            href="/admin/campaigns"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-stone-300 hover:bg-stone-800 hover:text-white transition-colors text-sm font-medium group"
          >
            <Megaphone className="w-4 h-4 text-stone-500 group-hover:text-emerald-400 transition-colors" />
            Campaigns
          </Link>
        </nav>

        {/* Bottom logout */}
        <div className="p-3 border-t border-stone-800">
          <LogoutButton />
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-stone-200 flex items-center px-8 justify-between">
          <div className="text-sm text-stone-500">
            <span className="font-medium text-stone-900">Admin</span> Dashboard
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center">
              <span className="text-xs font-bold text-white">A</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
