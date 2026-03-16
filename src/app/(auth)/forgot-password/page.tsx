"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export default function ForgotPasswordPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/api/auth/callback?next=/reset-password`,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <div className="glass-panel rounded-2xl p-8 space-y-4 text-center">
        <div className="text-5xl">📩</div>
        <h2 className="text-xl font-bold text-gray-50">Reset link sent</h2>
        <p className="text-gray-400 text-sm">
          Check your inbox at <span className="text-gray-200">{email}</span> for a link to reset your password.
        </p>
        <Link href="/login">
          <Button variant="secondary" className="mt-2">Back to sign in</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-8 space-y-6">
      <div className="text-center space-y-1">
        <div className="text-4xl mb-3">🔑</div>
        <h1 className="text-2xl font-bold text-gray-50">Reset password</h1>
        <p className="text-sm text-gray-400">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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

        {error && (
          <div className="px-4 py-3 rounded-xl bg-error-muted border border-error/20 text-sm text-error">
            {error}
          </div>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? <span className="animate-spin">⏳</span> : null}
          Send reset link
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500">
        Remember your password?{" "}
        <Link href="/login" className="text-primary-light hover:text-primary font-medium transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
