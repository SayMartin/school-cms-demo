import { betterAuth } from "better-auth/minimal";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { sendEmail } from "@/lib/email/client";
import { DEFAULT_USER_ROLE } from "@/lib/auth/roles";
import type { Db } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";

export type { UserRole } from "@/lib/auth/roles";

export function createAuth(db: Db) {
  const env = getAuthEnv();

  return betterAuth({
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,

    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
      },
    }),

    emailAndPassword: {
      enabled: true,
      sendResetPassword: async ({ user, url }) => {
        await sendEmail({
          to: user.email,
          subject: "Reset your password",
          html: `
            <p>Hi ${user.name},</p>
            <p>Click the link below to reset your password:</p>
            <p><a href="${url}">${url}</a></p>
            <p>This link is valid for 1 hour. If you didn't request this, you can safely ignore this email.</p>
          `,
        });
      },
    },

    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
    },

    user: {
      additionalFields: {
        role: {
          type: "string",
          defaultValue: DEFAULT_USER_ROLE,
          input: false,
        },
        status: {
          type: "string",
          defaultValue: "pending",
          input: false,
        },
      },
    },

    trustedOrigins: [
      "http://localhost:3000",
      "http://localhost:8787",
      env.BETTER_AUTH_URL,
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;

function getAuthEnv(): Pick<
  CloudflareEnv,
  "BETTER_AUTH_SECRET" | "BETTER_AUTH_URL" | "NEXT_PUBLIC_APP_URL"
> {
  try {
    const { env } = getCloudflareContext();
    return {
      BETTER_AUTH_SECRET: env.BETTER_AUTH_SECRET,
      BETTER_AUTH_URL: env.BETTER_AUTH_URL,
      NEXT_PUBLIC_APP_URL: env.NEXT_PUBLIC_APP_URL,
    };
  } catch {
    return {
      BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ?? "",
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ?? "",
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    };
  }
}
