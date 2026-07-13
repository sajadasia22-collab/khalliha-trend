import { describe, expect, it, vi, beforeEach } from "vitest";

const sendMock = vi.fn().mockResolvedValue({ data: { id: "email-1" }, error: null });

vi.mock("resend", () => {
  return {
    Resend: vi.fn().mockImplementation(function Resend() {
      return { emails: { send: sendMock } };
    }),
  };
});

import { sendPasswordResetEmail } from "./email";

describe("sendPasswordResetEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("logs the reset link instead of sending when RESEND_API_KEY is unset in dev", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("NODE_ENV", "development");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);

    await sendPasswordResetEmail("user@example.com", "http://localhost:3000/reset?token=abc", "علي");

    expect(sendMock).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining("http://localhost:3000/reset?token=abc"),
    );
  });

  it("sends via Resend when an API key is configured", async () => {
    vi.stubEnv("RESEND_API_KEY", "test-key");

    await sendPasswordResetEmail("user@example.com", "http://localhost:3000/reset?token=abc", "علي");

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "user@example.com",
        subject: expect.stringContaining("إعادة تعيين كلمة المرور"),
      }),
    );
  });

  it("throws instead of silently skipping delivery in production without a key", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("NODE_ENV", "production");

    await expect(
      sendPasswordResetEmail("user@example.com", "http://localhost:3000/reset?token=abc", "علي"),
    ).rejects.toThrow(/RESEND_API_KEY is required/);
  });
});
