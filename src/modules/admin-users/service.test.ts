import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserRole, UserStatus } from "../../generated/prisma/enums";

vi.mock("../../lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn(), update: vi.fn() },
  },
}));
vi.mock("../audit-log/service", () => ({
  AuditLogService: { log: vi.fn() },
}));

import { prisma } from "../../lib/prisma";
import { AuditLogService } from "../audit-log/service";
import { AdminUsersService } from "./service";

describe("AdminUsersService.updateStatus", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates status and records the reason in the audit log", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "creator-1",
      role: UserRole.CREATOR,
      status: UserStatus.ACTIVE,
    } as any);
    vi.mocked(prisma.user.update).mockResolvedValue({
      id: "creator-1",
      status: UserStatus.BANNED,
    } as any);

    await AdminUsersService.updateStatus({
      actor: { id: "admin-1", role: UserRole.ADMIN, email: "admin@example.com" },
      targetId: "creator-1",
      status: UserStatus.BANNED,
      reason: "نشاط احتيالي مؤكد",
    });

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: UserStatus.BANNED } }),
    );
    expect(AuditLogService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "ADMIN_USER_STATUS_CHANGED",
        targetId: "creator-1",
        after: { status: UserStatus.BANNED, reason: "نشاط احتيالي مؤكد" },
      }),
    );
  });

  it("prevents an administrator from changing their own status", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "admin-1",
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    } as any);

    await expect(
      AdminUsersService.updateStatus({
        actor: { id: "admin-1", role: UserRole.ADMIN, email: null },
        targetId: "admin-1",
        status: UserStatus.BANNED,
        reason: "اختبار",
      }),
    ).rejects.toThrow("CANNOT_MANAGE_SELF");
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("requires a super admin to manage another admin", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "admin-2",
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    } as any);

    await expect(
      AdminUsersService.updateStatus({
        actor: { id: "admin-1", role: UserRole.ADMIN, email: null },
        targetId: "admin-2",
        status: UserStatus.SUSPENDED,
        reason: "مراجعة الصلاحيات",
      }),
    ).rejects.toThrow("SUPER_ADMIN_REQUIRED");
  });
});
