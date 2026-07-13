import { prisma } from "../../lib/prisma";
import { UserRole, UserStatus } from "../../generated/prisma/enums";
import { AuditLogService } from "../audit-log/service";

export class AdminUsersService {
  static async list(input: {
    search?: string;
    role?: UserRole;
    status?: UserStatus;
    page?: number;
    pageSize?: number;
  }) {
    const page = Math.max(1, input.page ?? 1);
    const pageSize = Math.min(50, Math.max(10, input.pageSize ?? 20));
    const search = input.search?.trim();
    const where = {
      role: input.role,
      status: input.status,
      OR: search
        ? [
            { fullName: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { phone: { contains: search, mode: "insensitive" as const } },
          ]
        : undefined,
    };

    const [users, total, statusCounts] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          createdAt: true,
          creatorProfile: { select: { trustScore: true } },
          brandMembers: { take: 1, select: { brand: { select: { name: true } } } },
          _count: { select: { openedDisputes: true, fraudSignals: true } },
        },
      }),
      prisma.user.count({ where }),
      prisma.user.groupBy({ by: ["status"], _count: { _all: true } }),
    ]);

    return { users, total, page, pageSize, statusCounts };
  }

  static async getDetails(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        creatorProfile: {
          include: {
            _count: { select: { socialAccounts: true, memberships: true } },
            socialAccounts: { orderBy: { createdAt: "desc" } },
            memberships: {
              orderBy: { createdAt: "desc" },
              take: 10,
              include: { campaign: { select: { id: true, title: true, status: true } } },
            },
          },
        },
        brandMembers: {
          include: {
            brand: {
              include: {
                _count: { select: { campaigns: true, verifications: true } },
              },
            },
          },
        },
        wallets: { include: { financialAccount: true } },
        deposits: { orderBy: { createdAt: "desc" }, take: 10 },
        payouts: { orderBy: { createdAt: "desc" }, take: 10 },
        _count: {
          select: {
            deposits: true,
            payouts: true,
            openedDisputes: true,
            fraudSignals: true,
            notifications: true,
          },
        },
      },
    });
    if (!user) return null;

    const accountIds = user.wallets.map((wallet) => wallet.financialAccountId);
    const [balances, auditLogs] = await Promise.all([
      accountIds.length
        ? prisma.ledgerEntry.groupBy({
            by: ["accountId", "direction"],
            where: { accountId: { in: accountIds } },
            _sum: { amount: true },
          })
        : [],
      prisma.auditLog.findMany({
        where: {
          OR: [{ targetType: "User", targetId: id }, { actorId: id }],
        },
        orderBy: { createdAt: "desc" },
        take: 25,
        include: { actor: { select: { fullName: true, email: true } } },
      }),
    ]);

    const wallets = user.wallets.map((wallet) => {
      const entries = balances.filter(
        (item) => item.accountId === wallet.financialAccountId,
      );
      const credits =
        entries.find((item) => item.direction === "CREDIT")?._sum.amount ?? 0n;
      const debits =
        entries.find((item) => item.direction === "DEBIT")?._sum.amount ?? 0n;
      return { ...wallet, balance: credits - debits };
    });

    return { ...user, wallets, auditLogs };
  }

  static async updateStatus(input: {
    actor: { id: string; role: UserRole; email: string | null };
    targetId: string;
    status: UserStatus;
    reason: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const target = await prisma.user.findUnique({ where: { id: input.targetId } });
    if (!target) throw new Error("USER_NOT_FOUND");
    if (target.id === input.actor.id) throw new Error("CANNOT_MANAGE_SELF");
    if (target.role === UserRole.SUPER_ADMIN)
      throw new Error("CANNOT_MANAGE_SUPER_ADMIN");
    if (target.role === UserRole.ADMIN && input.actor.role !== UserRole.SUPER_ADMIN) {
      throw new Error("SUPER_ADMIN_REQUIRED");
    }

    const updated = await prisma.user.update({
      where: { id: target.id },
      data: { status: input.status },
      select: { id: true, fullName: true, email: true, role: true, status: true },
    });

    await AuditLogService.log({
      actorId: input.actor.id,
      actorEmail: input.actor.email ?? undefined,
      action: "ADMIN_USER_STATUS_CHANGED",
      targetType: "User",
      targetId: target.id,
      before: { status: target.status },
      after: { status: input.status, reason: input.reason },
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
    });

    return updated;
  }
}
