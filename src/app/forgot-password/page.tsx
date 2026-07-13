"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth/auth-client";
import { AuthBrand } from "@/components/auth-brand";
import { CharCounter } from "@/components/char-counter";
import { DemoEmailNotice } from "@/components/demo-email-notice";
import { TEXT_LIMITS } from "@/lib/text-limits";

export default function GlomtLosenordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authClient.requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <AuthBrand />
        <h1>Forgot Password</h1>

        {done ? (
          <div className="mt-4 rounded-lg border border-brand-green-dark/30 bg-brand-green-light p-4 text-sm text-gray-700">
            If that email address is registered, we&apos;ll send a reset link
            shortly. Be sure to check your spam folder too.
          </div>
        ) : (
          <>
            <p className="mt-2 text-sm text-gray-600">
              Enter your email address and we&apos;ll send you a link to reset
              the password for your staff account.
            </p>
            <p className="mt-2 text-sm text-brand-green-dark">
              Demo tip: use one of the accounts on the sign-in page instead —
              the reset link isn&apos;t actually sent in this demo.
            </p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={TEXT_LIMITS.email}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-brand-green-dark focus:outline-none focus:ring-1 focus:ring-brand-green-dark"
                />
                <CharCounter value={email} max={TEXT_LIMITS.email} />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <DemoEmailNotice />

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md border border-brand-green-dark bg-brand-green-dark px-4 py-2 font-semibold text-gray-900 transition-colors hover:bg-brand-green-dark hover:text-white disabled:opacity-50"
              >
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>
          </>
        )}

        <p className="mt-4 text-sm text-gray-600">
          <Link href="/sign-in" className="font-medium text-brand-green-dark underline underline-offset-2 hover:text-gray-900">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
