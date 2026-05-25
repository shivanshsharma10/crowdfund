// src/app/not-found.tsx

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-8xl font-display font-bold text-stone-200 mb-4">404</div>
        <h1 className="text-2xl font-bold text-stone-900 mb-2">Page not found</h1>
        <p className="text-stone-500 text-sm mb-8 max-w-sm mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 text-white text-sm font-semibold hover:bg-stone-800 transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
