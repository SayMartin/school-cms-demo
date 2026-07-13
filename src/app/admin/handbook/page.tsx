import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "IT Handbook" };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-gray-900">{title}</h2>
      {children}
    </section>
  );
}

function Cmd({ children }: { children: string }) {
  return (
    <code className="block rounded bg-gray-100 px-3 py-1.5 font-mono text-sm text-gray-800">
      {children}
    </code>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 shrink-0 font-semibold text-gray-500">{n}.</span>
      <span className="text-gray-700">{children}</span>
    </li>
  );
}

export default function HandbokPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <Link href="/admin" className="font-semibold uppercase tracking-widest hover:text-brand-green-dark transition-colors">
        ← Dashboard
      </Link>
      <h1 className="mt-1 text-gray-900">IT Handbook</h1>
      <p className="mt-2 text-gray-600">
        Technical notes — read through during handover and keep on hand for future maintenance.
      </p>

      {/* Intro: demo environment */}
      <div className="mt-8 rounded-xl border border-brand-green-dark bg-brand-green-light p-6">
        <h2 className="mb-3 text-gray-900">Portfolio demo — a single environment</h2>
        <div className="space-y-2 text-gray-700">
          <p>
            This is a sanitized demo copy showing how the CMS and portals
            work. There&apos;s only <strong>one</strong> environment — no separate dev/prod
            split, no CI/CD, and no script pointing at a real
            production site.
          </p>
          <p>
            All content (staff, courses, news, menus, issue reports) is
            entirely made up and can be freely edited in Studio without affecting
            anything real.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-6">

        {/* 1. Deploy code */}
        <Section title="Deploy code">
          <p className="mb-4 text-gray-600">
            Run migrations against the demo database before deploying if there are new ones since last time:
          </p>
          <ol className="space-y-3">
            <Step n={1}>
              <Cmd>npm run db:migrate:remote</Cmd>
            </Step>
            <Step n={2}>
              Build and deploy:
              <div className="mt-2">
                <Cmd>npm run build:cloudflare && npm run deploy</Cmd>
              </div>
            </Step>
          </ol>
          <p className="mt-4 text-sm text-gray-500">
            Migrations live in{" "}
            <code className="rounded bg-gray-100 px-1">drizzle/migrations/</code>.
          </p>
        </Section>

        {/* 2. Seed demo content */}
        <Section title="Seed demo content and demo accounts">
          <p className="mb-4 text-gray-600">
            Fills the demo database with made-up staff, courses, news, etc., and
            creates the four demo logins shown on <code className="rounded bg-gray-100 px-1 text-sm">/sign-in</code>.
          </p>
          <h3 className="mb-2 font-semibold text-gray-800">Content</h3>
          <Cmd>npm run db:seed:demo:remote</Cmd>
          <h3 className="mt-4 mb-2 font-semibold text-gray-800">Demo accounts</h3>
          <Cmd>npm run seed:demo-users:remote</Cmd>
        </Section>

        {/* 3. Activate new accounts */}
        <Section title="Activate new user accounts">
          <p className="mb-3 text-gray-600">
            When a teacher registers, you need to activate the account manually.
          </p>
          <ol className="space-y-2">
            <Step n={1}>
              Go to{" "}
              <Link href="/admin/users" className="underline text-brand-green-dark hover:no-underline">
                Admin → Users
              </Link>.
            </Step>
            <Step n={2}>Find the account with status <em>Pending approval</em>.</Step>
            <Step n={3}>Choose a role (<strong>staff</strong> for teachers, <strong>admin</strong> for IT staff) and click Activate.</Step>
          </ol>
        </Section>

        {/* 4. Instagram token */}
        <Section title="Instagram token — renew every 50 days">
          <p className="mb-3 text-gray-600">
            The Instagram feed on the homepage uses a <em>long-lived access token</em>
            that must be renewed manually roughly every 50 days (max 60 days).
          </p>
          <ol className="space-y-2">
            <Step n={1}>
              Generate a new token via the Meta Graph API Explorer (sign in with the school&apos;s
              Instagram account).
            </Step>
            <Step n={2}>
              Set the new key in Cloudflare Workers:
              <div className="mt-2">
                <Cmd>wrangler secret put INSTAGRAM_ACCESS_TOKEN</Cmd>
              </div>
            </Step>
            <Step n={3}>Paste the token string when the terminal prompts for it.</Step>
          </ol>
          <p className="mt-3 text-sm text-gray-500">
            If the feed disappears from the homepage, it&apos;s likely an expired token.
          </p>
        </Section>

        {/* 5. Turnstile */}
        <Section title="Cloudflare Turnstile (bot protection on forms)">
          <p className="mb-3 text-gray-600">
            This demo permanently uses Cloudflare&apos;s always-passing test key
            (<code className="rounded bg-gray-100 px-1 text-sm">1x00000000000000000000AA</code>) —
            there&apos;s no dedicated domain or real Turnstile keys to switch to.
          </p>
        </Section>

      </div>
    </div>
  );
}
