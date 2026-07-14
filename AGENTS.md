# AGENTS.md - خلّيها ترند

## وصف المنصة

«خلّيها ترند» منصة عراقية تابعة إلى SA Studio تربط العلامات التجارية والتجار بصناع المحتوى. المنصة لا تستضيف الفيديوهات كشبكة اجتماعية؛ هي تدير الحملات، الملفات، الروابط، المراجعات، المشاهدات المؤهلة، الأرباح، المحافظ، السحوبات، النزاعات، ومكافحة الاحتيال.

## حالة المشروع

المرحلة الحالية: المراحل 0–13 مكتملة والمنصة منشورة على Vercel، والمرحلة 14 (الهوية المهنية والمجتمع) قيد التنفيذ.

المراحل 0 إلى 13 مكتملة حسب [ROADMAP.md](docs/ROADMAP.md). توجد قاعدة PostgreSQL محلية وقاعدة إنتاج Supabase، والمشروع Git repository مربوط بـGitHub.

**تنبيه أمني مهم من المرحلة 12**: تم اكتشاف وإصلاح ثغرة سباق مالي حقيقية (double-spend) في مسارات السحب وحجز ميزانية الحملة عبر `LedgerEngine.lockFinancialAccount`. الفجوات السابقة (`AuditLog` وrate limiting وCSP) أُغلقت لاحقاً؛ راجع `docs/THREAT_MODEL.md` §8.

**حالة النشر**: المنصة منشورة على `khalliha-trend.vercel.app` ومربوطة بـGitHub، و`.github/workflows/ci.yml` خط أنابيب فعلي. راجع `docs/DEPLOYMENT.md` §8–12.

## مصادر الحقيقة

- المنتج: [PRD.md](docs/PRD.md)
- المعمارية: [ARCHITECTURE.md](docs/ARCHITECTURE.md)
- قاعدة البيانات: [DATABASE.md](docs/DATABASE.md)
- قواعد العمل: [BUSINESS_RULES.md](docs/BUSINESS_RULES.md)
- الأمان: [SECURITY.md](docs/SECURITY.md)
- نموذج التهديد: [THREAT_MODEL.md](docs/THREAT_MODEL.md)
- API: [API.md](docs/API.md)
- الهوية: [BRAND_GUIDELINES.md](khalliha_trend_brand_identity/BRAND_GUIDELINES.md)

## قواعد الهوية

الألوان الأساسية الوحيدة:

- `#D6F61D`
- `#062619`
- `#E7EDE9`

استخدم فقط التدرجات الموجودة في:

- `khalliha_trend_brand_identity/design-tokens.json`
- `khalliha_trend_brand_identity/theme.css`

لا تستخدم ألواناً خارج هذه الألوان وتدرجاتها. لا تستخدم الأبيض الصافي أو الأسود الصافي داخل الواجهة.

## أوامر المشروع

قبل إنشاء التطبيق لا توجد أوامر تشغيل فعلية.

بعد المرحلة 1 يجب توفير:

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm prisma:validate
pnpm build
```

## قواعد البرمجة

- استخدم TypeScript strict.
- استخدم Zod للتحقق من المدخلات.
- لا تضع منطق الأعمال أو المال داخل مكونات الواجهة.
- طبّق الصلاحيات على السيرفر.
- استخدم REST API تحت `/api/v1`.
- استخدم stable error codes.
- اجعل الواجهة Arabic RTL أولاً، مع قابلية LTR لاحقاً.
- لا تستخدم نصوص Lorem Ipsum.

## قواعد قاعدة البيانات

- استخدم PostgreSQL وPrisma migrations.
- استخدم BIGINT للأموال والمشاهدات.
- لا تستخدم JavaScript floating point للأرصدة.
- استخدم transactions للعمليات المالية.
- استخدم idempotency keys.
- لا تعدل MetricsSnapshot قديم؛ أضف snapshot جديداً.
- لا تحذف Ledger entries؛ استخدم reversal.
- لا تستخدم JSON بدل العلاقات الأساسية.

## قواعد الأمان

- لا تضع أسراراً في المستودع.
- لا ترسل service role keys إلى المتصفح.
- لا تعرض access tokens أو بيانات سحب حساسة في logs.
- استخدم Audit Log للعمليات المالية والإدارية الحساسة.
- استخدم Rate limiting للعمليات الحساسة.
- تحقق من ownership لمنع IDOR.

## قواعد التكاملات الخارجية

- Social APIs تبدأ كـProvider Interfaces.
- MVP يستخدم ManualSocialMetricsProvider.
- الدفع يبدأ كـManualPaymentProvider.
- لا تنفذ ZainCash أو FastPay أو أي تكامل دفع حقيقي دون وثائق رسمية وCredentials وSandbox وموافقة صريحة.
- لا تستخدم scraping مخالف أو APIs غير رسمية.
- لا تعرض أي تكامل mock/manual على أنه مكتمل.

## الميزات المكتملة

- وثائق المرحلة 0.
- دليل الهوية بالألوان الرسمية الجديدة.
- Design tokens وCSS variables.
- تطبيق Next.js أولي.
- صفحة رئيسية RTL.
- API health/readiness.
- Prisma schema مبدئي.
- اختبارات وحدة وE2E مبدئية.
- CI مبدئي.
- تسجيل/دخول/خروج عبر `/api/v1/auth/*` مع جلسات JWT.
- RBAC على مستوى السيرفر عبر `src/middleware.ts` وحماية المسارات حسب الدور.
- لوحات تحكم أولية لـ Creator وBrand وAdmin.
- `prisma/seed.ts` لإنشاء Super Admin أولي (بدون بيانات حقيقية في الكود).
- اختبارات تكامل لحماية المسارات (`src/middleware.test.ts`).
- تنقل متجاوب (`Navbar`/`Footer`) وصفحة Discover campaigns وتفاصيل الحملة.
- صفحات ثابتة: كيف تعمل المنصة، الشروط، الخصوصية، سياسة الدفع.
- `GET /api/v1/campaigns` و`GET /api/v1/campaigns/:id` (عامة، حملات ACTIVE فقط).
- ملف صانع المحتوى (`/creator/profile`) وربط الحسابات الاجتماعية يدوياً (`SocialAccount` model، Manual Provider).
- ملف العلامة التجارية (`/brand/profile`) وسير عمل توثيق العلامة (`BrandVerification` model).
- لوحة مراجعة إدارية (`/admin/reviews`) لاعتماد/رفض توثيق العلامات والحسابات الاجتماعية.
- قاعدة بيانات PostgreSQL محلية فعلية (Homebrew) مع migrations مطبّقة عبر `prisma.config.ts`.
- نموذج إنشاء حملة للتاجر (`/brand/campaigns/new`) وقائمة حملاته وصفحة تعديل/تفاصيل لكل حملة.
- سير عمل الحملة الكامل: DRAFT → إرسال للمراجعة → مراجعة إدارية (اعتماد/طلب تعديلات/رفض) → ACTIVE أو SCHEDULED، مُتحقق منه فعلياً من طرف إلى طرف.
- `CampaignAsset` model، وحقول `terms`/`minTrustScore`/`reviewNote` على `Campaign`.
- حماية IDOR مُتحقق منها: تاجر لا يقدر يصل لحملة تاجر آخر.
- سير عمل الانضمام للحملات والتحقق من الأهلية (مستوى الثقة، وجود حساب موثق متوافق).
- إرسال روابط المنشورات الخارجية مع التحقق التلقائي من صحة الروابط وتوحيدها (URL normalization).
- منع تكرار إرسال الرابط نفسه لمنع الاحتيال.
- لوحة مراجعة المشرفين للمنشورات المرسلة (قبول / طلب تعديل / رفض مع تسجيل السبب والملاحظات).
- إضافة `MetricsSnapshot` و `EarningAccrual` و `EarningStatus` لقاعدة البيانات.
- محرك احتساب الأرباح للزيادات (Delta) مع تطبيق CPM وسقف الأرباح (Cap) وحجز ميزانية الحملة.
- مسار API واستعلام المحفظة والأرباح (متاح/معلق/مستلم) لصانع المحتوى.
- واجهة لوحة تحكم الأرباح التفصيلية لصانع المحتوى (`EarningSummary`).
- واجهة مراجعة المشرفين لتسجيل إحصائيات المشاهدات بنوافذ منبثقة تفاعلية.
- Ledger double-entry ومحافظ لكل مستخدم وعملة.
- إيداعات يدوية للتاجر مع مراجعة إدارية واعتماد/رفض.
- حجز ميزانية الحملة من محفظة التاجر عند اعتماد الحملة.
- تحرير الأرباح المستحقة إلى محفظة صانع المحتوى بعد فترة الحجز.
- دعم عمولة منصة اختيارية عبر `PLATFORM_COMMISSION_BPS`، والافتراضي صفر حتى اعتماد سياسة العمولة.
- طلبات سحب يدوية لصانع المحتوى مع حجز مبلغ السحب فور إنشاء الطلب.
- اعتماد السحب يسوي المبلغ من حساب السحوبات المعلقة إلى أصول المنصة.
- رفض السحب يرجع المبلغ المحجوز إلى محفظة الصانع.
- Reversal للقيود المالية دون حذف Ledger entries.
- API لقراءة المحفظة والحركات عبر `/api/v1/wallet`.
- Fraud Signals وFraud Assessment لإشارات الاحتيال وتقييم المخاطر.
- قواعد MVP لاكتشاف قفزات المشاهدات ونسبة الاستبعاد العالية.
- قائمة إدارية لمكافحة الاحتيال (`/admin/fraud`) مع إزالة/تأكيد الاشتباه.
- TrustScoreEvent لكل تعديل على Trust Score.
- نظام نزاعات ورسائل (`Dispute`/`DisputeMessage`) مع صفحة إدارة (`/admin/disputes`).
- فتح النزاع محصور بصاحب الإرسال أو العلامة المالكة، وحله إداري مع أثر اختياري على Trust Score.
- نموذج `Notification` ونظام إشعارات (`NotificationService`) عبر `/api/v1/notifications`، مربوط بأحداث الحملات والإرسالات والإيداعات والسحوبات والنزاعات.
- جرس إشعارات بعداد غير مقروء وقائمة منسدلة في لوحات Creator وBrand وAdmin.
- لوحة تحكم الإدارة بأرقام حقيقية (طوابير المراجعة، نظرة عامة على المنصة) بدل قيم وهمية، وإجراءات سريعة تشير لصفحات فعلية فقط.
- تحليلات لوحة صانع المحتوى (رسم بياني للأرباح اليومية، توزيع حالات الإرسالات) وتحليلات لوحة التاجر (رسم بياني للمشاهدات المؤهلة، جدول أداء الحملات).
- PWA manifest وأيقونات، وoffline fallback مقصور على الصفحات العامة (`public/sw.js` بـ allowlist صريح، لا يلمس `/api/**` أو أي لوحة تحكم).
- شبكة أمان `not-found.tsx`/`global-error.tsx`/`error.tsx`/`loading.tsx` لكل route group، وتعميم نمط "تعذّر الاتصال" على لوحات التحكم الرئيسية.
- Accessibility QA: تنقّل لوحة مفاتيح للقوائم المنسدلة، `role="alert"`/`aria-describedby` لأخطاء النماذج، `eslint-plugin-jsx-a11y`، واختبارات `@axe-core/playwright` آلية.
- إصلاح ثغرة سباق مالي حقيقية (double-spend) في `requestPayout`/`reserveCampaignBudget`/`releaseAvailableEarnings` عبر `LedgerEngine.lockFinancialAccount` (قفل صف Postgres)، مُثبتة باختبار حقيقي ضد قاعدة بيانات فعلية (`src/modules/financial/concurrency.test.ts`).
- مصفوفة صلاحيات كاملة (`rbac.test.ts`) واختبارات IDOR e2e (`e2e/permission-boundaries.spec.ts`) عبر الـ pipeline الفعلي.
- تحقق threat model موثّق في `docs/THREAT_MODEL.md` §8، وإصلاح ثغرتي dependency audit متوسطتين.
- `.github/workflows/ci.yml` أصبح خط أنابيب فعلي: Postgres service، `prisma migrate deploy`، format/lint/typecheck، unit+integration tests حقيقية، build، E2E، dependency audit.
- إصلاح `pnpm format:check` لكامل المشروع (53 ملف)، وإصلاح ثغرة تطابق `AUTH_SECRET` كانت موجودة مسبقاً في اختبارات e2e، وإصلاح اختباري تسجيل دخول حقيقيين كانا يعتمدان على mock فقط.
- ملف مهني مطور لصانع المحتوى: اسم مستخدم فريد، صورة وغلاف، اختصاصات، لغات، خصوصية وصفحة عامة، مع رفع آمن عبر Supabase Storage (المرحلة 14، الإصدار v3).
- معرض أعمال منظم مع صور وروابط رسمية وترتيب وحذف، ودليل بحث عام لصناع المحتوى بفلاتر الاختصاص والمنصة والمحافظة واللغة (المرحلة 14، الإصدار v3).
- نظام متابعة صناع المحتوى مع عدادات، منع متابعة النفس والتكرار، وقائمة المتابَعين داخل إعدادات الحساب (المرحلة 14، الإصدار v3).
- مجتمع نصوص وصور وروابط خارجية مع إعجاب وتعليقات وحفظ ومشاركة، خلاصات وبحث، حظر وكتم وبلاغات ولوحة إشراف إدارية؛ لا فيديو ولا تحقيق دخل اجتماعي (المرحلة 14، الإصدار v3).
- إشعارات المتابعة والتفاعل، اقتراح صناع محتوى، خصوصية المراسلة، وسجل جلسات مبني على عمليات الدخول الحقيقية.

## الميزات غير المكتملة

- التكاملات الحقيقية (دفع وسوشال ميديا).
- مراسلة مرتبطة بالحملات وبحث الرسائل (دفعة المرحلة 14 التالية؛ بحث المجتمع مكتمل).
- تفعيل `ERROR_ALERT_WEBHOOK_URL` يدوياً في Vercel للتنبيه الخارجي.

## المرحلة التالية

إكمال المرحلة 14: المراسلة المرتبطة بالحملة مع الحظر والإبلاغ وبحث الرسائل؛ المجتمع العام مكتمل.
