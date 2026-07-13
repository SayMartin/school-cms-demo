"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/button";
import { AuthBrand } from "@/components/auth-brand";
import { CharCounter } from "@/components/char-counter";
import { TEXT_LIMITS } from "@/lib/text-limits";

function DemoRegistrationClosedModal({ onClose }: { onClose: () => void }) {
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-gray-900">
          Account applications are closed
        </h2>
        <p className="mt-2 text-sm text-gray-700">
          This is a portfolio demo — new accounts can&apos;t be created here.
          Use one of the demo accounts on the sign-in page instead.
        </p>
        <div className="mt-5 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function PasswordInput({
  id,
  label,
  value,
  onChange,
  show,
  onToggleShow,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggleShow: () => void;
  autoComplete: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label} <span className="text-red-500">*</span>
      </label>
      <div className="relative mt-1">
        <input
          id={id}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
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

export default function CreateAccountPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRegistrationClosed, setShowRegistrationClosed] = useState(false);

  function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setError(null);

    if (!firstName.trim()) {
      setError("First name must be filled in.");
      return;
    }
    if (firstName.length > TEXT_LIMITS.name) {
      setError(`First name can be at most ${TEXT_LIMITS.name} characters.`);
      return;
    }
    if (!lastName.trim()) {
      setError("Last name must be filled in.");
      return;
    }
    if (lastName.length > TEXT_LIMITS.name) {
      setError(`Last name can be at most ${TEXT_LIMITS.name} characters.`);
      return;
    }
    if (!email.trim()) {
      setError("Email address must be filled in.");
      return;
    }
    if (email.length > TEXT_LIMITS.email) {
      setError(`Email address can be at most ${TEXT_LIMITS.email} characters.`);
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password.length > TEXT_LIMITS.password) {
      setError(`Password can be at most ${TEXT_LIMITS.password} characters.`);
      return;
    }
    if (password !== passwordConfirm) {
      setError("Passwords don't match.");
      return;
    }

    // Portfolio demo: registration is disabled, show info overlay instead of
    // calling the real sign-up endpoint.
    setShowRegistrationClosed(true);
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full my-4 max-w-3xl">
        <AuthBrand />
        <h1>Apply for an account</h1>
        <p className="mt-2 text-sm text-gray-600">
          Fill in your details to apply for a staff account at Demo Folk
          High School. An administrator will review your application and get
          back to you by email.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="first-name" className="block text-sm font-medium text-gray-700">
                First name <span className="text-red-500">*</span>
              </label>
              <input
                id="first-name"
                type="text"
                autoComplete="given-name"
                required
                maxLength={TEXT_LIMITS.name}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-brand-green-dark focus:outline-none focus:ring-1 focus:ring-brand-green-dark"
              />
              <CharCounter value={firstName} max={TEXT_LIMITS.name} />
            </div>
            <div>
              <label htmlFor="last-name" className="block text-sm font-medium text-gray-700">
                Last name <span className="text-red-500">*</span>
              </label>
              <input
                id="last-name"
                type="text"
                autoComplete="family-name"
                required
                maxLength={TEXT_LIMITS.name}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-brand-green-dark focus:outline-none focus:ring-1 focus:ring-brand-green-dark"
              />
              <CharCounter value={lastName} max={TEXT_LIMITS.name} />
            </div>
          </div>

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

          <PasswordInput
            id="password"
            label="Password (at least 8 characters)"
            value={password}
            onChange={setPassword}
            show={showPassword}
            onToggleShow={() => setShowPassword((v) => !v)}
            autoComplete="new-password"
          />

          <PasswordInput
            id="password-confirm"
            label="Confirm password"
            value={passwordConfirm}
            onChange={setPasswordConfirm}
            show={showPasswordConfirm}
            onToggleShow={() => setShowPasswordConfirm((v) => !v)}
            autoComplete="new-password"
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            className="w-full rounded-md border border-brand-green-dark bg-brand-green-dark px-4 py-2 font-semibold text-gray-900 transition-colors hover:bg-brand-green-dark hover:text-white disabled:opacity-50"
          >
            Apply for account
          </button>
        </form>

        {showRegistrationClosed && (
          <DemoRegistrationClosedModal
            onClose={() => setShowRegistrationClosed(false)}
          />
        )}

        <p className="mt-4 mb-4 text-sm text-gray-600">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="font-medium text-brand-green-dark underline underline-offset-2 hover:text-gray-900"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
