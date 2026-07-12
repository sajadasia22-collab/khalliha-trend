import { prisma } from "../../lib/prisma";
import { hashPassword, verifyPassword } from "../../lib/auth/password";
import { RegisterInput, LoginInput } from "./schemas";
import { UserRole, UserStatus } from "../../generated/prisma/client";
import { normalizeIraqiPhone } from "../../lib/phone";

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
