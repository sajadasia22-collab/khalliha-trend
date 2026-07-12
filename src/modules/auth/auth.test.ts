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
    $transaction: vi.fn((cb) => cb(mockPrisma)),
  };
  return { prisma: mockPrisma };
});

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
});
