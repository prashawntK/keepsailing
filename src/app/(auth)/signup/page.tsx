"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin}/api/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <div className="glass-panel rounded-2xl p-8 space-y-4 text-center">
        <div className="text-5xl">📬</div>
        <h2 className="text-xl font-bold text-gray-50">Check your email</h2>
        <p className="text-gray-400 text-sm">
          We sent a confirmation link to <span className="text-gray-200">{email}</span>.
          Click it to activate your account.
        </p>
        <Link href="/login">
          <Button variant="secondary" className="mt-2">Back to sign in</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-1">
        <img src="/logo.svg" alt="Keep Sailing" className="w-16 h-16 mx-auto mb-1" />
        <h1 className="text-2xl font-bold text-gray-50">Create your account</h1>
        <p className="text-sm text-gray-400">Free forever. No credit card needed.</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSignup} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-300" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-surface-2 border border-white/[0.08] text-gray-50 placeholder-gray-500 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-colors"
            placeholder="Your name"
          />
        </div>

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
          <label className="text-sm font-medium text-gray-300" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-surface-2 border border-white/[0.08] text-gray-50 placeholder-gray-500 focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/30 transition-colors"
            placeholder="At least 8 characters"
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
          Create account
        </Button>
      </form>

      <p className="text-center text-xs text-gray-600">
        By signing up you agree to our{" "}
        <Link href="/terms" className="text-gray-500 hover:text-gray-400 underline">Terms</Link>
        {" "}and{" "}
        <Link href="/privacy" className="text-gray-500 hover:text-gray-400 underline">Privacy Policy</Link>.
      </p>

      {/* Footer */}
      <p className="text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link href="/login" className="text-primary-light hover:text-primary font-medium transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
}
