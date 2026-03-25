"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push(next);
      router.refresh();
    }
  }

  return (
    <div className="glass-panel rounded-2xl p-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-1">
        <img src="/logo.svg" alt="Keep Sailing" className="w-16 h-16 mx-auto mb-1" />
        <h1 className="text-2xl font-bold text-gray-50">Welcome back</h1>
        <p className="text-sm text-gray-400">Sign in to Keep Sailing</p>
      </div>

      {/* Email / Password form */}
      <form onSubmit={handleEmailLogin} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-300" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-surface-2 border border-white/[0.08] text-gray-50 placeholder-gray-500 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-colors"
            placeholder="you@example.com"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-300" htmlFor="password">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-primary-light hover:text-primary transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-surface-2 border border-white/[0.08] text-gray-50 placeholder-gray-500 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-colors"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl bg-error-muted border border-error/20 text-sm text-error">
            {error}
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={loading}
        >
          {loading ? <span className="animate-spin">⏳</span> : null}
          Sign in
        </Button>
      </form>

      {/* Footer */}
      <p className="text-center text-sm text-gray-500">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="text-primary-light hover:text-primary font-medium transition-colors">
          Sign up free
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
