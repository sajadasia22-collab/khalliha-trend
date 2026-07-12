import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock prisma before any other imports
vi.mock("../../../../lib/prisma", () => {
  return {
    prisma: {
      user: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        upsert: vi.fn(),
      },
      creatorProfile: {
        upsert: vi.fn(),
      },
      brandMember: {
        findFirst: vi.fn(),
        create: vi.fn(),
      },
      brandProfile: {
        create: vi.fn(),
      },
    },
  };
});
import { prisma } from "../../../../lib/prisma";
import { POST as registerHandler } from "./register/route";
import { POST as loginHandler } from "./login/route";
import { AuthService } from "../../../../modules/auth/service";

// Mock AuthService
vi.mock("../../../../modules/auth/service", () => {
  return {
    AuthService: {
      register: vi.fn(),
      login: vi.fn(),
    },
  };
});

describe("Auth API Handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Register Handler", () => {
    it("should return validation error for incomplete inputs", async () => {
      const mockReq = new Request("http://localhost/api/v1/auth/register", {
        method: "POST",
        body: JSON.stringify({
          fullName: "علي", // too short, needs email or phone, terms, etc
        }),
      });

      const response = await registerHandler(mockReq);
      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json.error.code).toBe("VALIDATION_ERROR");
      expect(json.error.details).toBeDefined();
    });

    it("should successfully register creator with valid inputs", async () => {
      const mockUser = {
        id: "user-123",
        fullName: "محمد علي",
        email: "creator@example.com",
        phone: null,
        role: "CREATOR",
        status: "ACTIVE",
      };

      vi.mocked(AuthService.register).mockResolvedValue(mockUser as any);

      const mockReq = new Request("http://localhost/api/v1/auth/register", {
        method: "POST",
        body: JSON.stringify({
          fullName: "محمد علي",
          email: "creator@example.com",
          password: "password123",
          role: "CREATOR",
          acceptTerms: true,
          confirmAge: true,
        }),
      });

      const response = await registerHandler(mockReq);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.status).toBe("success");
      expect(json.user.id).toBe("user-123");

      // Verify cookie was set
      const cookieHeader = response.headers.get("set-cookie");
      expect(cookieHeader).toContain("khalliha_trend_session");
    });
  });

  describe("Login Handler", () => {
    it("should return 401 for invalid credentials", async () => {
      vi.mocked(AuthService.login).mockRejectedValue(
        new Error("بيانات الاعتماد غير صالحة"),
      );

      const mockReq = new Request("http://localhost/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({
          identifier: "wrong@example.com",
          password: "wrongpassword",
        }),
      });

      const response = await loginHandler(mockReq);
      expect(response.status).toBe(401);

      const json = await response.json();
      expect(json.error.code).toBe("UNAUTHENTICATED");
    });

    it("should login successfully and return 200 with session cookie", async () => {
      const mockUser = {
        id: "user-123",
        fullName: "محمد علي",
        email: "creator@example.com",
        phone: null,
        role: "CREATOR",
        status: "ACTIVE",
      };

      vi.mocked(AuthService.login).mockResolvedValue(mockUser as any);

      const mockReq = new Request("http://localhost/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({
          identifier: "creator@example.com",
          password: "password123",
        }),
      });

      const response = await loginHandler(mockReq);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.status).toBe("success");
      expect(json.user.id).toBe("user-123");

      const cookieHeader = response.headers.get("set-cookie");
      expect(cookieHeader).toContain("khalliha_trend_session");
    });

    it("should return requiresRoleSelection: true for joker account without role selection", async () => {
      const mockJoker = {
        id: "joker-123",
        fullName: "حساب الجوكر التجريبي",
        email: "mhrb00850@gmail.com",
        phone: null,
        role: "SUPER_ADMIN",
        status: "ACTIVE",
      };

      vi.mocked(prisma.user.upsert).mockResolvedValue(mockJoker as any);
      vi.mocked(prisma.creatorProfile.upsert).mockResolvedValue({} as any);
      vi.mocked(prisma.brandMember.findFirst).mockResolvedValue({
        brand: { name: "علامة الجوكر التجريبية" },
      } as any);

      const mockReq = new Request("http://localhost/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({
          identifier: "mhrb00850@gmail.com",
          password: "aqswde11",
        }),
      });

      const response = await loginHandler(mockReq);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.status).toBe("success");
      expect(json.requiresRoleSelection).toBe(true);
    });

    it("should login successfully and set cookie for joker account when role is selected", async () => {
      const mockJoker = {
        id: "joker-123",
        fullName: "حساب الجوكر التجريبي",
        email: "mhrb00850@gmail.com",
        phone: null,
        role: "SUPER_ADMIN",
        status: "ACTIVE",
      };

      vi.mocked(prisma.user.upsert).mockResolvedValue(mockJoker as any);
      vi.mocked(prisma.creatorProfile.upsert).mockResolvedValue({} as any);
      vi.mocked(prisma.brandMember.findFirst).mockResolvedValue({
        brand: { name: "علامة الجوكر التجريبية" },
      } as any);

      const mockReq = new Request("http://localhost/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({
          identifier: "mhrb00850@gmail.com",
          password: "aqswde11",
          selectedRole: "CREATOR",
        }),
      });

      const response = await loginHandler(mockReq);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.status).toBe("success");
      expect(json.user.role).toBe("CREATOR");

      const cookieHeader = response.headers.get("set-cookie");
      expect(cookieHeader).toContain("khalliha_trend_session");
    });
  });
});
