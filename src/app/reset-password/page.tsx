"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { authClient } from "@/lib/auth/auth-client";
import { AuthBrand } from "@/components/auth-brand";
import { CharCounter } from "@/components/char-counter";
import { TEXT_LIMITS } from "@/lib/text-limits";

function PasswordInput({
  id,
  label,
  value,
  onChange,
  show,
  onToggleShow,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggleShow: () => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative mt-1">
        <input
          id={id}
          type={show ? "text" : "password"}
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={TEXT_LIMITS.password}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 pr-10 text-gray-900 shadow-sm focus:border-brand-green-dark focus:outline-none focus:ring-1 focus:ring-brand-green-dark"
        />
        <button
          type="button"
          onClick={onToggleShow}
          tabIndex={-1}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-600 hover:text-gray-600"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      <CharCounter value={value} max={TEXT_LIMITS.password} />
    </div>
  );
}

function ResetForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return (
      <p className="mt-4 text-sm text-red-600">
        Invalid or expired link. Please request a new reset link.
      </p>
    );
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setError(null);

    if (password !== passwordConfirm) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password.length > TEXT_LIMITS.password) {
      setError(`Password must be at most ${TEXT_LIMITS.password} characters.`);
      return;
    }

    setLoading(true);
    try {
      const result = await authClient.resetPassword({ newPassword: password, token });
      if (result.error) {
        setError("The link is invalid or has expired. Please request a new reset link.");
        return;
      }
      router.push("/sign-in?reset=1");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <PasswordInput
        id="password"
        label="New password (min. 8 characters)"
        value={password}
        onChange={setPassword}
        show={showPassword}
        onToggleShow={() => setShowPassword((v) => !v)}
      />
      <PasswordInput
        id="password-confirm"
        label="Confirm new password"
        value={passwordConfirm}
        onChange={setPasswordConfirm}
        show={showPasswordConfirm}
        onToggleShow={() => setShowPasswordConfirm((v) => !v)}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md border border-brand-green-dark bg-brand-green-dark px-4 py-2 font-semibold text-gray-900 transition-colors hover:bg-brand-green-dark hover:text-white disabled:opacity-50"
      >
        {loading ? "Saving…" : "Save new password"}
      </button>
    </form>
  );
}

export default function AterstallLosenordPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <AuthBrand />
        <h1>New Password</h1>
        <p className="mt-2 text-sm text-gray-600">
          Choose a new password for your staff account at Demo Folk High School.
        </p>
        <Suspense fallback={<p className="mt-4 text-sm text-gray-600">Loading…</p>}>
          <ResetForm />
        </Suspense>
        <p className="mt-4 text-sm text-gray-600">
          <Link
            href="/sign-in"
            className="font-medium text-brand-green-dark underline underline-offset-2 hover:text-gray-900"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
