import { prisma } from "../../lib/prisma";
import { hashPassword, verifyPassword } from "../../lib/auth/password";
import {
  generateResetToken,
  hashResetToken,
  RESET_TOKEN_TTL_MS,
} from "../../lib/auth/reset-token";
import { sendPasswordResetEmail } from "../../lib/email";
import {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from "./schemas";
import { UserRole, UserStatus } from "../../generated/prisma/client";
import { normalizeIraqiPhone } from "../../lib/phone";
import { AuditLogService } from "../audit-log/service";

export class AuthService {
  static async register(input: RegisterInput) {
    // 1. Verify that email or phone is unique
    if (input.email) {
      const existingEmail = await prisma.user.findUnique({
        where: { email: input.email },
      });
      if (existingEmail) {
        throw new Error("البريد الإلكتروني مسجل بالفعل");
      }
    }

    if (input.phone) {
      const existingPhone = await prisma.user.findUnique({
        where: { phone: input.phone },
      });
      if (existingPhone) {
        throw new Error("رقم الهاتف مسجل بالفعل");
      }
    }

    // 2. Hash the password
    const passwordHash = hashPassword(input.password);

    // 3. Perform registration inside a database transaction
    return await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          fullName: input.fullName,
          email: input.email || null,
          phone: input.phone || null,
          passwordHash,
          role: input.role,
          // Newly registered users are active since they confirmed 18+ and accepted terms
          status: UserStatus.ACTIVE,
        },
      });

      // Initialize role-specific profiles
      if (input.role === UserRole.CREATOR) {
        await tx.creatorProfile.create({
          data: {
            userId: user.id,
            trustScore: 50, // Default trust score is 50
          },
        });
      } else if (input.role === UserRole.BRAND) {
        const brandName = input.brandName || `${input.fullName}'s Brand`;

        // Generate a simple slug
        const randomSuffix = Math.random().toString(36).substring(2, 7);
        const slug =
          brandName
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^\w\u0621-\u064A-]+/g, "") + `-${randomSuffix}`;

        const brand = await tx.brandProfile.create({
          data: {
            name: brandName,
            slug,
          },
        });

        await tx.brandMember.create({
          data: {
            userId: user.id,
            brandId: brand.id,
            role: "OWNER",
          },
        });
      }

      return user;
    });
  }

  static async login(input: LoginInput) {
    // A phone-shaped identifier may arrive in any accepted format (local or E.164);
    // normalize it so it matches the canonical format stored at registration.
    const normalizedPhone = normalizeIraqiPhone(input.identifier);

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: input.identifier }, { phone: normalizedPhone ?? input.identifier }],
      },
    });

    if (!user || !user.passwordHash) {
      throw new Error("بيانات الاعتماد غير صالحة");
    }

    // Check status
    if (user.status === UserStatus.SUSPENDED || user.status === UserStatus.BANNED) {
      throw new Error("هذا الحساب تم تعليقه أو حظره من قبل الإدارة");
    }

    // Verify password
    const isPasswordValid = verifyPassword(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error("بيانات الاعتماد غير صالحة");
    }

    return user;
  }

  static async requestPasswordReset(input: ForgotPasswordInput): Promise<void> {
    const normalizedPhone = normalizeIraqiPhone(input.identifier);

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: input.identifier }, { phone: normalizedPhone ?? input.identifier }],
      },
    });

    // Anti-enumeration: silently no-op when the account doesn't exist, or exists
    // but has no email (phone-only accounts have no delivery channel yet).
    if (!user || !user.email) {
      return;
    }

    const rawToken = generateResetToken();
    const tokenHash = hashResetToken(rawToken);
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    await prisma.$transaction(async (tx) => {
      // At most one live token per user at a time.
      await tx.passwordResetToken.deleteMany({
        where: { userId: user.id, usedAt: null },
      });
      await tx.passwordResetToken.create({
        data: { userId: user.id, tokenHash, expiresAt },
      });
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetUrl = `${appUrl}/reset-password?token=${rawToken}`;
    await sendPasswordResetEmail(user.email, resetUrl, user.fullName);

    await AuditLogService.log({
      actorId: user.id,
      actorEmail: user.email,
      action: "PASSWORD_RESET_REQUESTED",
      targetType: "User",
      targetId: user.id,
    });
  }

  static async resetPassword(input: ResetPasswordInput): Promise<string> {
    const tokenHash = hashResetToken(input.token);
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      throw new Error("رابط إعادة التعيين غير صالح أو منتهي الصلاحية");
    }

    const passwordHash = hashPassword(input.password);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: resetToken.userId }, data: { passwordHash } });
      await tx.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      });
      // Defense in depth: invalidate any other outstanding tokens for this user.
      await tx.passwordResetToken.deleteMany({
        where: { userId: resetToken.userId, id: { not: resetToken.id }, usedAt: null },
      });
    });

    await AuditLogService.log({
      actorId: resetToken.userId,
      action: "PASSWORD_RESET_SUCCESS",
      targetType: "User",
      targetId: resetToken.userId,
    });

    return resetToken.userId;
  }

  static async findById(id: string) {
    return await prisma.user.findUnique({
      where: { id },
      include: {
        creatorProfile: true,
        brandMembers: {
          include: {
            brand: true,
          },
        },
      },
    });
  }
}
