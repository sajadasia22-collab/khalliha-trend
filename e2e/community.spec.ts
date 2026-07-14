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
  const commentId = (await comment.json()).data.id as string;

  const reply = await request.post(`/api/v1/community/posts/${postId}/comments`, {
    data: { body: "رد حقيقي على التعليق", parentId: commentId },
  });
  expect(reply.status()).toBe(201);
  expect((await reply.json()).data.parentId).toBe(commentId);

  const permalink = await request.get(`/api/v1/community/posts/${postId}`);
  expect(permalink.ok()).toBe(true);
  expect((await permalink.json()).data.id).toBe(postId);

  const comments = await request.get(`/api/v1/community/posts/${postId}/comments`);
  expect(comments.ok()).toBe(true);
  expect((await comments.json()).data).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ id: commentId, parentId: null }),
      expect.objectContaining({ parentId: commentId }),
    ]),
  );

  const update = await request.patch(`/api/v1/community/posts/${postId}`, {
    data: { body: "منشور مجتمع معدل" },
  });
  expect(update.ok()).toBe(true);

  const remove = await request.delete(`/api/v1/community/posts/${postId}`);
  expect(remove.ok()).toBe(true);
});
