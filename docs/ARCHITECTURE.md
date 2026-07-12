# Architecture - خلّيها ترند

## 1. القرار المعماري

البنية المقترحة هي Full-stack Modular Monolith باستخدام Next.js App Router. هذا الخيار يعطي سرعة تنفيذ عالية للـMVP مع فصل واضح للموديولات، ويسمح لاحقاً بفصل أجزاء محددة إلى خدمات مستقلة إذا أصبح ذلك ضرورياً.

## 2. التقنية المقترحة

- Next.js App Router.
- TypeScript strict.
- PostgreSQL.
- Prisma ORM مع migrations.
- Supabase للمصادقة، قاعدة البيانات، والتخزين عند توفر الإعدادات.
- Tailwind CSS.
- shadcn/ui أو مكونات داخلية مبنية فوق Radix عند الحاجة.
- Zod للتحقق من المدخلات.
- React Hook Form للنماذج.
- REST API تحت `/api/v1`.
- OpenAPI specification.
- Vitest للاختبارات.
- Playwright لاختبارات E2E.
- Sentry أو Observability Provider قابل للاستبدال.
- PWA للصفحات العامة.
- pnpm لإدارة الحزم.

## 3. هيكل المشروع المقترح

```text
src/
  app/
    (public)/
    (auth)/
    (creator)/
    (brand)/
    (admin)/
    api/v1/
  components/
    ui/
    layout/
    forms/
  modules/
    auth/
    users/
    brands/
    creators/
    campaigns/
    submissions/
    social-accounts/
    metrics/
    earnings/
    wallets/
    payouts/
    disputes/
    fraud/
    trust-score/
    notifications/
    admin/
    audit/
  lib/
    server/
    validation/
    permissions/
    money/
    urls/
    providers/
  config/
  types/
  i18n/
prisma/
  schema.prisma
  migrations/
  seed.ts
docs/
```

## 4. حدود الموديولات

### auth

المصادقة، الجلسات، التسجيل، تسجيل الدخول، Rate Limits، وإدارة تسجيل الخروج من جميع الأجهزة.

### users

المستخدم الأساسي، الأدوار، حالة الحساب، وبيانات الملف العامة.

### creators

ملف صانع المحتوى، المجالات، المحافظة، Trust Score summary، وإحصاءات عامة غير حساسة.

### brands

ملفات العلامات التجارية، أعضاء العلامة، توثيق العلامة، وإعدادات الفريق المستقبلية.

### campaigns

الحملات، الشروط، المنصات، أسعار CPM، الميزانيات المحجوزة، الأصول، وحالات الحملة.

### submissions

الانضمام للحملات، إرسال الروابط، المراجعات، حالات الفيديو، وTerms Snapshot.

### social-accounts

الحسابات الاجتماعية وProvider interface للتحقق والقياسات.

### metrics

Metrics snapshots، التعديلات اليدوية، والتحقق من المشاهدات المؤهلة.

### earnings

محرك الأرباح، cap rules، holds، والتحويل إلى الرصيد المتاح.

### wallets / payouts

الحسابات المالية، Ledger، المحافظ، طرق السحب، وطلبات السحب اليدوية.

### fraud / trust-score

إشارات الاحتيال، Fraud Score، Trust Score Events، وقوائم المراجعة البشرية.

### disputes

النزاعات، الرسائل، الأدلة، القرارات، والأثر المالي.

### notifications

إشعارات داخل المنصة وتفضيلات المستخدم. البريد وPush وSMS تبقى عبر Providers لاحقاً.

### audit

Audit Logs لكل عملية حساسة أو مالية أو إدارية.

## 5. نمط طبقات التطبيق

كل موديول يفضل أن يحتوي:

```text
module/
  schemas.ts
  permissions.ts
  service.ts
  repository.ts
  routes.ts
  tests/
```

- `schemas.ts`: Zod input/output schemas.
- `permissions.ts`: قواعد التفويض الخاصة بالموديول.
- `service.ts`: منطق الأعمال والمعاملات.
- `repository.ts`: Prisma access فقط.
- `routes.ts`: route handlers أو helper للـAPI.

لا يوضع منطق مالي أو صلاحيات داخل مكونات الواجهة.

## 6. API-first

جميع الوظائف الأساسية يجب أن تكون متاحة عبر REST API موثق:

- Auth.
- Users and profiles.
- Campaigns.
- Campaign membership.
- Submissions.
- Metrics.
- Earnings.
- Wallets.
- Payouts.
- Deposits.
- Disputes.
- Notifications.
- Admin workflows.

## 7. Provider Interfaces

### SocialMetricsProvider

```ts
interface SocialMetricsProvider {
  verifyAccountOwnership(input: VerifyOwnershipInput): Promise<VerifyOwnershipResult>;
  validatePostUrl(input: ValidatePostUrlInput): Promise<ValidatePostUrlResult>;
  fetchPostMetrics(input: FetchPostMetricsInput): Promise<FetchPostMetricsResult>;
  refreshAccessToken(input: RefreshAccessTokenInput): Promise<RefreshAccessTokenResult>;
}
```

MVP يستخدم `ManualSocialMetricsProvider`. مزودو TikTok وInstagram وFacebook وYouTube يكونون placeholders موثقين فقط حتى تتوفر الاعتمادات.

### PaymentProvider

```ts
interface PaymentProvider {
  createDepositIntent(input: CreateDepositInput): Promise<CreateDepositResult>;
  verifyWebhook(input: VerifyWebhookInput): Promise<VerifyWebhookResult>;
  getPaymentStatus(input: PaymentStatusInput): Promise<PaymentStatusResult>;
}
```

MVP يستخدم `ManualPaymentProvider`.

### VirusScanProvider

```ts
interface VirusScanProvider {
  scanObject(input: ScanObjectInput): Promise<ScanObjectResult>;
}
```

MVP يمكن أن يستخدم provider يدوي أو mock مع وسم الملفات كـpending scan عند الحاجة.

## 8. Background Jobs

ابدأ بـProvider abstraction:

```ts
interface JobQueue {
  enqueue<T>(name: string, payload: T, options?: JobOptions): Promise<void>;
}
```

MVP يمكن أن يستخدم synchronous/manual runner. لاحقاً يمكن استبداله بـBullMQ أو QStash أو Supabase Edge Functions حسب قرار النشر.

## 9. قرارات مهمة

- المال يخزن كـBIGINT بوحدات العملة الصغرى أو كـIQD integer.
- لا تستخدم JavaScript floating point للأرصدة.
- كل عملية مالية داخل transaction.
- العمليات المالية تستخدم idempotency key.
- Metrics snapshots لا تعدل؛ يضاف snapshot جديد.
- Campaign terms تنسخ وقت الانضمام.
- صلاحيات السيرفر إلزامية لكل endpoint.

## 10. ملاحظات النشر

النشر الإنتاجي غير مشمول حتى تكتمل مرحلة staging وقراءة قانونية ومحاسبية خاصة بالمدفوعات في العراق. لا يتم ربط دفع حقيقي دون موافقة صريحة.
