import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "What this demo stores, who can see it, how long it is kept, and why you should not enter real personal data here.",
};

// Deliberately static code, not a D1 content block like every other page on this
// site: the demo Studio password is published on /sign-in, so a policy stored in
// the database could be rewritten by anyone. Bump the date whenever the substance
// changes — a policy dated before the practice it describes is worse than none.
const LAST_UPDATED = "23 August 2026";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-gray-700">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1>Privacy policy</h1>
      <p className="mt-2 text-sm text-gray-600">Last updated {LAST_UPDATED}</p>

      <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
        <p className="font-semibold">
          No form on this site stores what you type.
        </p>
        <p className="mt-2">
          This is a portfolio demo, and the login for its editorial back office is
          printed openly on the{" "}
          <Link href="/sign-in" className="underline underline-offset-2">
            sign-in page
          </Link>{" "}
          so anyone can try the CMS. Rather than let strangers read each
          other&apos;s submissions, every public form here validates what you enter
          and then discards it. Please still use made-up details — but nothing you
          type is saved either way.
        </p>
      </div>

      <Section title="What this site is">
        <p>
          School CMS Demo is a working demonstration of a school content management
          system, built to show prospective employers how it is put together. The
          school it depicts — Demo Folk High School — does not exist, and every
          course, staff member, news item and menu on it is invented. It is not
          connected to any real school&apos;s systems.
        </p>
      </Section>

      <Section title="Who is responsible">
        <p>
          The demo is run by <strong className="font-medium">Martin Persson</strong>{" "}
          as a private individual, who is the data controller for the little data it
          holds. For anything on this page, including the requests described under{" "}
          <em>Your rights</em>, write to{" "}
          <a
            href="mailto:martin@appfinningar.se"
            className="font-medium text-brand-green-dark underline underline-offset-2 hover:text-gray-900"
          >
            martin@appfinningar.se
          </a>
          .
        </p>
      </Section>

      <Section title="What is stored">
        <p>
          If you only read this site, nothing about you is stored at all — no cookie
          is set and no record is written.
        </p>
        <p>
          If you sign in with one of the shared demo accounts, a session is recorded
          with the browser and device the request came from, together with the cookie
          described under <em>Cookies</em>. Your IP address is not stored.
        </p>
        <p>
          That is the whole list. There is no analytics, no tracking, no advertising,
          and no profiling.
        </p>
      </Section>

      <Section title="What is deliberately not stored">
        <p>
          Every form on this site is inert. Each one validates what you enter, shows
          you the confirmation screen a real submission would produce, and then throws
          the data away. The endpoints behind them refuse the request as well, so this
          holds however a form is called — not just when the button is clicked.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="font-medium">Course applications</strong> — including
            the personal identity number, address and any files you attach. Nothing is
            saved, nothing is uploaded.
          </li>
          <li>
            <strong className="font-medium">Venue enquiries</strong> — name,
            organisation, email address, phone number, dates and notes.
          </li>
          <li>
            <strong className="font-medium">Maintenance reports</strong> — name, email
            address, phone number and your description of the problem.
          </li>
          <li>
            <strong className="font-medium">New accounts.</strong> Sign-up is closed.
            Only the five pre-existing demo accounts can log in, and the sign-up
            endpoint rejects requests rather than merely hiding the button.
          </li>
          <li>
            <strong className="font-medium">Email.</strong> Outbound email is mocked
            throughout. Confirmations and password resets are written to a log, never
            delivered to an inbox.
          </li>
        </ul>
        <p>
          The support tickets, applications and enquiries visible inside the CMS are
          invented demo content, seeded when the database was created. They are not
          submissions from visitors.
        </p>
      </Section>

      <Section title="Why, and on what legal basis">
        <p>
          Because no visitor data is kept, there is very little to justify. The one
          thing that is processed — the session for a shared demo account — is
          strictly necessary to sign in at all, and exists only for as long as that
          session does.
        </p>
      </Section>

      <Section title="Who else can see it">
        <p>
          Everything runs on Cloudflare&apos;s network. These third parties are
          involved, each limited to one job:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="font-medium">Cloudflare</strong> — hosts the
            application and the database, and carries all traffic to the site.
          </li>
          <li>
            <strong className="font-medium">Google</strong> — the typefaces the Studio
            lets an editor choose from are loaded from Google Fonts, so your browser
            requests them from Google and Google sees your IP address and user agent
            on each page load. No other data reaches them, and this is the only third
            party contacted just by reading a page.
          </li>
          <li>
            <strong className="font-medium">YouTube</strong> — pages containing an
            embedded video load it from{" "}
            <code className="rounded bg-gray-100 px-1 py-0.5 text-sm">
              youtube-nocookie.com
            </code>
            , which holds off on tracking cookies until you press play. If you never
            play a video, YouTube sets nothing.
          </li>
          <li>
            <strong className="font-medium">Instagram</strong> — the Instagram feed is
            fetched by the server, not your browser, so nothing about you is sent to
            Meta.
          </li>
        </ul>
        <p>
          Cloudflare, Google and Meta are US companies, so some processing may take
          place outside the EU/EEA.
        </p>
      </Section>

      <Section title="The operator can see your data">
        <p>
          Worth stating rather than leaving implied: as the person running the
          database, the controller can read what is stored, the way anyone hosting a
          service can. So, on this particular site, can anyone who uses the published
          demo login — which is the reason for the notice at the top of this page.
        </p>
      </Section>

      <Section title="How long it is kept">
        <p>
          Expired sessions and password-reset tokens are deleted automatically the
          next time anyone signs in. Since nothing else about a visitor is written
          down, there is nothing else to keep or delete.
        </p>
      </Section>

      <Section title="Your rights">
        <p>Under the GDPR you may ask to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>get a copy of any data held about you</li>
          <li>correct anything inaccurate</li>
          <li>have your data erased</li>
          <li>receive your data in a portable, machine-readable format</li>
          <li>object to or restrict processing</li>
        </ul>
        <p>
          Email{" "}
          <a
            href="mailto:martin@appfinningar.se"
            className="font-medium text-brand-green-dark underline underline-offset-2 hover:text-gray-900"
          >
            martin@appfinningar.se
          </a>{" "}
          for any of these, and you will have an answer within 30 days, normally
          sooner. In practice the answer for a visitor is usually that there is
          nothing held about you at all — but you are entitled to ask, and to be told
          so.
        </p>
        <p>
          If you think your data is being handled wrongly, you can complain to the
          Swedish Authority for Privacy Protection (IMY).
        </p>
      </Section>

      <Section title="Cookies">
        <p>
          One cookie,{" "}
          <code className="rounded bg-gray-100 px-1 py-0.5 text-sm">
            better-auth.session_token
          </code>
          , which keeps you signed in to a demo account. It is strictly necessary and
          is removed when you sign out. Browsing the public site sets no cookie at
          all.
        </p>
        <p>
          There are no analytics cookies and no tracking — which is why this site
          never asks you to accept anything.
        </p>
      </Section>

      <Section title="Changes to this policy">
        <p>
          If what the demo does changes, this page changes with it and the date at
          the top is updated.
        </p>
      </Section>
    </div>
  );
}
