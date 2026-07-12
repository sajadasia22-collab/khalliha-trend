import { describe, expect, it } from "vitest";
import { UserRole } from "../../generated/prisma/client";
import {
  ADMIN_PERMISSIONS,
  BRAND_PERMISSIONS,
  CREATOR_PERMISSIONS,
  hasPermission,
  type PermissionAction,
} from "./rbac";

// SUPER_ADMIN-only action: not present in any named role set, granted purely
// via the unconditional bypass in hasPermission(). Included here so the full
// action sweep below also exercises that bypass path for every other role.
const SUPER_ADMIN_ONLY_ACTION: PermissionAction = "system:manage-admins";

const ALL_ACTIONS: PermissionAction[] = Array.from(
  new Set([
    ...CREATOR_PERMISSIONS,
    ...BRAND_PERMISSIONS,
    ...ADMIN_PERMISSIONS,
    SUPER_ADMIN_ONLY_ACTION,
  ]),
);

const ROLE_SETS: Record<Exclude<UserRole, "SUPER_ADMIN">, Set<PermissionAction>> = {
  CREATOR: CREATOR_PERMISSIONS,
  BRAND: BRAND_PERMISSIONS,
  ADMIN: ADMIN_PERMISSIONS,
};

describe("RBAC permission matrix", () => {
  it("SUPER_ADMIN can perform every known action, with no exceptions", () => {
    for (const action of ALL_ACTIONS) {
      expect(hasPermission(UserRole.SUPER_ADMIN, action)).toBe(true);
    }
  });

  for (const role of Object.keys(ROLE_SETS) as (keyof typeof ROLE_SETS)[]) {
    describe(`${role} role`, () => {
      it(`grants exactly its declared permission set and refuses everything else`, () => {
        const allowed = ROLE_SETS[role];
        for (const action of ALL_ACTIONS) {
          const expected = allowed.has(action);
          expect(
            hasPermission(UserRole[role], action),
            `${role} -> ${action} expected ${expected}`,
          ).toBe(expected);
        }
      });

      it("never gains the SUPER_ADMIN-only action", () => {
        expect(hasPermission(UserRole[role], SUPER_ADMIN_ONLY_ACTION)).toBe(false);
      });
    });
  }

  it("no non-admin role can review, verify, or resolve — those stay admin-exclusive", () => {
    const adminExclusive: PermissionAction[] = [
      "campaign:review",
      "brand:verify",
      "submission:manage-metrics",
      "deposit:review",
      "payout:review",
      "dispute:resolve",
      "user:manage-status",
      "audit-log:read",
    ];
    for (const action of adminExclusive) {
      expect(hasPermission(UserRole.CREATOR, action)).toBe(false);
      expect(hasPermission(UserRole.BRAND, action)).toBe(false);
    }
  });

  it("only creators can join campaigns and submit posts", () => {
    expect(hasPermission(UserRole.CREATOR, "campaign:join")).toBe(true);
    expect(hasPermission(UserRole.CREATOR, "submission:create")).toBe(true);
    expect(hasPermission(UserRole.BRAND, "campaign:join")).toBe(false);
    expect(hasPermission(UserRole.BRAND, "submission:create")).toBe(false);
    expect(hasPermission(UserRole.ADMIN, "campaign:join")).toBe(false);
    expect(hasPermission(UserRole.ADMIN, "submission:create")).toBe(false);
  });

  it("only brands can create campaigns and review submissions", () => {
    expect(hasPermission(UserRole.BRAND, "campaign:create")).toBe(true);
    expect(hasPermission(UserRole.BRAND, "submission:review")).toBe(true);
    expect(hasPermission(UserRole.CREATOR, "campaign:create")).toBe(false);
    expect(hasPermission(UserRole.CREATOR, "submission:review")).toBe(false);
    expect(hasPermission(UserRole.ADMIN, "campaign:create")).toBe(false);
    expect(hasPermission(UserRole.ADMIN, "submission:review")).toBe(false);
  });

  it("disputes can be read by both creators and brands, but resolved only by admins", () => {
    expect(hasPermission(UserRole.CREATOR, "dispute:read")).toBe(true);
    expect(hasPermission(UserRole.BRAND, "dispute:read")).toBe(true);
    expect(hasPermission(UserRole.CREATOR, "dispute:resolve")).toBe(false);
    expect(hasPermission(UserRole.BRAND, "dispute:resolve")).toBe(false);
    expect(hasPermission(UserRole.ADMIN, "dispute:resolve")).toBe(true);
  });
});
