// Issue-report mailboxes: a case is owned by either IT (incident) or
// facilities (janitorial). The case can be handed off between the two in
// the facilities portal. The addresses come from the Workers env (wrangler.jsonc),
// with ADMIN_EMAIL as a fallback if they aren't set.

export const ASSIGNEES = ["incident", "facilities"] as const;
export type Assignee = (typeof ASSIGNEES)[number];

export function isAssignee(value: unknown): value is Assignee {
  return value === "incident" || value === "facilities";
}

export function recipientEmail(assignee: string, env: CloudflareEnv): string {
  const email =
    assignee === "incident" ? env.INCIDENT_EMAIL : env.FASTIGHET_EMAIL;
  return email || env.ADMIN_EMAIL;
}
