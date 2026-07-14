import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCurrentUser } from "./session";
import { requireApiUser } from "./api-user";

vi.mock("./session", () => ({ getCurrentUser: vi.fn() }));

describe("requireApiUser", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects a missing, expired, suspended, or banned session", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const result = await requireApiUser("request-1");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(401);
  });

  it("returns the active database user", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: "user-1", role: "BRAND" } as never);

    const result = await requireApiUser("request-2");

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.user.id).toBe("user-1");
  });
});
