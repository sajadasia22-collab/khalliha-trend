# Threat Model - خلّيها ترند

## 1. الأصول الحساسة

- حسابات المستخدمين والجلسات.
- بيانات الحسابات الاجتماعية.
- ملفات الحملات.
- روابط الفيديوهات وmetrics.
- المحافظ والأرصدة وLedger.
- وسائل السحب.
- صلاحيات المشرفين.
- Audit logs.
- أسرار التكاملات الخارجية.

## 2. الجهات المهددة

- مستخدم يحاول الوصول لبيانات غيره.
- صانع محتوى يحاول تضخيم المشاهدات أو الأرباح.
- علامة تجارية تحاول رفض فيديوهات بشكل غير عادل.
- مشرف داخلي يسيء استخدام الصلاحيات.
- مهاجم خارجي يستهدف الحسابات أو الملفات أو API.
- بوتات تحاول brute force أو spam.

## 3. التهديدات والمعالجات

| التهديد | الخطر | المعالجة |
|---|---|---|
| Account takeover | سرقة الحساب | Rate limits، sessions آمنة، تسجيل محاولات مشبوهة |
| Broken access control | وصول غير مصرح | Authorization server-side، اختبارات permission matrix |
| IDOR | قراءة/تعديل موارد غير مملوكة | فحص ownership لكل endpoint |
| SQL injection | اختراق قاعدة البيانات | Prisma، Zod، عدم استخدام raw SQL إلا بحذر |
| XSS | تنفيذ سكربتات | escaping، sanitization، CSP |
| CSRF | تنفيذ طلبات بجلسة المستخدم | SameSite/CSRF strategy |
| SSRF | استدعاء داخلي عبر URL | allowlists، منع private IP ranges |
| Malicious upload | رفع ملف ضار | validation، size limits، virus scan provider |
| Token leakage | تسريب tokens | encryption، redaction، منع logs |
| Financial race condition | overspending | transactions، atomic updates، idempotency |
| Double payout | دفع متكرر | unique idempotency، status transitions |
| Fake metrics | أرباح غير مستحقة | snapshots، manual review، fraud signals |
| Duplicate submissions | تكرار الرابط | unique platform post id |
| Admin abuse | تلاعب داخلي | Audit log، reasons، Maker-Checker مستقبلاً |

## 4. سيناريوهات مالية حرجة

### تجاوز ميزانية الحملة

المعالجة:

- اقفل campaign budget row أو استخدم atomic update.
- احسب payable داخل transaction.
- حدث الحالة إلى BUDGET_EXHAUSTED عند الحاجة.
- سجل ledger transaction واحدة لكل accrual.

### دفع طلب سحب مرتين

المعالجة:

- `PayoutRequest.idempotencyKey` unique.
- status transition من APPROVED إلى PROCESSING إلى PAID داخل transaction.
- لا يمكن إعادة معالجة PAID.

### احتساب المشاهدات مرتين

المعالجة:

- لا تعدل snapshots.
- خزّن آخر qualified views محتسبة.
- احسب delta فقط.
- اربط EarningAccrual بـMetricsSnapshot.

## 5. سيناريوهات صلاحيات حرجة

### صانع محتوى يحاول تعديل campaign metrics

المعالجة:

- endpoint metrics admin-only.
- لا توجد حقول metrics النهائية في APIs الخاصة بصانع المحتوى.
- Audit log لكل إدخال يدوي.

### تاجر يحاول الوصول لحملة علامة أخرى

المعالجة:

- فحص BrandMember وbrandId لكل brand endpoint.
- اختبارات IDOR.

### مستخدم يحاول قراءة محفظة غيره

المعالجة:

- wallet endpoints تعتمد user session فقط.
- لا تقبل `userId` من client لقراءة wallet.

## 6. Residual risks

- تكاملات social APIs تحتاج مراجعة شروط كل منصة.
- الدفع الحقيقي يحتاج مراجعة قانونية ومحاسبية.
- fraud rules المبدئية لا تكفي وحدها للقرارات النهائية.
- الحسابات الاجتماعية العامة قد تغير privacy أو تحذف المنشور بعد الموافقة.

## 7. اختبارات أمنية مطلوبة

- Permission matrix tests.
- IDOR tests لكل resource.
- Financial concurrency tests.
- Upload validation tests.
- Duplicate URL tests.
- Idempotency tests.
- Admin audit log tests.

## 8. حالة التحقق - المرحلة 12

تحقق فعلي من الكود مقابل هذا المستند (وليس توثيقاً نظرياً فقط):

**تم التحقق والتغطية:**

- **Permission matrix**: `src/lib/permissions/rbac.test.ts` يفحص الآن مصفوفة كاملة (كل الأدوار × كل الصلاحيات المعرّفة)، وليس عينات فقط. يتأكد أيضاً أن SUPER_ADMIN فقط يملك `system:manage-admins` وأن لا دور آخر يكتسبه.
- **IDOR**: تحقّق يدوي من كل نقاط الوصول الحساسة (`/api/v1/wallet`, `/api/v1/brand/campaigns/[id]`, خدمات brand/submissions/disputes/social-accounts) — جميعها تشتق `userId` من الجلسة الموقّعة (JWT) على السيرفر حصراً، ولا تقبل `userId`/`brandId` من مدخلات العميل. `campaigns/service.test.ts`، `disputes/service.test.ts`، `social-accounts/service.test.ts` تحتوي اختبارات IDOR صريحة ("refuses/blocks ... owned by another").
- **إبطال الحساب الموقوف**: كل APIs المحمية القديمة والحديثة تعيد الآن قراءة المستخدم من قاعدة البيانات عبر `requireApiUser`/`getCurrentUser` قبل التنفيذ، فلا يبقى JWT صالح شكلياً كافياً بعد تحويل الحالة إلى `SUSPENDED` أو `BANNED`. يغطي `permission-boundaries.spec.ts` هذا الحد بطلب HTTP حقيقي لمسار إداري قديم.
- **Financial concurrency — ثغرة حقيقية اكتُشفت وأُصلحت**: `getAccountBalanceWithClient` يحسب الرصيد بجمع قيود Ledger عند كل استدعاء (بلا قفل صف)، وكان التحقق من الرصيد قبل الخصم في `requestPayout`، `reserveCampaignBudget`، وَ`releaseAvailableEarnings` عرضة لـ TOCTOU race: طلبان متزامنان يقرآن نفس الرصيد قبل التزام أي منهما، فيتجاوز المجموع الرصيد الفعلي (double-spend). تم إصلاحه بإضافة `LedgerEngine.lockFinancialAccount` (قفل صف Postgres عبر `SELECT ... FOR UPDATE`) يُستدعى داخل نفس المعاملة قبل أي فحص رصيد. تم إثبات الثغرة تجريبياً (إزالة القفل مؤقتاً أعادت إنتاج double-spend في 2 من 3 محاولات) والإصلاح (`src/modules/financial/concurrency.test.ts`، اختبار حقيقي ضد قاعدة بيانات فعلية، يتخطى تلقائياً بدون `DATABASE_URL`).
- **Idempotency**: مغطاة في `ledger.test.ts` (تكرار `idempotencyKey` يُرجع نفس المعاملة بدل تكرارها) ومُعزَّزة بالإصلاح أعلاه.
- **Duplicate URL**: مغطاة في `submissions/service.test.ts` ("should fail if the post URL has been submitted before") وَ`post-url.test.ts`.
- **Dependency audit**: `pnpm audit` كشف ثغرتين متوسطتين (`postcss` عبر `next`، `@hono/node-server` عبر `prisma`) — كلاهما أدوات وقت-تطوير/بناء وليست في الحزمة المرسلة للمتصفح. تم تثبيتهما عبر `pnpm.overrides` في `package.json`. `pnpm audit` الآن نظيف (0 ثغرات).

**الفجوات التي أُغلقت بنجاح (بعد المرحلة 12 ومراجعة الجاهزية):**

- **نموذج وسجل التدقيق `AuditLog`**: تم تفعيله بالكامل وإنشاء الجدول في قاعدة البيانات مع خدمة `AuditLogService` لتسجيل كافة العمليات المالية والإدارية الحساسة، مع كتابة اختبارات وحدة له في `src/modules/audit-log/service.test.ts`.
- **محدد التردد `Rate Limiting`**: تم بناء آلية Sliding Window Counters وتفعيلها في Middleware لتشمل مسارات الدخول والتسجيل والطلبات المالية، مع كتابة اختبارات في `src/lib/rate-limit.test.ts`.
- **ترويسات الأمان والـ CSP**: تم إضافتها وتوثيقها بالكامل في `next.config.ts` لحماية الجلسات والبيانات من هجمات الويب المختلفة.

**فجوات حقيقية متبقية:**

- **Upload validation tests**: أصبح البند منطبقاً مع ميزة أدلة النزاعات (2026-07-15) وأُغلق في نفس التسليم: التحقق من النوع عبر التوقيع الثنائي (magic bytes) وليس الامتداد، حد حجم 2MB وحد 10 مرفقات لكل نزاع، تنظيف أسماء الملفات، تصريح تنزيل مقصور على أطراف النزاع والمدراء، و`X-Content-Type-Options: nosniff` عند التقديم — مع اختبارات وحدة في `src/lib/uploads.test.ts` واختبارات صلاحيات في `src/modules/disputes/service.test.ts`.
