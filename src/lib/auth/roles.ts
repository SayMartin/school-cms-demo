// ---------------------------------------------------------------------------
// Auth roles
//
// Keep shared role definitions here so auth config, client types, and route
// guards all use the same values.
// ---------------------------------------------------------------------------

export const USER_ROLES = ["admin", "staff", "restaurant", "facilities", "developer"] as const;

export type UserRole = (typeof USER_ROLES)[number];

// DB fallback — no public registration UI; all accounts are created manually by an admin.
export const DEFAULT_USER_ROLE: UserRole = "staff";

// Studio: prod allows staff+developer+admin; dev restricts to developer+admin only.
export const PROD_STUDIO_ROLES: UserRole[] = ["admin", "staff", "developer"];
export const DEV_STUDIO_ROLES: UserRole[]  = ["admin", "developer"];
export const RESTAURANT_ROLES: UserRole[]  = ["admin", "restaurant"];
export const FACILITIES_ROLES: UserRole[]  = ["admin", "facilities"];
export const ADMIN_ROLES: UserRole[]       = ["admin"];

export function hasProdStudioAccess(role: string | undefined): role is UserRole {
  return role !== undefined && PROD_STUDIO_ROLES.includes(role as UserRole);
}

export function hasDevStudioAccess(role: string | undefined): role is UserRole {
  return role !== undefined && DEV_STUDIO_ROLES.includes(role as UserRole);
}

export function hasStudioAccess(role: string | undefined): role is UserRole {
  return hasProdStudioAccess(role);
}

export function hasRestaurantAccess(role: string | undefined): role is UserRole {
  return role !== undefined && RESTAURANT_ROLES.includes(role as UserRole);
}

export function hasFacilitiesAccess(role: string | undefined): role is UserRole {
  return role !== undefined && FACILITIES_ROLES.includes(role as UserRole);
}

export function hasAdminAccess(role: string | undefined): role is UserRole {
  return role !== undefined && ADMIN_ROLES.includes(role as UserRole);
}

export function isAuthenticatedRole(role: string | undefined): role is UserRole {
  return role !== undefined && USER_ROLES.includes(role as UserRole);
}
