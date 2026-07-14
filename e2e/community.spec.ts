import { expect, test } from "@playwright/test";

test("creator can publish and interact with a community post through real APIs", async ({
  request,
}) => {
  test.skip(!process.env.DATABASE_URL, "requires the CI/local PostgreSQL database");

  const login = await request.get("/api/dev/quick-login?role=CREATOR");
  expect(login.ok()).toBe(true);

  const profile = await request.patch("/api/v1/creator/profile", {
    data: {
      username: "e2e_community_creator",
      bio: "ملف اختبار المجتمع",
      country: "IQ",
      isProfilePublic: true,
    },
  });
  expect(profile.ok()).toBe(true);

  const create = await request.post("/api/v1/community/posts", {
    data: { body: "منشور مجتمع للاختبار المتكامل" },
  });
  expect(create.status()).toBe(201);
  const postId = (await create.json()).data.id as string;

  const like = await request.post(`/api/v1/community/posts/${postId}/like`);
  expect(like.ok()).toBe(true);
  expect((await like.json()).data.active).toBe(true);

  const save = await request.post(`/api/v1/community/posts/${postId}/save`);
  expect(save.ok()).toBe(true);
  expect((await save.json()).data.active).toBe(true);

  const comment = await request.post(`/api/v1/community/posts/${postId}/comments`, {
    data: { body: "تعليق حقيقي على المنشور" },
  });
  expect(comment.status()).toBe(201);

  const update = await request.patch(`/api/v1/community/posts/${postId}`, {
    data: { body: "منشور مجتمع معدل" },
  });
  expect(update.ok()).toBe(true);

  const remove = await request.delete(`/api/v1/community/posts/${postId}`);
  expect(remove.ok()).toBe(true);
});
