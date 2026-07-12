import { prisma } from "../../lib/prisma";

export interface CreateAuditLogInput {
  actorId?: string;
  actorEmail?: string;
  action: string;
  targetType: string;
  targetId?: string;
  before?: unknown;
  after?: unknown;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditLogService {
  /**
   * Records a security or administrative action in the audit log.
   */
  static async log(input: CreateAuditLogInput) {
    try {
      if (!prisma || !prisma.auditLog) {
        return;
      }
      // Ensure we don't crash the main transaction/operation if audit logging fails
      return await prisma.auditLog.create({
        data: {
          actorId: input.actorId || null,
          actorEmail: input.actorEmail || null,
          action: input.action,
          targetType: input.targetType,
          targetId: input.targetId || null,
          before: input.before ? JSON.parse(JSON.stringify(input.before)) : null,
          after: input.after ? JSON.parse(JSON.stringify(input.after)) : null,
          ipAddress: input.ipAddress || null,
          userAgent: input.userAgent || null,
        },
      });
    } catch (error) {
      // Log to console in development/production as fallback
      console.error("Failed to write audit log:", error);
      // We explicitly do NOT throw to avoid breaking the core business transactions
    }
  }

  /**
   * Retrieves audit logs with optional filters.
   */
  static async listLogs(
    filters: {
      actorId?: string;
      action?: string;
      targetType?: string;
      targetId?: string;
      limit?: number;
      offset?: number;
    } = {},
  ) {
    const { actorId, action, targetType, targetId, limit = 50, offset = 0 } = filters;

    return prisma.auditLog.findMany({
      where: {
        actorId: actorId || undefined,
        action: action || undefined,
        targetType: targetType || undefined,
        targetId: targetId || undefined,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: offset,
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
  }
}
