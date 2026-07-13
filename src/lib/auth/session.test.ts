import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserStatus } from "../../generated/prisma/enums";

const { cookiesMock, verifyJWTMock, findByIdMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  verifyJWTMock: vi.fn(),
  findByIdMock: vi.fn(),
}));

vi.mock("next/headers", () => ({ cookies: cookiesMock }));
vi.mock("./jwt", () => ({
  getAuthSecret: () => "test-secret",
  verifyJWT: verifyJWTMock,
}));
vi.mock("../../modules/auth/service", () => ({
  AuthService: { findById: findByIdMock },
}));

import { getCurrentUser } from "./session";

describe("getCurrentUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookiesMock.mockResolvedValue({ get: () => ({ value: "valid-token" }) });
    verifyJWTMock.mockResolvedValue({ userId: "user-1" });
  });

  it("returns an active user", async () => {
    findByIdMock.mockResolvedValue({ id: "user-1", status: UserStatus.ACTIVE });
    await expect(getCurrentUser()).resolves.toMatchObject({ id: "user-1" });
  });

  it.each([UserStatus.SUSPENDED, UserStatus.BANNED])(
    "invalidates the current session when status is %s",
    async (status) => {
      findByIdMock.mockResolvedValue({ id: "user-1", status });
      await expect(getCurrentUser()).resolves.toBeNull();
    },
  );
});
