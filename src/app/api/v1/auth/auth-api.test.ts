import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock prisma before any other imports — login/route.ts queries
// brandMember.findFirst directly (to attach brandName) when the
// authenticated user's role is BRAND.
vi.mock("../../../../lib/prisma", () => {
  return {
    prisma: {
      brandMember: {
        findFirst: vi.fn(),
      },
    },
  };
});
import { POST as registerHandler } from "./register/route";
import { POST as loginHandler } from "./login/route";
import { POST as forgotPasswordHandler } from "./forgot-password/route";
import { POST as resetPasswordHandler } from "./reset-password/route";
import { AuthService } from "../../../../modules/auth/service";

// Mock AuthService
vi.mock("../../../../modules/auth/service", () => {
  return {
    AuthService: {
      register: vi.fn(),
      login: vi.fn(),
      requestPasswordReset: vi.fn(),
      resetPassword: vi.fn(),
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
  });

  describe("Forgot Password Handler", () => {
    it("returns validation error for an empty identifier", async () => {
      const mockReq = new Request("http://localhost/api/v1/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ identifier: "" }),
      });

      const response = await forgotPasswordHandler(mockReq);
      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns the same generic success message whether or not the account exists", async () => {
      vi.mocked(AuthService.requestPasswordReset).mockResolvedValue(undefined);

      const mockReq = new Request("http://localhost/api/v1/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ identifier: "anything@example.com" }),
      });

      const response = await forgotPasswordHandler(mockReq);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.status).toBe("success");
      expect(typeof json.message).toBe("string");
    });

    it("still returns the generic success message even if the service throws", async () => {
      vi.mocked(AuthService.requestPasswordReset).mockRejectedValue(
        new Error("email provider down"),
      );

      const mockReq = new Request("http://localhost/api/v1/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ identifier: "anything@example.com" }),
      });

      const response = await forgotPasswordHandler(mockReq);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.status).toBe("success");
    });
  });

  describe("Reset Password Handler", () => {
    it("returns validation error for a missing token or short password", async () => {
      const mockReq = new Request("http://localhost/api/v1/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token: "", password: "123" }),
      });

      const response = await resetPasswordHandler(mockReq);
      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 with the service's Arabic error message for an invalid token", async () => {
      vi.mocked(AuthService.resetPassword).mockRejectedValue(
        new Error("رابط إعادة التعيين غير صالح أو منتهي الصلاحية"),
      );

      const mockReq = new Request("http://localhost/api/v1/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token: "bad-token", password: "newpassword123" }),
      });

      const response = await resetPasswordHandler(mockReq);
      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json.error.code).toBe("RESET_FAILED");
      expect(json.error.message).toBe("رابط إعادة التعيين غير صالح أو منتهي الصلاحية");
    });

    it("succeeds without setting a session cookie", async () => {
      vi.mocked(AuthService.resetPassword).mockResolvedValue("user-123");

      const mockReq = new Request("http://localhost/api/v1/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token: "valid-token", password: "newpassword123" }),
      });

      const response = await resetPasswordHandler(mockReq);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.status).toBe("success");
      expect(response.headers.get("set-cookie")).toBeNull();
    });
  });
});
