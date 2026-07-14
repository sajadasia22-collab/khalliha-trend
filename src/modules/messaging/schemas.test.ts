import { describe, expect, it } from "vitest";
import {
  createConversationReportSchema,
  createConversationSchema,
  createMessageSchema,
} from "./schemas";

describe("messaging schemas", () => {
  it("requires a campaign and a non-empty first message", () => {
    expect(
      createConversationSchema.safeParse({ campaignId: "campaign-1", body: "مرحباً" })
        .success,
    ).toBe(true);
    expect(
      createConversationSchema.safeParse({ campaignId: "campaign-1", body: "   " })
        .success,
    ).toBe(false);
  });

  it("limits message bodies to 2000 characters", () => {
    expect(createMessageSchema.safeParse({ body: "أ".repeat(2000) }).success).toBe(true);
    expect(createMessageSchema.safeParse({ body: "أ".repeat(2001) }).success).toBe(false);
  });

  it("only accepts known report reasons", () => {
    expect(
      createConversationReportSchema.safeParse({
        messageId: "message-1",
        reason: "HARASSMENT",
      }).success,
    ).toBe(true);
    expect(
      createConversationReportSchema.safeParse({
        messageId: "message-1",
        reason: "UNSUPPORTED",
      }).success,
    ).toBe(false);
  });
});
