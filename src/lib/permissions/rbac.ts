import { UserRole } from "../../generated/prisma/client";

export type PermissionAction =
  // Creator actions
  | "creator:read-profile"
  | "creator:write-profile"
  | "campaign:join"
  | "submission:create"
  | "submission:read"
  | "wallet:read"
  | "payout:create"
  | "dispute:create"
  | "dispute:read"
  | "social-account:manage"
  // Brand actions
  | "brand:read-profile"
  | "brand:write-profile"
  | "campaign:create"
  | "campaign:read"
  | "campaign:write"
  | "submission:review"
  | "deposit:create"
  | "deposit:read"
  // Admin actions
  | "admin:read"
  | "admin:write"
  | "user:manage-status"
  | "brand:verify"
  | "campaign:review"
  | "submission:manage-metrics"
  | "deposit:review"
  | "payout:review"
  | "dispute:resolve"
  | "audit-log:read"
  // Super Admin specific actions
  | "system:manage-admins";

export const CREATOR_PERMISSIONS: Set<PermissionAction> = new Set([
  "creator:read-profile",
  "creator:write-profile",
  "campaign:join",
  "submission:create",
  "submission:read",
  "wallet:read",
  "payout:create",
  "dispute:create",
  "dispute:read",
  "social-account:manage",
]);

export const BRAND_PERMISSIONS: Set<PermissionAction> = new Set([
  "brand:read-profile",
  "brand:write-profile",
  "campaign:create",
  "campaign:read",
  "campaign:write",
  "submission:review",
  "deposit:create",
  "deposit:read",
  "dispute:read",
]);

export const ADMIN_PERMISSIONS: Set<PermissionAction> = new Set([
  "admin:read",
  "admin:write",
  "user:manage-status",
  "brand:verify",
  "campaign:review",
  "submission:manage-metrics",
  "deposit:review",
  "payout:review",
  "dispute:resolve",
  "audit-log:read",
]);

export function hasPermission(role: UserRole, action: PermissionAction): boolean {
  if (role === UserRole.SUPER_ADMIN) {
    return true; // Super admin has all permissions bypass
  }

  if (role === UserRole.ADMIN) {
    return ADMIN_PERMISSIONS.has(action);
  }

  if (role === UserRole.BRAND) {
    return BRAND_PERMISSIONS.has(action);
  }

  if (role === UserRole.CREATOR) {
    return CREATOR_PERMISSIONS.has(action);
  }

  return false;
}
