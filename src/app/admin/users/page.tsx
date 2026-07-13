"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  RotateCcw,
  ShieldCheck,
  XCircle,
  Archive,
} from "lucide-react";
import type { UserRole } from "@/lib/auth/roles";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";

type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: string;
  emailVerified: boolean;
  createdAt: string;
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  active: "Active",
  archived: "Archived",
  rejected: "Rejected",
};

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  developer: "Developer",
  staff: "Staff",
  restaurant: "Restaurant",
  facilities: "Facilities",
};

const STATUS_ORDER = ["pending", "active", "archived", "rejected"];

// This deployment is always the public demo (see wrangler.jsonc DEMO_LOCKDOWN).
// Account approve/reject/archive/restore/change-role/delete are blocked
// server-side regardless — these disable the buttons so the UI doesn't just
// fail silently.
const DEMO_LOCKED = true;
const DEMO_LOCKED_TITLE = "Disabled in the public demo";

export default function AnvandareAdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/users")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json() as Promise<User[]>;
      })
      .then((data) => {
        if (active) setUsers(data);
      })
      .catch(() => {
        if (active) setError("Couldn't fetch users. Please try again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function callAction(id: string, action: string, role?: string) {
    setPendingAction(`${id}:${action}`);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, role }),
      });
      if (!res.ok) throw new Error();
      const updated: User = await res.json();
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
    } catch {
      setError("The action failed. Please try again.");
    } finally {
      setPendingAction(null);
    }
  }

  async function handleDelete(id: string) {
    setPendingAction(`${id}:delete`);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch {
      setError("The deletion failed. Please try again.");
    } finally {
      setPendingAction(null);
    }
  }

  const grouped = STATUS_ORDER.map((status) => ({
    status,
    label: STATUS_LABELS[status],
    users: users.filter((u) => u.status === status),
  })).filter((g) => g.users.length > 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <Link
        href="/admin"
        className="font-semibold uppercase tracking-widest hover:text-brand-green-dark transition-colors"
      >
        ← Dashboard
      </Link>
      <h1 className="mt-1 text-gray-900">Users</h1>

      {error && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading && (
        <p className="mt-6 text-sm text-gray-600">Loading users…</p>
      )}

      {!loading && grouped.length === 0 && (
        <p className="mt-6 text-sm text-gray-600">No users.</p>
      )}

      <div className="mt-8 space-y-10">
        {grouped.map(({ status, label, users: groupUsers }) => (
          <section key={status}>
            <h2 className="mb-3 uppercase tracking-widest text-gray-600">
              {label} ({groupUsers.length})
            </h2>

            <div className="divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white shadow-sm">
              {groupUsers.map((u) => (
                <UserRow
                  key={u.id}
                  user={u}
                  pendingAction={pendingAction}
                  onAction={callAction}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function UserRow({
  user: u,
  pendingAction,
  onAction,
  onDelete,
}: {
  user: User;
  pendingAction: string | null;
  onAction: (id: string, action: string, role?: string) => void;
  onDelete: (id: string) => void;
}) {
  const [approveRole, setApproveRole] = useState<UserRole>("staff");
  const busy = (action: string) => pendingAction === `${u.id}:${action}`;
  const anyBusy = pendingAction?.startsWith(`${u.id}:`) ?? false;

  return (
    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="font-medium text-gray-900">{u.name}</p>
        <p className="text-sm text-gray-600">{u.email}</p>
        <p className="mt-0.5 text-sm text-gray-600">
          {ROLE_LABELS[u.role] ?? u.role} · registered{" "}
          {new Date(u.createdAt).toLocaleDateString("en-US")}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {u.status === "pending" && (
          <>
            <div className="flex items-center rounded-md border border-gray-300 bg-white">
              <select
                value={approveRole}
                onChange={(e) => setApproveRole(e.target.value as UserRole)}
                disabled={anyBusy}
                className="appearance-none rounded-l-md border-0 bg-transparent py-1.5 pl-2 pr-1 text-sm text-gray-700 focus:outline-none"
              >
                <option value="staff">Staff</option>
                <option value="restaurant">Restaurant</option>
                <option value="facilities">Facilities</option>
                <option value="developer">Developer</option>
                <option value="admin">Admin</option>
              </select>
              <ChevronDown
                size={14}
                className="mr-2 text-gray-600 pointer-events-none"
              />
            </div>
            <ActionButton
              label="Approve"
              icon={<ShieldCheck size={15} />}
              onClick={() => onAction(u.id, "approve", approveRole)}
              busy={busy("approve")}
              disabled={DEMO_LOCKED || anyBusy}
              variant="green"
            />
            <ActionButton
              label="Reject"
              icon={<XCircle size={15} />}
              onClick={() => onAction(u.id, "reject")}
              busy={busy("reject")}
              disabled={DEMO_LOCKED || anyBusy}
              variant="red"
            />
          </>
        )}

        {u.status === "active" && (
          <>
            <RoleSelector
              current={u.role}
              disabled={DEMO_LOCKED || anyBusy}
              onSave={(role) => onAction(u.id, "change-role", role)}
              saving={busy("change-role")}
            />
            <ActionButton
              label="Archive"
              icon={<Archive size={15} />}
              onClick={() => onAction(u.id, "archive")}
              busy={busy("archive")}
              disabled={DEMO_LOCKED || anyBusy}
              variant="gray"
            />
          </>
        )}

        {u.status === "archived" && (
          <>
            <ActionButton
              label="Reactivate"
              icon={<RotateCcw size={15} />}
              onClick={() => onAction(u.id, "restore")}
              busy={busy("restore")}
              disabled={DEMO_LOCKED || anyBusy}
              variant="green"
            />
            <ConfirmDeleteButton
              onConfirm={() => onDelete(u.id)}
              loading={busy("delete")}
              label="Delete"
              message={`Permanently delete ${u.name}? This can't be undone.`}
            />
          </>
        )}

        {u.status === "rejected" && (
          <>
            <ActionButton
              label="Approve anyway"
              icon={<ShieldCheck size={15} />}
              onClick={() => onAction(u.id, "approve", "staff")}
              busy={busy("approve")}
              disabled={DEMO_LOCKED || anyBusy}
              variant="green"
            />
            <ConfirmDeleteButton
              onConfirm={() => onDelete(u.id)}
              loading={busy("delete")}
              label="Delete"
              message={`Permanently delete ${u.name}? This can't be undone.`}
            />
          </>
        )}
      </div>
    </div>
  );
}

function RoleSelector({
  current,
  disabled,
  onSave,
  saving,
}: {
  current: UserRole;
  disabled: boolean;
  onSave: (role: UserRole) => void;
  saving: boolean;
}) {
  const [selected, setSelected] = useState<UserRole>(current);
  const changed = selected !== current;

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center rounded-md border border-gray-300 bg-white">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value as UserRole)}
          disabled={disabled}
          className="appearance-none rounded-l-md border-0 bg-transparent py-1.5 pl-2 pr-1 text-sm text-gray-700 focus:outline-none"
        >
          <option value="staff">Personal</option>
          <option value="restaurant">Restaurangen</option>
          <option value="facilities">Fastighet</option>
          <option value="developer">Utvecklare</option>
          <option value="admin">Admin</option>
        </select>
        <ChevronDown
          size={14}
          className="mr-2 text-gray-600 pointer-events-none"
        />
      </div>
      {changed && (
        <button
          onClick={() => onSave(selected)}
          disabled={disabled}
          title={DEMO_LOCKED ? DEMO_LOCKED_TITLE : undefined}
          className="rounded-md bg-gray-100 px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      )}
    </div>
  );
}

function ActionButton({
  label,
  icon,
  onClick,
  busy,
  disabled,
  variant,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  busy: boolean;
  disabled: boolean;
  variant: "green" | "red" | "gray";
}) {
  const styles = {
    green:
      "bg-brand-green-dark border-brand-green-dark text-gray-900 hover:bg-brand-green-dark hover:text-white",
    red: "bg-red-50 border-red-300 text-red-700 hover:bg-red-100",
    gray: "bg-white border-gray-300 text-gray-700 hover:bg-gray-50",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={DEMO_LOCKED ? DEMO_LOCKED_TITLE : undefined}
      className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${styles[variant]}`}
    >
      {busy ? (
        <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        icon
      )}
      {label}
    </button>
  );
}
