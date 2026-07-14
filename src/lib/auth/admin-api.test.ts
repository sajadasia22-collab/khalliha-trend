import { beforeEach, describe, expect, it, vi } from "vitest";
import { requireApiUser } from "./api-user";
import { requireAdminApiUser } from "./admin-api";

vi.mock("./api-user", () => ({ requireApiUser: vi.fn() }));

describe("requireAdminApiUser", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when the session is missing or invalidated", async () => {
    vi.mocked(requireApiUser).mockResolvedValue({
      ok: false,
      response: new Response(null, { status: 401 }),
    } as never);

    const result = await requireAdminApiUser("request-1");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(401);
  });

  it("returns 403 for an authenticated non-admin", async () => {
    vi.mocked(requireApiUser).mockResolvedValue({
      ok: true,
      user: { role: "CREATOR" },
    } as never);

    const result = await requireAdminApiUser("request-2");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(403);
  });

  it.each(["ADMIN", "SUPER_ADMIN"])("accepts the %s role", async (role) => {
    vi.mocked(requireApiUser).mockResolvedValue({
      ok: true,
      user: { id: "admin-1", role },
    } as never);

    const result = await requireAdminApiUser("request-3");

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.user.id).toBe("admin-1");
  });
});
