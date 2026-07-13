import { describe, expect, it, vi, beforeEach } from "vitest";
import { pbkdf2Sync } from "crypto";
import { AuthService } from "./service";
import { UserStatus } from "../../generated/prisma/client";
import { UserRole } from "./schemas";

// Mock the prisma client
vi.mock("../../lib/prisma", () => {
  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    creatorProfile: {
      create: vi.fn(),
    },
    brandProfile: {
      create: vi.fn(),
    },
    brandMember: {
      create: vi.fn(),
    },
    passwordResetToken: {
      deleteMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn((cb) => cb(mockPrisma)),
  };
  return { prisma: mockPrisma };
});

const sendPasswordResetEmailMock = vi.fn().mockResolvedValue(undefined);
vi.mock("../../lib/email", () => ({
  sendPasswordResetEmail: (...args: unknown[]) => sendPasswordResetEmailMock(...args),
}));

import { prisma } from "../../lib/prisma";

describe("AuthService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("register", () => {
    it("should successfully register a Creator and initialize creatorProfile", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const mockCreatedUser = {
        id: "user-123",
        fullName: "محمد علي",
        email: "creator@example.com",
        phone: null,
        passwordHash: "salt:hash",
        role: UserRole.CREATOR,
        status: UserStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.user.create).mockResolvedValue(mockCreatedUser as any);

      const result = await AuthService.register({
        fullName: "محمد علي",
        email: "creator@example.com",
        password: "password123",
        role: UserRole.CREATOR,
        acceptTerms: true,
        confirmAge: true,
      });

      expect(result).toBeDefined();
      expect(result.id).toBe("user-123");
      expect(result.role).toBe(UserRole.CREATOR);

      // Verify transaction flow
      expect(prisma.user.create).toHaveBeenCalled();
      expect(prisma.creatorProfile.create).toHaveBeenCalledWith({
        data: {
          userId: "user-123",
          trustScore: 50,
        },
      });
    });

    it("should successfully register a Brand and initialize brandProfile and brandMember", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const mockCreatedUser = {
        id: "user-456",
        fullName: "أحمد صالح",
        email: "brand@example.com",
        phone: null,
        passwordHash: "salt:hash",
        role: UserRole.BRAND,
        status: UserStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockCreatedBrand = {
        id: "brand-789",
        name: "شركة النخيل",
        slug: "brand-slug-xyz",
      };

      vi.mocked(prisma.user.create).mockResolvedValue(mockCreatedUser as any);
      vi.mocked(prisma.brandProfile.create).mockResolvedValue(mockCreatedBrand as any);

      const result = await AuthService.register({
        fullName: "أحمد صالح",
        email: "brand@example.com",
        password: "password123",
        role: UserRole.BRAND,
        brandName: "شركة النخيل",
        acceptTerms: true,
        confirmAge: true,
      });

      expect(result).toBeDefined();
      expect(result.id).toBe("user-456");
      expect(result.role).toBe(UserRole.BRAND);

      expect(prisma.user.create).toHaveBeenCalled();
      expect(prisma.brandProfile.create).toHaveBeenCalled();
      expect(prisma.brandMember.create).toHaveBeenCalledWith({
        data: {
          userId: "user-456",
          brandId: "brand-789",
          role: "OWNER",
        },
      });
    });

    it("should throw error if email already exists", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "existing-user" } as any);

      await expect(
        AuthService.register({
          fullName: "علي",
          email: "existing@example.com",
          password: "password123",
          role: UserRole.CREATOR,
          acceptTerms: true,
          confirmAge: true,
        }),
      ).rejects.toThrow("البريد الإلكتروني مسجل بالفعل");
    });
  });

  describe("login", () => {
    it("should login successfully with correct credentials", async () => {
      const password = "password123";
      // Let's stub helper functions dynamically or use real hashing for mock setup:
      const salt = "46f88296a80ea47f";
      const hash = pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
      const mockUser = {
        id: "user-123",
        fullName: "محمد علي",
        email: "creator@example.com",
        phone: null,
        passwordHash: `${salt}:${hash}`,
        role: UserRole.CREATOR,
        status: UserStatus.ACTIVE,
      };

      vi.mocked(prisma.user.findFirst).mockResolvedValue(mockUser as any);

      const result = await AuthService.login({
        identifier: "creator@example.com",
        password: "password123",
      });

      expect(result).toBeDefined();
      expect(result.id).toBe("user-123");
    });

    it("should throw error for invalid credentials", async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

      await expect(
        AuthService.login({
          identifier: "notfound@example.com",
          password: "password123",
        }),
      ).rejects.toThrow("بيانات الاعتماد غير صالحة");
    });

    it("should query by the normalized phone regardless of how the user typed it", async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

      await AuthService.login({
        identifier: "07701234567",
        password: "password123",
      }).catch(() => undefined);

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [{ email: "07701234567" }, { phone: "+9647701234567" }],
        },
      });
    });
  });

  describe("authenticateWithGoogle", () => {
    it("logs in an existing active user by verified Google email", async () => {
      const existingUser = {
        id: "google-existing",
        email: "user@example.com",
        fullName: "مستخدم Google",
        role: UserRole.CREATOR,
        status: UserStatus.ACTIVE,
      };
      vi.mocked(prisma.user.findUnique).mockResolvedValue(existingUser as any);

      const result = await AuthService.authenticateWithGoogle({
        intent: "login",
        email: "USER@example.com",
        fullName: "اسم مختلف",
      });

      expect(result).toEqual({ user: existingUser, created: false });
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it("does not create an unknown Google user from the login page", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(
        AuthService.authenticateWithGoogle({
          intent: "login",
          email: "new@example.com",
          fullName: "مستخدم جديد",
        }),
      ).rejects.toThrow("GOOGLE_ACCOUNT_NOT_FOUND");
    });

    it("creates the selected creator profile for a new Google registration", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      const createdUser = {
        id: "google-creator",
        email: "creator@gmail.com",
        fullName: "صانع Google",
        role: UserRole.CREATOR,
        status: UserStatus.ACTIVE,
      };
      vi.mocked(prisma.user.create).mockResolvedValue(createdUser as any);

      const result = await AuthService.authenticateWithGoogle({
        intent: "register",
        email: "creator@gmail.com",
        fullName: "صانع Google",
        role: UserRole.CREATOR,
      });

      expect(result.created).toBe(true);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: "creator@gmail.com",
          passwordHash: null,
          role: UserRole.CREATOR,
          status: UserStatus.ACTIVE,
        }),
      });
      expect(prisma.creatorProfile.create).toHaveBeenCalledWith({
        data: { userId: "google-creator", trustScore: 50 },
      });
    });

    it("creates a brand and owner membership for a new Google brand", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: "google-brand-user",
        email: "brand@gmail.com",
        fullName: "تاجر Google",
        role: UserRole.BRAND,
        status: UserStatus.ACTIVE,
      } as any);
      vi.mocked(prisma.brandProfile.create).mockResolvedValue({
        id: "google-brand",
      } as any);

      await AuthService.authenticateWithGoogle({
        intent: "register",
        email: "brand@gmail.com",
        fullName: "تاجر Google",
        role: UserRole.BRAND,
        brandName: "متجر بغداد",
      });

      expect(prisma.brandProfile.create).toHaveBeenCalledWith({
        data: {
          name: "متجر بغداد",
          slug: expect.stringMatching(/^متجر-بغداد-/),
        },
      });
      expect(prisma.brandMember.create).toHaveBeenCalledWith({
        data: {
          userId: "google-brand-user",
          brandId: "google-brand",
          role: "OWNER",
        },
      });
    });

    it("rejects Google login for suspended or banned accounts", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: "blocked-user",
        status: UserStatus.SUSPENDED,
      } as any);

      await expect(
        AuthService.authenticateWithGoogle({
          intent: "login",
          email: "blocked@example.com",
          fullName: "محظور",
        }),
      ).rejects.toThrow("ACCOUNT_BLOCKED");
    });
  });

  describe("requestPasswordReset", () => {
    it("creates a token and sends an email when the user exists with an email", async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue({
        id: "user-123",
        email: "creator@example.com",
        fullName: "محمد علي",
      } as any);

      await AuthService.requestPasswordReset({ identifier: "creator@example.com" });

      expect(prisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: "user-123", usedAt: null },
      });
      expect(prisma.passwordResetToken.create).toHaveBeenCalled();
      expect(sendPasswordResetEmailMock).toHaveBeenCalledWith(
        "creator@example.com",
        expect.stringContaining("/reset-password?token="),
        "محمد علي",
      );
    });

    it("silently no-ops when no user matches (anti-enumeration)", async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

      await AuthService.requestPasswordReset({ identifier: "nobody@example.com" });

      expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
      expect(sendPasswordResetEmailMock).not.toHaveBeenCalled();
    });

    it("silently no-ops for phone-only accounts (no delivery channel)", async () => {
      vi.mocked(prisma.user.findFirst).mockResolvedValue({
        id: "user-789",
        email: null,
        fullName: "علي حسن",
      } as any);

      await AuthService.requestPasswordReset({ identifier: "+9647701234567" });

      expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
      expect(sendPasswordResetEmailMock).not.toHaveBeenCalled();
    });
  });

  describe("resetPassword", () => {
    it("throws for a nonexistent, expired, or already-used token", async () => {
      vi.mocked(prisma.passwordResetToken.findUnique).mockResolvedValue(null);
      await expect(
        AuthService.resetPassword({ token: "bad", password: "newpassword123" }),
      ).rejects.toThrow("رابط إعادة التعيين غير صالح أو منتهي الصلاحية");

      vi.mocked(prisma.passwordResetToken.findUnique).mockResolvedValue({
        id: "token-1",
        userId: "user-123",
        usedAt: new Date(),
        expiresAt: new Date(Date.now() + 60 * 1000),
      } as any);
      await expect(
        AuthService.resetPassword({ token: "used", password: "newpassword123" }),
      ).rejects.toThrow("رابط إعادة التعيين غير صالح أو منتهي الصلاحية");

      vi.mocked(prisma.passwordResetToken.findUnique).mockResolvedValue({
        id: "token-2",
        userId: "user-123",
        usedAt: null,
        expiresAt: new Date(Date.now() - 60 * 1000),
      } as any);
      await expect(
        AuthService.resetPassword({ token: "expired", password: "newpassword123" }),
      ).rejects.toThrow("رابط إعادة التعيين غير صالح أو منتهي الصلاحية");
    });

    it("updates the password, marks the token used, and clears sibling tokens on success", async () => {
      vi.mocked(prisma.passwordResetToken.findUnique).mockResolvedValue({
        id: "token-3",
        userId: "user-123",
        usedAt: null,
        expiresAt: new Date(Date.now() + 60 * 1000),
      } as any);

      const userId = await AuthService.resetPassword({
        token: "valid-token",
        password: "newpassword123",
      });

      expect(userId).toBe("user-123");
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-123" },
        data: { passwordHash: expect.any(String) },
      });
      expect(prisma.passwordResetToken.update).toHaveBeenCalledWith({
        where: { id: "token-3" },
        data: { usedAt: expect.any(Date) },
      });
      expect(prisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: "user-123", id: { not: "token-3" }, usedAt: null },
      });
    });
  });
});
