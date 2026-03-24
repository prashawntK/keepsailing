"use client";

import { useEffect } from "react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="glass-card p-8 max-w-md w-full text-center space-y-5">
        <div className="text-5xl">⚠️</div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-gray-100">Something went wrong</h1>
          {error.message && (
            <p className="text-sm text-gray-400 break-words">{error.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <button
            onClick={reset}
            className="w-full py-2.5 px-4 rounded-xl bg-primary/20 border border-primary/40 text-primary font-semibold text-sm hover:bg-primary/30 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="w-full py-2.5 px-4 rounded-xl bg-surface-2 border border-white/[0.08] text-gray-300 font-semibold text-sm hover:bg-surface-3 transition-colors text-center"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
