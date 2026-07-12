import { describe, expect, it, vi, beforeEach } from "vitest";
import { AuditLogService } from "./service";

vi.mock("../../lib/prisma", () => {
  const mockPrisma = {
    auditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  };
  return { prisma: mockPrisma };
});

import { prisma } from "../../lib/prisma";

describe("AuditLogService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("log", () => {
    it("successfully creates an audit log entry in the database", async () => {
      const mockLogEntry = {
        id: "log-1",
        actorId: "actor-1",
        actorEmail: "actor@khalliha-trend.local",
        action: "BRAND_VERIFICATION_APPROVE",
        targetType: "BrandVerification",
        targetId: "ver-1",
        before: { status: "PENDING" },
        after: { status: "APPROVED" },
        ipAddress: "127.0.0.1",
        userAgent: "Mozilla/5.0",
        createdAt: new Date(),
      };

      vi.mocked(prisma.auditLog.create).mockResolvedValue(mockLogEntry as any);

      const result = await AuditLogService.log({
        actorId: "actor-1",
        actorEmail: "actor@khalliha-trend.local",
        action: "BRAND_VERIFICATION_APPROVE",
        targetType: "BrandVerification",
        targetId: "ver-1",
        before: { status: "PENDING" },
        after: { status: "APPROVED" },
        ipAddress: "127.0.0.1",
        userAgent: "Mozilla/5.0",
      });

      expect(prisma.auditLog.create).toHaveBeenCalledTimes(1);
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          actorId: "actor-1",
          actorEmail: "actor@khalliha-trend.local",
          action: "BRAND_VERIFICATION_APPROVE",
          targetType: "BrandVerification",
          targetId: "ver-1",
          before: { status: "PENDING" },
          after: { status: "APPROVED" },
          ipAddress: "127.0.0.1",
          userAgent: "Mozilla/5.0",
        },
      });
      expect(result).toEqual(mockLogEntry);
    });

    it("does not throw error even if database operation fails, to prevent breaking main business flows", async () => {
      vi.mocked(prisma.auditLog.create).mockRejectedValue(new Error("Database error"));

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const result = await AuditLogService.log({
        action: "FAILED_OP",
        targetType: "Test",
      });

      expect(prisma.auditLog.create).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledTimes(1);
      expect(result).toBeUndefined();

      consoleSpy.mockRestore();
    });
  });

  describe("listLogs", () => {
    it("retrieves list of audit logs with correct filters and limits", async () => {
      const mockLogs = [
        { id: "log-1", action: "TEST" },
        { id: "log-2", action: "TEST" },
      ];

      vi.mocked(prisma.auditLog.findMany).mockResolvedValue(mockLogs as any);

      const result = await AuditLogService.listLogs({
        action: "TEST",
        limit: 10,
        offset: 5,
      });

      expect(prisma.auditLog.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          actorId: undefined,
          action: "TEST",
          targetType: undefined,
          targetId: undefined,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
        skip: 5,
        include: {
          actor: {
            select: {
              id: true,
              email: true,
              fullName: true,
              role: true,
            },
          },
        },
      });
      expect(result).toEqual(mockLogs);
    });
  });
});
