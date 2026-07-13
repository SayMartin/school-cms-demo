import { getCloudflareContext } from "@opennextjs/cloudflare";

function getGmailEnv() {
  try {
    const { env } = getCloudflareContext();
    const e = env as unknown as Record<string, string>;
    return {
      appEnv:              e.APP_ENV ?? "",
      serviceAccountEmail: e.GOOGLE_SERVICE_ACCOUNT_EMAIL ?? "",
      privateKey:          e.GOOGLE_PRIVATE_KEY ?? "",
      senderEmail:         e.GOOGLE_SENDER_EMAIL ?? "",
    };
  } catch {
    return {
      appEnv:              process.env.APP_ENV ?? "",
      serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ?? "",
      privateKey:          process.env.GOOGLE_PRIVATE_KEY ?? "",
      senderEmail:         process.env.GOOGLE_SENDER_EMAIL ?? "",
    };
  }
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64url(input: string | Uint8Array): string {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : input;
  return toBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function encodeHeaderText(text: string): string {
  if (!/[^\x00-\x7F]/.test(text)) return text;
  return `=?UTF-8?B?${toBase64(new TextEncoder().encode(text))}?=`;
}

async function fetchAccessToken(serviceAccountEmail: string, privateKeyPem: string, senderEmail: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  const header  = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss:   serviceAccountEmail,
    sub:   senderEmail,
    scope: "https://www.googleapis.com/auth/gmail.send",
    aud:   "https://oauth2.googleapis.com/token",
    iat:   now,
    exp:   now + 3600,
  };

  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;

  // Cloudflare Secrets may store actual newlines or literal \n — normalise both
  const pem = privateKeyPem.replace(/\\n/g, "\n");
  const pemBody = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s+/g, "");

  const key = await crypto.subtle.importKey(
    "pkcs8",
    Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0)),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const sig = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(signingInput),
  );

  const jwt = `${signingInput}.${toBase64(new Uint8Array(sig)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "")}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }).toString(),
  });

  if (!res.ok) throw new Error(`Google token exchange failed: ${await res.text()}`);

  const data = await res.json() as { access_token: string };
  return data.access_token;
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}) {
  const { appEnv, serviceAccountEmail, privateKey, senderEmail } = getGmailEnv();

  // Demo mode: this repo is always a portfolio copy and should never send
  // real emails, regardless of which secrets happen to be set on the Worker.
  if (appEnv !== "prod") {
    console.log(`[Email] Demo mode — mocked send to ${opts.to}: ${opts.subject}`);
    return;
  }

  if (!serviceAccountEmail || !privateKey || !senderEmail) {
    console.warn("[Email] Missing Google credentials — skipping:", opts.subject);
    return;
  }

  const accessToken = await fetchAccessToken(serviceAccountEmail, privateKey, senderEmail);

  const raw = [
    `From: ${encodeHeaderText("Demo Folk High School")} <${senderEmail}>`,
    `To: ${opts.to}`,
    `Subject: ${encodeHeaderText(opts.subject)}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset=UTF-8`,
    ``,
    opts.html,
  ].join("\r\n");

  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization:  `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: base64url(raw) }),
  });

  if (!res.ok) throw new Error(`Gmail send failed: ${await res.text()}`);
}
