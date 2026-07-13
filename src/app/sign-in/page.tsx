"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { authClient } from "@/lib/auth/auth-client";
import { Button } from "@/components/button";
import { AuthBrand } from "@/components/auth-brand";
import { CharCounter } from "@/components/char-counter";
import { TEXT_LIMITS } from "@/lib/text-limits";

export default function SignInPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full  my-4 max-w-3xl">
        <AuthBrand />
        <h1>Sign in</h1>
        <Suspense fallback={<SignInFallback />}>
          <SignInForm />
        </Suspense>
      </div>
    </div>
  );
}

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
          autoComplete="current-password"
          required
          maxLength={TEXT_LIMITS.password}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 pr-10 text-gray-900 shadow-sm focus:border-brand-green-dark focus:outline-none focus:ring-1 focus:ring-brand-green-dark"
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-600 hover:text-gray-600"
          tabIndex={-1}
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      <CharCounter value={value} max={TEXT_LIMITS.password} />
    </div>
  );
}

const DEMO_ACCOUNTS = [
  { label: "Admin", email: "admin@example.com", portal: "/admin + all portals" },
  { label: "Staff (Studio)", email: "staff@example.com", portal: "/studio" },
  { label: "Restaurant", email: "restaurant@example.com", portal: "/restaurant-admin" },
  { label: "Facilities", email: "facilities@example.com", portal: "/facilities" },
];
const DEMO_PASSWORD = "Demokonto123!";

function DemoLoginCredentials({
  onFill,
}: {
  onFill: (email: string, password: string) => void;
}) {
  return (
    <div className="mt-6 rounded-lg border border-brand-green-dark/30 bg-brand-green-light p-4 text-sm text-gray-700">
      <p className="font-medium text-gray-900">Demo logins</p>
      <p className="mt-1 text-gray-600">
        This is a portfolio demo. Click an account to fill in the form.
      </p>
      <ul className="mt-3 space-y-2">
        {DEMO_ACCOUNTS.map((acc) => (
          <li key={acc.email}>
            <button
              type="button"
              onClick={() => onFill(acc.email, DEMO_PASSWORD)}
              className="text-left underline decoration-dotted underline-offset-2 hover:text-brand-green-dark"
            >
              <span className="font-medium">{acc.label}</span> — {acc.email} ({acc.portal})
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-gray-600">
        Password for all accounts: <span className="font-mono">{DEMO_PASSWORD}</span>
      </p>
    </div>
  );
}

function SignInForm() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/studio";
  const didReset = searchParams.get("reset") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await authClient.signIn.email({ email, password });

    if (result.error) {
      setError("Incorrect email or password.");
      setLoading(false);
      return;
    }

    const status = (result.data?.user as { status?: string } | undefined)?.status;
    if (status && status !== "active") {
      await authClient.signOut();
      window.location.assign(`/account-pending?reason=${status}`);
      return;
    }

    window.location.assign(redirect);
  }

  return (
    <>
      {didReset && (
        <div className="mt-4 rounded-lg border border-brand-green-dark/30 bg-brand-green-light px-4 py-3 text-sm text-gray-700">
          Your password has been updated. You can now sign in.
        </div>
      )}

      <p className="mt-2 text-sm text-gray-600">
        Sign in with your email address and password.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email address
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

        <PasswordInput
          id="password"
          label="Password"
          value={password}
          onChange={setPassword}
          show={showPassword}
          onToggleShow={() => setShowPassword((v) => !v)}
        />

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-brand-green-dark underline underline-offset-2 hover:text-gray-900"
          >
            Forgot your password?
          </Link>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="mt-4 text-sm text-gray-600">
        Don&apos;t have an account?{" "}
        <Link
          href="/create-account"
          className="font-medium text-brand-green-dark underline underline-offset-2 hover:text-gray-900"
        >
          Apply for an account
        </Link>
      </p>

      <DemoLoginCredentials
        onFill={(fillEmail, fillPassword) => {
          setEmail(fillEmail);
          setPassword(fillPassword);
        }}
      />
    </>
  );
}

function SignInFallback() {
  return <p className="mt-2 text-sm text-gray-600">Loading sign-in…</p>;
}
