"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth/auth-client";
import type { Session } from "@/lib/auth/auth-client";
import { hasStudioAccess, hasRestaurantAccess, hasFacilitiesAccess } from "@/lib/auth/roles";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

export function Footer() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let active = true;
    authClient.getSession().then((result) => {
      if (!active) return;
      setSession((result.data as Session | null) ?? null);
    });
    return () => {
      active = false;
    };
  }, []);

  async function handleSignOut() {
    await authClient.signOut();
    setSession(null);
  }

  const { reduced, toggle } = useReducedMotion();
  const userRole = session?.user.role;
  const isAdmin = userRole === "admin";
  const canOpenStudio = hasStudioAccess(userRole);
  const canOpenKoket = hasRestaurantAccess(userRole);
  const canOpenFastighet = hasFacilitiesAccess(userRole);

  return (
    <footer className="print:hidden bg-linear-to-b pt-6 pb-8 from-brand-pink to-brand-pink-light">
      <div className="mx-auto max-w-7xl px-4">
        {/* Row 1: logo + icons on the left, auth on the right (desktop) */}
        <div className="flex items-start justify-between">
          <div className="flex flex-wrap items-center gap-x-5">
            <Link
              href="/"
              className="font-bold hover:text-brand-pink-dark transition-colors"
            >
              Demo Folk High School
            </Link>

            <a
              href="tel:+46101234500"
              aria-label="Phone: 010-123 45 00"
              title="010-123 45 00"
              className="text-gray-800 hover:text-gray-900 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.75}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                />
              </svg>
            </a>

            <a
              href="mailto:exp@exempel-folkhogskola.se"
              aria-label="Email: exp@exempel-folkhogskola.se"
              title="exp@exempel-folkhogskola.se"
              className="text-gray-800 hover:text-gray-900 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.75}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                />
              </svg>
            </a>

            <a
              href="https://sms.schoolsoft.se/fhsk/jsp/Login.jsp"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="SchoolSoft"
              title="SchoolSoft"
              className="text-gray-800 hover:text-gray-900 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.75}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5"
                />
              </svg>
            </a>

            <a
              href="https://www.facebook.com/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              title="Facebook"
              className="text-gray-800 hover:text-gray-900 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>

            <a
              href="https://www.instagram.com/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              title="Instagram"
              className="text-gray-800 hover:text-gray-900 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
            </a>
          </div>

          {/* Auth — only shown on desktop */}
          <div className="hidden lg:flex flex-col items-end gap-y-2 shrink-0">
            {session ? (
              <>
                <div className="flex items-center gap-x-8">
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="text-sm font-bold text-blue-700 hover:text-blue-800 transition-colors"
                    >
                      Admin
                    </Link>
                  )}
                  {canOpenStudio && (
                    <Link
                      href="/studio"
                      className="text-sm font-bold text-blue-700 hover:text-blue-800 transition-colors"
                    >
                      Studio
                    </Link>
                  )}
                  {canOpenKoket && (
                    <Link
                      href="/restaurant-admin"
                      className="text-sm font-bold text-blue-700 hover:text-blue-800 transition-colors"
                    >
                      Restaurant
                    </Link>
                  )}
                  {canOpenFastighet && (
                    <Link
                      href="/facilities"
                      className="text-sm font-bold text-blue-700 hover:text-blue-800 transition-colors"
                    >
                      Facilities
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="text-sm font-bold text-red-600 hover:text-red-800 transition-colors"
                  >
                    Sign out
                  </button>
                </div>
                <span className="pt-1 text-sm text-gray-800">
                  Signed in as{" "}
                  {session.user.role === "admin"
                    ? "Admin"
                    : session.user.role === "developer"
                      ? "Developer"
                      : session.user.role === "restaurant"
                        ? "Restaurant"
                        : session.user.role === "facilities"
                          ? "Facilities"
                          : "Staff"}
                  : {session.user.name}
                </span>
              </>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Sign in
                </Link>
                <span className="pt-1 text-sm text-gray-800">
                  Not signed in
                </span>
              </>
            )}
          </div>
        </div>

        {/* Row 2: copyright + animation toggle */}
        <div className="mt-4 lg:-mt-5 flex items-center gap-x-3">
          <p className="text-sm text-gray-700">
            © {new Date().getFullYear()}{" "}
            <a
              href="mailto:martin@appfinningar.se"
              className="hover:text-gray-900 transition-colors"
            >
              Martin Persson — martin@appfinningar.se
            </a>
          </p>
          <span className="text-gray-700 select-none" aria-hidden="true">
            ·
          </span>
          <button
            type="button"
            onClick={toggle}
            className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
          >
            {reduced ? "Turn on animations" : "Turn off animations"}
          </button>
        </div>
      </div>
    </footer>
  );
}
