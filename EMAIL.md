# Email handling during a DNS migration to Cloudflare

> **This is a production runbook, not a demo procedure.** In this repository no
> email is ever sent (`sendEmail()` short-circuits whenever `APP_ENV !== "prod"`),
> and the forms referenced in the test steps below are inert — venue inquiries and
> maintenance reports are refused by `demoLockCheck()` before any handler runs, so
> nothing is saved and nothing is mailed. The steps describe what a real
> deployment would do; they cannot be followed against the demo.

## Background

The example school today has its domain, DNS, and email hosted at [former web host] (10+ active
mailboxes). The new Next.js site is built for Cloudflare, which means DNS
will eventually move there too.

**Chosen email solution:** Google Workspace (education plan) with the school's own addresses
on `@example.com`. Cloudflare handles DNS, Google sends and receives mail.

**Split between [former web host] and Cloudflare:** The original plan
was to leave [former web host] entirely. That plan changed — Cloudflare Registrar doesn't
support `.se` domains, so a registrar switch turned out to cause more friction than it was worth.
Current plan:

| Service | Where |
|---|---|
| **Domain registration** (`example.com`) | Stays with **[former web host]** — not changed |
| **DNS** (nameservers) | Moves to **Cloudflare** |
| **Web hosting** | Discontinued at [former web host] (the site already runs on Cloudflare Workers) |
| **Email** | Discontinued at [former web host] → **Google Workspace** |

Only the domain registration (and the account at [former web host] required to own
it) remains. The nameserver switch at [former web host] is enough to point
the domain at Cloudflare — no registrar change is required.

**Key insight:** DNS migration and email migration are completely independent.
It's possible to move DNS to Cloudflare while keeping email at [former web host]
during a transition period — it only requires the MX records in Cloudflare to point
back at [former web host]'s mail servers. No email migration needs to happen at the
same time as launch, but the end goal is for the [former web host] mailboxes to be
fully shut down (see the two-stage model below).

**Cloudflare cannot host mailboxes.** They only offer Email Routing
(free forwarding), not IMAP/SMTP mailboxes.

---

## Transactional email from the site (Gmail API)

The site sends transactional email (maintenance reports, account notices, auth email)
directly via the **Gmail API** — not via Resend (removed) or SMTP.

**How it works** (see `src/lib/email/client.ts`):
1. A Google **service account** with domain-wide delegation signs a JWT
   (RS256, scope `https://www.googleapis.com/auth/gmail.send`) and acts as
   the sender address (`sub` = `GOOGLE_SENDER_EMAIL`).
2. The JWT is exchanged for an access token at `oauth2.googleapis.com/token`.
3. The mail is sent via `gmail.googleapis.com/gmail/v1/users/me/messages/send`.

**Environment variables** (Cloudflare Secrets in production, `.env.local` locally):

| Variable | Description |
|---|---|
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | The service account's email address |
| `GOOGLE_PRIVATE_KEY` | The service account's private key (PEM; `\n` or real line breaks both work) |
| `GOOGLE_SENDER_EMAIL` | The Workspace address mail is sent from (noreply@) |
| `INCIDENT_EMAIL` | Maintenance reports, IT issues → `incident@example.com` |
| `FASTIGHET_EMAIL` | Maintenance reports, janitorial issues (electrical, plumbing, cleaning, other) → `facilities@example.com` |
| `ADMIN_EMAIL` | Fallback recipient if the category-specific variables are missing |

**Recipient routing (decided by the school's IT lead):** IT tickets go to
`incident@example.com`, janitorial tickets to `facilities@example.com`.
`incident@` can be used for testing — it goes to the IT lead. Routing happens per
category in `src/app/api/report-issue/route.ts`.

**Setup in Google Admin** (already done, for reference):
- A service account was created in Google Cloud Console with a key (JSON → PEM).
- Domain-wide delegation was enabled in Google Admin → Security → API controls →
  Domain-wide delegation, with scope `https://www.googleapis.com/auth/gmail.send`.

**Important for the DNS move:** Gmail API sending is independent of the MX records —
it works regardless of where incoming mail is handled. But for deliverability, the
domain's **SPF record must include `_spf.google.com`** from the moment the site starts
sending, even while MX still points at [former web host].

---

## Instructions: making venue-inquiry email work

When someone submits a venue inquiry on `/venues`, an email should go to
**personal@example.com** and **exp@example.com**.
The email is sent via the same Gmail API as the maintenance reports. If maintenance-report
email already works, you mostly just need to confirm point B below.

### A. In Google (Google Admin / Workspace)

1. **The recipient addresses must exist as mailboxes or aliases** on the domain:
   - `personal@example.com`
   - `exp@example.com`
   Create them under Google Admin → Users (or as aliases) if missing.
2. **Service account + domain-wide delegation** (same as for maintenance reports, should already
   be in place): scope `https://www.googleapis.com/auth/gmail.send`. Nothing new
   is needed specifically for venues — the same sender account is used.
3. **SPF** for the domain must include `include:_spf.google.com` so the emails
   don't land in spam (see the DNS sections below).

### B. In Cloudflare (the Workers project)

1. **Secrets for the Gmail API** must be set on the Worker (same as maintenance reports).
   Check/set via Wrangler:
   ```
   npx wrangler secret put GOOGLE_SERVICE_ACCOUNT_EMAIL
   npx wrangler secret put GOOGLE_PRIVATE_KEY
   npx wrangler secret put GOOGLE_SENDER_EMAIL
   ```
   - `GOOGLE_SENDER_EMAIL` = the Workspace address the mail is sent *from* (e.g. `noreply@example.com`).
2. **The recipients** already live as a plain variable in `wrangler.jsonc` (`MOTESPLATS_EMAIL`,
   comma-separated list) — they take effect on the next **deploy**. To change recipients:
   edit `MOTESPLATS_EMAIL` in `wrangler.jsonc` and redeploy. It does **not**
   need to be set as a secret.
3. **Deploy** the project so the new variable and code take effect.

### C. Test

1. Go to `/venues` on the site and submit a test inquiry.
2. Confirm the email lands in both `personal@` and `exp@`.
3. Also check the Sent folder for `GOOGLE_SENDER_EMAIL` in Gmail (API-sent mail ends up there).

> If the recipient addresses are missing, sending falls back to `ADMIN_EMAIL`.
> If the Gmail secrets are missing, no email is sent (logged as a warning), but the
> inquiry is still saved and shows up in Studio under the venue inquiries list.
> (Neither applies in this demo, where the inquiry never reaches the handler.)

---

## Recommended approach: two-stage model

### Stage 1 — On DNS move to Cloudflare (at launch)

Copy [former web host]'s current MX records to Cloudflare.
Test sending/receiving email *before* switching nameservers.

```
MX  example.com  →  [[former web host]'s mail server]  prio 10
```

Email keeps working exactly as before — no user notices anything.

**SPF at this stage** must cover both [former web host] (incoming/outgoing mailboxes)
and Google (the site's transactional email via the Gmail API):

```
v=spf1 include:[[former web host]'s SPF] include:_spf.google.com ~all
```

**DKIM for Google** should also be in place (see stage 2) since the site
sends via Gmail from day one.

### Stage 2 — Migration to Google Workspace (plan separately from launch)

The school already uses the Google Workspace education plan. The migration means
pointing the MX records in Cloudflare at Google's mail servers and configuring
DKIM/SPF/DMARC for Google.

**MX records for Google Workspace:**

```
MX  example.com  →  ASPMX.L.GOOGLE.COM       prio 1
MX  example.com  →  ALT1.ASPMX.L.GOOGLE.COM  prio 5
MX  example.com  →  ALT2.ASPMX.L.GOOGLE.COM  prio 5
MX  example.com  →  ALT3.ASPMX.L.GOOGLE.COM  prio 10
MX  example.com  →  ALT4.ASPMX.L.GOOGLE.COM  prio 10
```

**SPF (TXT record):**
```
v=spf1 include:_spf.google.com ~all
```

**DKIM:** Generated in Google Admin → Apps → Google Workspace → Gmail → Authenticate email.
Paste the TXT record into Cloudflare DNS.

**DMARC (TXT record):**
```
v=DMARC1; p=none; rua=mailto:dmarc@example.com
```

Reference (Google): https://knowledge.workspace.google.com/admin/domains/set-up-mx-records-for-google-workspace
Reference (Cloudflare): https://developers.cloudflare.com/dns/manage-dns-records/how-to/email-records/#send-and-receive-email

---

## DNS checklist for the Cloudflare move

**Stage 1 (at launch — keep [former web host] email):**
- [ ] Export all DNS records from [former web host] before the move
- [ ] Add MX records pointing at [former web host]'s mail servers
- [ ] Add an SPF record that includes both [former web host] and `_spf.google.com`
- [ ] Add a DKIM record for Google (from Google Admin)
- [ ] Add a DMARC record
- [ ] Test with MXToolbox before the nameserver switch
- [ ] Wait out TTL propagation (typically 24–48 h)

**Stage 2 (separate — migration to Google Workspace):**
- [ ] Configure MX records in Cloudflare → Google's servers (see above)
- [ ] Update the SPF record (remove the [former web host] include, keep `_spf.google.com`)
- [ ] Keep the DKIM key from Google Admin
- [ ] Update/keep the DMARC record
- [ ] Test with the MXToolbox SPF/DKIM check
- [ ] Test sending and receiving from `@example.com`

---

## Verification after the DNS move

1. Send a test message to an `@example.com` address
2. Submit a maintenance report via `/about/report-issue` — the IT category should land in `incident@`, other categories in `facilities@`
3. Check the Sent folder for `GOOGLE_SENDER_EMAIL` in Gmail (API-sent mail ends up there)
4. Run the MXToolbox SPF/DKIM check on the domain
