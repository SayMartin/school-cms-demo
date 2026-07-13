import type { Metadata } from "next";
import { ButtonLink } from "@/components/button-link";

export const metadata: Metadata = { title: "Access denied" };

// Shown when a logged-in user tries to access a page they don't have permission for
export default function ForbiddenPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1>403</h1>
      <p className="mt-2 text-lg text-gray-600">You don&apos;t have permission to access this page.</p>
      <ButtonLink href="/" className="mt-6">Back to homepage</ButtonLink>
    </div>
  );
}
