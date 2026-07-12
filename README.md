# خلّيها ترند

منصة عراقية تابعة إلى SA Studio تربط العلامات التجارية والتجار بصناع المحتوى. تنشئ العلامة التجارية حملة ممولة، وينضم صانع المحتوى للحملة، وينشر الفيديو على منصاته الخارجية، ثم يرسل الرابط إلى المنصة لمراجعته واحتساب المشاهدات المؤهلة والأرباح.

## الحالة الحالية

المراحل 1 إلى 12 مكتملة. المرحلة 13 (Staging والنشر) جزئية عمداً: كل ما يمكن تجهيزه محلياً بلا استضافة فعلية جاهز (CI/CD كامل، migrations، تقرير جاهزية إنتاج)، والنشر الفعلي مؤجّل لحين شراء اشتراك سيرفر (قرار صاحب المنتج). **المشروع ليس git repository بعد** — هذا العائق الأساسي أمام أي نشر حقيقي لاحقاً.

تم إنشاء تطبيق Next.js مع TypeScript strict وTailwind وPrisma schema، مصادقة كاملة بجلسات JWT، RBAC على مستوى السيرفر، واجهة عامة، ملفات شخصية، ربط حسابات اجتماعية عبر Manual Provider، حملات كاملة، انضمام وإرسالات، إحصائيات وأرباح، نظام مالي فعلي أولي، مكافحة احتيال ونزاعات بمراجعة بشرية، نظام إشعارات مع لوحات تحكم وتحليلات فعلية لكل دور، PWA أساسي (manifest، أيقونات، offline fallback للصفحات العامة) مع فحوصات جودة (accessibility QA آلية بـ axe-core، حالات فراغ/تحميل/خطأ موحّدة)، ومراجعة أمان واختبارات فعلية (مصفوفة صلاحيات كاملة، اختبارات IDOR، اختبارات سباق مالي حقيقية ضد قاعدة بيانات فعلية — كشفت وأصلحت ثغرة double-spend حقيقية في مسارات السحب وحجز الميزانية). التكاملات الحقيقية للدفع والسوشال ميديا لم تبدأ بعد.

## الوثائق

- [PRD](docs/PRD.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Database Design](docs/DATABASE.md)
- [Business Rules](docs/BUSINESS_RULES.md)
- [API Structure](docs/API.md)
- [Security](docs/SECURITY.md)
- [Threat Model](docs/THREAT_MODEL.md)
- [Roadmap](docs/ROADMAP.md)
- [Social Integrations](docs/SOCIAL_INTEGRATIONS.md)
- [Payment Integrations](docs/PAYMENT_INTEGRATIONS.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Mobile Roadmap](docs/MOBILE_ROADMAP.md)
- [Changelog](docs/CHANGELOG.md)
- [Brand Guidelines](khalliha_trend_brand_identity/BRAND_GUIDELINES.md)

## الألوان الرسمية

الألوان الأساسية الوحيدة:

- `#D6F61D`
- `#062619`
- `#E7EDE9`

يمكن استخدام التدرجات المعرفة في:

- `khalliha_trend_brand_identity/design-tokens.json`
- `khalliha_trend_brand_identity/theme.css`

لا تستخدم ألواناً خارج هذه الألوان وتدرجاتها.

## التقنية الحالية

- Next.js App Router.
- TypeScript strict.
- PostgreSQL.
- Prisma ORM.
- Supabase.
- Tailwind CSS.
- Zod.
- React Hook Form.
- Vitest.
- Playwright.
- pnpm.

## أوامر التشغيل والتحقق

```bash
pnpm install
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm prisma:validate
pnpm prisma:seed
```

التطبيق المحلي يعمل افتراضياً على:

```text
http://localhost:3000
```

## قواعد مهمة

- لا تنفذ تكامل دفع حقيقي دون وثائق رسمية وCredentials وSandbox وموافقة صريحة.
- لا تستخدم scraping أو APIs غير رسمية لمنصات التواصل.
- لا تضع أسراراً أو بيانات حقيقية في المستودع.
- لا تدع أن ميزة تعمل إذا كانت mock أو manual provider.
- كل العمليات المالية يجب أن تمر عبر Ledger وAudit Log.
- كل الصلاحيات يجب أن تطبق على السيرفر.

## ما تم تنفيذه في المرحلة 1

- إنشاء Next.js App Router.
- إعداد TypeScript strict.
- إعداد Tailwind وربط design tokens.
- صفحة رئيسية RTL أولية.
- API health/readiness تحت `/api/v1`.
- Prisma schema مبدئي.
- Prisma client generation.
- Environment validation.
- Vitest unit tests.
- Playwright E2E tests.
- ESLint وPrettier.
- GitHub Actions CI مبدئي.

## ما تم تنفيذه في المرحلة 2

- تسجيل وتسجيل دخول وتسجيل خروج عبر `/api/v1/auth/*`.
- جلسات JWT (HS256) بكوكي httpOnly.
- اختيار الدور (Creator/Brand) عند التسجيل؛ Super Admin لا ينشأ من التسجيل العام.
- RBAC على مستوى السيرفر عبر `src/middleware.ts` وحماية مسارات `/creator`، `/brand`، `/admin` وما يقابلها تحت `/api/v1`.
- لوحات تحكم أولية لكل دور (Creator، Brand، Admin).
- `prisma/seed.ts` لإنشاء Super Admin أولي عبر متغيرات بيئة.
- اختبارات وحدة وتكامل لـ JWT وRBAC وmiddleware وAuthService.

## ما تم تنفيذه في المرحلة 3

- تنقل متجاوب (Navbar + Footer) بقائمة موبايل قابلة للطي.
- صفحة Discover campaigns (`/campaigns`) مع فلترة حسب المنصة وحالات فارغة/خطأ حقيقية.
- صفحة تفاصيل الحملة (`/campaigns/[id]`).
- صفحات ثابتة: كيف تعمل المنصة، الشروط والأحكام، سياسة الخصوصية، سياسة الدفع.
- نقاط API عامة: `GET /api/v1/campaigns` و`GET /api/v1/campaigns/:id` بصيغة pagination/error موحدة.

## ما تم تنفيذه في المرحلة 4

- ملف صانع المحتوى (`/creator/profile`): تعديل النبذة والدولة والمحافظة.
- ربط الحسابات الاجتماعية يدوياً (`/api/v1/social-accounts`): إضافة/حذف، تطبيع اسم المستخدم، منع تكرار نفس الحساب بين مستخدمين.
- ملف العلامة التجارية (`/brand/profile`): تعديل الاسم والوصف، وطلب توثيق (`POST /api/v1/brand/verification`).
- لوحة مراجعة إدارية (`/admin/reviews`): اعتماد أو رفض طلبات توثيق العلامات التجارية والحسابات الاجتماعية.
- نماذج Prisma جديدة: `SocialAccount`، `BrandVerification`، بقيود uniqueness وaudit trail (`reviewedByUserId`, `reviewedAt`).
- قاعدة بيانات PostgreSQL محلية فعلية (Homebrew) مع migrations مطبّقة.

## ما تم تنفيذه في المرحلة 5

- نموذج إنشاء حملة للتاجر (`/brand/campaigns/new`): عنوان، ملخص، شروط تُحفظ لاحقاً كـTerms Snapshot، ميزانية، حد أدنى لـ Trust Score، أسعار منصات متعددة، أصول (روابط).
- الحملة تُحفظ كمسودة (DRAFT) قابلة للتعديل، ثم تُرسل للمراجعة (`POST /api/v1/brand/campaigns/:id/submit-review`).
- قائمة حملات التاجر (`/brand/campaigns`) وصفحة تفاصيل/تعديل لكل حملة.
- مراجعة إدارية للحملات ضمن `/admin/reviews`: اعتماد (يُفعّل الحملة فوراً أو يجدولها حسب تاريخ البدء)، طلب تعديلات، أو رفض.
- نماذج Prisma جديدة: `CampaignAsset`، وحقول `terms`، `minTrustScore`، `reviewNote` على `Campaign`.
- تحقق فعلي من طرف إلى طرف على قاعدة بيانات حقيقية: إنشاء حملة → إرسال للمراجعة → اعتماد → ظهورها في صفحة الاستكشاف العامة، مع تأكيد حماية IDOR (تاجر آخر لا يقدر يشوف حملة غيره).
- تصميم جديد لصفحة الاستكشاف (`/campaigns`) بكروت تتضمن صورة مصغّرة (أو تدرج بديل بألوان الهوية)، فئة الحملة، علامة توثيق العلامة التجارية، سعر لكل 1000 مشاهدة، شريط تقدم الميزانية، وقسم "الحملات المميزة"، مع فلاتر بحث/فئة/منصة.
- حقلا `category` (`CampaignCategory` enum) و`thumbnailUrl` جديدان على `Campaign`.

## ما تم تنفيذه في المرحلة 6

- الانضمام للحملات مع فحص الأهلية.
- التحقق من Trust Score والحساب الاجتماعي الموثق.
- إرسال روابط المنشورات الخارجية مع URL normalization واستخراج Platform Post ID.
- منع تكرار الرابط/المنشور.
- مراجعة إدارية للإرسالات: قبول، طلب تعديل، رفض مع سبب وملاحظة.

## ما تم تنفيذه في المرحلة 7

- `MetricsSnapshot` للإحصائيات غير القابلة للتعديل.
- إدخال مشاهدات يدوي من الإدارة.
- فصل observed views وqualified views وdisqualified views.
- محرك احتساب أرباح delta حسب CPM.
- تطبيق سقف أرباح المنشور وسقف ميزانية الحملة.
- حالات أرباح: pending/held/available/paid/reversed.
- لوحة أرباح صانع المحتوى.

## ما تم تنفيذه في المرحلة 8

- Ledger double-entry عبر `FinancialAccount` و`LedgerTransaction` و`LedgerEntry`.
- محافظ لكل مستخدم وعملة.
- إيداعات يدوية للتاجر مع مراجعة إدارية واعتماد/رفض.
- حجز ميزانية الحملة من محفظة التاجر عند اعتماد الحملة.
- تحرير الأرباح المستحقة إلى محفظة صانع المحتوى بعد فترة الحجز.
- طلبات سحب يدوية لصانع المحتوى مع حجز مبلغ السحب فور إنشاء الطلب.
- اعتماد السحب يسوي المبلغ من حساب السحوبات المعلقة إلى أصول المنصة.
- رفض السحب يرجع المبلغ المحجوز إلى محفظة الصانع.
- Reversal للقيود المالية دون حذف Ledger entries.
- API لقراءة المحفظة والحركات عبر `/api/v1/wallet`.

## ما تم تنفيذه في المرحلة 9

- نماذج `FraudSignal` و`FraudAssessment` لإشارات الاحتيال وتقييم المخاطر.
- قواعد MVP مبدئية لاكتشاف قفزات المشاهدات ونسبة المشاهدات المستبعدة العالية.
- قائمة مراجعة إدارية للاحتيال عبر `/admin/fraud`.
- API لإضافة إشارة احتيال يدوية وحسم الحالة: إزالة الاشتباه أو تأكيد الاحتيال.
- `TrustScoreEvent` لتسجيل كل تعديل على Trust Score.
- نظام نزاعات `Dispute` و`DisputeMessage`.
- فتح نزاع من صانع المحتوى أو العلامة المالكة للإرسال فقط.
- ردود على النزاع مع فحص الصلاحية.
- صفحة إدارة النزاعات عبر `/admin/disputes`.
- حل النزاع لصالح الصانع أو العلامة أو حل جزئي أو إغلاق، مع أثر على Trust Score عند الحاجة.

## ما تم تنفيذه في المرحلة 10

- نموذج `Notification` ونظام إشعارات كامل (`NotificationService`) تحت `/api/v1/notifications`.
- ربط الإشعارات بالأحداث الفعلية: اعتماد/رفض/طلب تعديل حملة، مراجعة إرسال، اعتماد/رفض إيداع أو سحب، حل نزاع.
- مكوّن جرس إشعارات بعداد غير مقروء وقائمة منسدلة في لوحات Creator وBrand وAdmin.
- لوحة تحكم الإدارة بأرقام حقيقية من قاعدة البيانات بدل الأصفار الوهمية: طوابير المراجعة والإيداعات والسحوبات والنزاعات، إضافة إلى نظرة عامة على المنصة (حملات نشطة، صناع محتوى، علامات تجارية، إجمالي المشاهدات المؤهلة).
- إجراءات إدارية سريعة تشير لصفحات فعلية فقط (`/admin/reviews`، `/admin/fraud`، `/admin/disputes`).
- تحليلات لوحة صانع المحتوى: رسم بياني للأرباح اليومية آخر 30 يوم وتوزيع حالات الإرسالات.
- تحليلات لوحة التاجر: رسم بياني للمشاهدات المؤهلة اليومية آخر 30 يوم وجدول أداء لكل حملة (مشاهدات مؤهلة وإنفاق).

## ما تم تنفيذه في المرحلة 11

- PWA manifest (`src/app/manifest.ts`) بالألوان الرسمية، مع أيقونات 192/512 وأيقونة maskable بخلفية Forest وsafe-zone صحيحة، وaيقونات favicon/apple-touch-icon.
- Offline fallback يدوي (`public/sw.js`) مقصور صراحة على الصفحات العامة تحت `(marketing)` عبر allowlist بالمسار — لا يلمس أي طلب `/api/**` أو أي لوحة تحكم؛ صفحة `/offline` مخصصة.
- شبكة أمان دفاعية: `not-found.tsx` وَ`global-error.tsx` جذريان، وَ`error.tsx`/`loading.tsx` لكل مجموعة مسارات (admin/brand/creator/marketing).
- تعميم نمط "تعذّر الاتصال" الموجود مسبقاً على لوحات التحكم الرئيسية (admin/brand/creator dashboard) التي كانت بلا معالجة أخطاء صريحة.
- Accessibility QA: skip-to-content link، تنقّل لوحة مفاتيح كامل للقوائم المنسدلة (`Dropdown`, `NotificationBell`) مع إعادة تركيز، `role="alert"` وربط `aria-describedby` لكل بانرات ورسائل أخطاء النماذج، إصلاح landmark `<main>` المفقود على صفحات التسويق العامة، `eslint-plugin-jsx-a11y` (~40 قاعدة آلية)، واختبارات `@axe-core/playwright` آلية (`e2e/accessibility.spec.ts`).
- Performance QA: استبدال خلفيات CSS لصور الحملات بعناصر `<img loading="lazy">` حقيقية (بدون `next/image` لأن رابط الصورة خارجي غير مقيّد بنطاق)، تحقق Lighthouse CLI (أداء/accessibility/best-practices/seo).
- اختبارات Playwright جديدة: `e2e/accessibility.spec.ts`، `e2e/offline.spec.ts`، `e2e/manifest.spec.ts`.

## ما تم تنفيذه في المرحلة 12

- **إصلاح ثغرة سباق مالي حقيقية (double-spend)**: `requestPayout`، `reserveCampaignBudget`، وَ`releaseAvailableEarnings` كانت تفحص الرصيد ثم تخصمه بلا قفل صف، ما يسمح لطلبين متزامنين بتجاوز الرصيد الفعلي معاً. تم إصلاحها بـ `LedgerEngine.lockFinancialAccount` (`SELECT ... FOR UPDATE`)، وأُثبتت الثغرة والإصلاح باختبار حقيقي ضد قاعدة بيانات فعلية (`src/modules/financial/concurrency.test.ts`).
- مصفوفة صلاحيات كاملة (`src/lib/permissions/rbac.test.ts`): كل الأدوار × كل الصلاحيات المعرّفة، بدل عينات محدودة.
- اختبارات IDOR e2e جديدة (`e2e/permission-boundaries.spec.ts`) تتحقق من رفض كل دور للـ APIs غير المخصصة له عبر الـ pipeline الفعلي.
- تحقق threat model موثّق في `docs/THREAT_MODEL.md` §8 (ما تم التحقق منه، وما هي الفجوات المتبقية بصراحة: لا `AuditLog` فعلي، لا rate limiting، لا CSP/security headers).
- `pnpm audit` أصبح نظيفاً (ثغرتان متوسطتان transitive تم تثبيتهما عبر `pnpm.overrides`).

## ما تم تنفيذه في المرحلة 13 (جزئياً - بانتظار شراء استضافة)

- إصلاح `pnpm format:check` لكامل المشروع (53 ملف كانت تفشل من قبل، كانت ستُفشل أول خطوة CI).
- `.github/workflows/ci.yml` أصبح خط أنابيب فعلي كامل: Postgres service حقيقي، `prisma migrate deploy`، format/lint/typecheck، unit+integration tests (بما فيها اختبار السباق المالي ضد قاعدة بيانات فعلية)، build، E2E كامل، dependency audit — تم تشغيله محلياً بمحاكاة كاملة والتأكد من نجاح كل خطوة.
- إصلاح ثغرة تطابق `AUTH_SECRET` كانت موجودة مسبقاً في `e2e/auth.spec.ts` (رموز JWT موقّعة بسر ثابت لا يطابق سر السيرفر الفعلي عند ضبط `AUTH_SECRET`)، واستخراج حل مشترك (`e2e/helpers/auth-secret.ts`).
- إصلاح اختباري تسجيل الدخول الحقيقيين في `auth.spec.ts` (كانا يعتمدان على mock شبكي فقط بينما لوحة التحكم Server Component تقرأ من قاعدة بيانات حقيقية) — أصبحا ينشئان بيانات اختبار حقيقية وينظفانها، مع تنظيف صحيح لصفوف Wallet/FinancialAccount الجانبية التي ينشئها تحميل لوحة التحكم.
- `prisma migrate status` تؤكد: لا drift، جاهزة للنشر.
- تقرير جاهزية إنتاج صريح في `docs/DEPLOYMENT.md` §8.

## المرحلة التالية

إكمال المرحلة 13 (استضافة فعلية) بعد شراء اشتراك سيرفر — يبدأ بتهيئة git repository.
