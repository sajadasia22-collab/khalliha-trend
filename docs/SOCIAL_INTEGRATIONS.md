# Social Integrations - خلّيها ترند

## 1. القاعدة الأساسية

لا تستخدم scraping مخالف أو APIs غير رسمية. لا تدع أن تكامل TikTok أو Instagram أو Facebook أو YouTube مكتمل قبل توفر:

- وثائق رسمية حالية.
- Credentials.
- Sandbox أو بيئة اختبار.
- موافقات المنصة.
- مراجعة شروط الاستخدام.

## 2. MVP Provider

في MVP نستخدم:

```text
ManualSocialMetricsProvider
```

وظائفه:

- تسجيل حساب اجتماعي يدوياً.
- تخزين رابط الحساب واسم المستخدم.
- وسم الحساب كـpending/manual verified حسب مراجعة الإدارة.
- قبول رابط الفيديو بعد normalization.
- إدخال metrics يدوياً بواسطة الإدارة.

## 3. Interface

```ts
interface SocialMetricsProvider {
  verifyAccountOwnership(input: VerifyOwnershipInput): Promise<VerifyOwnershipResult>;
  validatePostUrl(input: ValidatePostUrlInput): Promise<ValidatePostUrlResult>;
  fetchPostMetrics(input: FetchPostMetricsInput): Promise<FetchPostMetricsResult>;
  refreshAccessToken(input: RefreshAccessTokenInput): Promise<RefreshAccessTokenResult>;
}
```

## 4. URL validation

لكل منصة:

- validate domain.
- normalize URL.
- extract post ID.
- prevent duplicates.
- verify linked social account.
- reject posts older than campaign membership.

## 5. Placeholder providers

- TikTokProvider: placeholder موثق.
- InstagramProvider: placeholder موثق.
- FacebookProvider: placeholder موثق.
- YouTubeProvider: placeholder موثق.

كل provider حقيقي يحتاج وثيقة تفعيل منفصلة.
