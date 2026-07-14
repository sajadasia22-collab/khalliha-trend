import { afterEach, describe, expect, it, vi } from "vitest";
import { buildErrorRecord, reportRequestError, shouldSendAlert } from "./error-alert";

describe("error-alert", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("builds a structured record with truncated stack", () => {
    const error = new Error("boom");
    error.stack = Array.from({ length: 20 }, (_, i) => `line-${i}`).join("\n");

    const record = buildErrorRecord(
      error,
      { path: "/api/v1/disputes", method: "POST" },
      { routeType: "route", routePath: "/api/v1/disputes" },
    );

    expect(record.message).toBe("boom");
    expect(record.stack?.split("\n")).toHaveLength(8);
    expect(record.path).toBe("/api/v1/disputes");
    expect(record.method).toBe("POST");
  });

  it("wraps non-Error values", () => {
    const record = buildErrorRecord(
      "raw failure",
      { path: "/x", method: "GET" },
      { routeType: "render", routePath: "/x" },
    );
    expect(record.message).toBe("raw failure");
  });

  it("throttles repeated alerts for the same message within the window", () => {
    const now = Date.now();
    expect(shouldSendAlert("same-error", now)).toBe(true);
    expect(shouldSendAlert("same-error", now + 1_000)).toBe(false);
    expect(shouldSendAlert("same-error", now + 61_000)).toBe(true);
    expect(shouldSendAlert("other-error", now + 2_000)).toBe(true);
  });

  it("logs a structured line and skips webhook when env is not set", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await reportRequestError({
      message: "no-webhook",
      path: "/api/v1/wallet",
      method: "GET",
      routeType: "route",
      routePath: "/api/v1/wallet",
    });

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    const logged = JSON.parse(consoleSpy.mock.calls[0][0] as string);
    expect(logged.source).toBe("khalliha:server-error");
    expect(logged.message).toBe("no-webhook");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("posts a Slack/Discord-compatible payload when webhook is configured", async () => {
    vi.stubEnv("ERROR_ALERT_WEBHOOK_URL", "https://hooks.example.test/alert");
    vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("ok"));

    await reportRequestError({
      message: `webhook-${Date.now()}`,
      path: "/api/v1/disputes",
      method: "POST",
      routeType: "route",
      routePath: "/api/v1/disputes",
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("https://hooks.example.test/alert");
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.text).toContain("خطأ سيرفر");
    expect(body.content).toBe(body.text);
  });

  it("never throws when the webhook call fails", async () => {
    vi.stubEnv("ERROR_ALERT_WEBHOOK_URL", "https://hooks.example.test/alert");
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));

    await expect(
      reportRequestError({
        message: `failing-${Date.now()}`,
        path: "/x",
        method: "GET",
        routeType: "render",
        routePath: "/x",
      }),
    ).resolves.toBeUndefined();
  });
});
