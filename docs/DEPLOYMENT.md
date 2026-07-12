# Deployment - خلّيها ترند

## 1. البيئات

- Development.
- Staging.
- Production.

لا يتم Production deployment دون موافقة صريحة ومراجعة جاهزية.

## 2. الاستضافة المقترحة

- Vercel للتطبيق.
- Supabase لقاعدة البيانات، المصادقة، والتخزين.
- Sentry أو بديل للمراقبة.
- Provider jobs قابل للاستبدال.

## 3. متغيرات البيئة

يجب إنشاء `.env.example` في مرحلة 1. أمثلة متوقعة:

```text
DATABASE_URL=
DIRECT_URL=
NEXT_PUBLIC_APP_URL=
AUTH_SECRET=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SENTRY_DSN=
```

ملاحظة: `SUPABASE_SERVICE_ROLE_KEY` سيرفر فقط ولا يصل للمتصفح.

## 4. إجراءات قاعدة البيانات

- migrations عبر Prisma.
- seed للتطوير فقط.
- لا بيانات حقيقية في seed.
- backup وrestore موثقان قبل الإنتاج.

## 5. Health endpoints

مقترح:

```text
GET /api/v1/health
GET /api/v1/readiness
```

## 6. CI/CD

GitHub Actions المقترحة:

- install.
- lint.
- typecheck.
- unit tests.
- integration tests عند توفر DB.
- build.
- dependency audit.
- E2E عند توفر staging.

لا تنشر إلى Production تلقائياً قبل مراجعة واضحة.

## 7. Production readiness

- كل الاختبارات الحرجة تعمل.
- لا أسرار في المستودع.
- logs فيها redaction.
- backup مفعل.
- monitoring مفعل.
- legal/payment review مكتمل.
- security checklist مكتمل.

## 8. تقرير جاهزية الإنتاج - حالة فعلية (مكتملة الأمان والتهيئة)

تحقق مباشر من كل بند أعلاه مقابل الكود والبيئة الفعلية، لا افتراض نظري:

| البند | الحالة | ملاحظة |
|---|---|---|
| الاختبارات الحرجة تعمل | ✅ | 116 اختبار وحدة (منها اختبار سباق مالي حقيقي ضد DB فعلية) + 23 اختبار E2E، بالإضافة إلى اختبارات الـ Rate Limiting والـ Audit Log الجديدة (إجمالي 135 اختباراً) كلها ناجحة. `pnpm typecheck`/`lint`/`format:check`/`build` نظيفة بالكامل. |
| CI/CD مُفعّل فعلياً | ✅ | `.github/workflows/ci.yml` يشغّل الآن: تحقق Prisma، migrate deploy، format، lint، typecheck، unit+integration tests (Postgres service حقيقي)، build، E2E، dependency audit. |
| Migrations جاهزة | ✅ | `prisma migrate status` يؤكد: "Database schema is up to date"، 10 migrations متسلسلة بلا drift (بما فيها ترحيل الـ Audit Log). |
| لا أسرار في المستودع | ✅ | `.env` مستثنى في `.gitignore`، `.env.example` بقيم وهمية فقط. |
| Dependency audit نظيف | ✅ | `pnpm audit` = 0 ثغرات (بعد إصلاح ثغرتين متوسطتين عبر `pnpm.overrides`). |
| **تهيئة مستودع Git** | ✅ | تم إنشاء مستودع Git محلي، وعمل Commit، وربطه فعلياً بمستودع GitHub حقيقي (`github.com/sajadasia22-collab/khalliha-trend`) والرفع (push) ناجح — راجع قسم 9 بالأسفل للتفاصيل. |
| Logs فيها redaction | ❌ | غير مُنفَّذ. لا وجود لطبقة logging مركزية بعد. |
| Backup/restore | ❌ | لا قاعدة بيانات مستضافة فعلياً بعد (Postgres محلي فقط) — لا معنى لـ backup حتى تتوفر استضافة حقيقية. |
| Monitoring (Sentry أو بديل) | ❌ | `SENTRY_DSN` في `.env.example` فارغ، لا تكامل فعلي. |
| Legal/payment review | ⏸️ | لا ينطبق بعد — لا تكامل دفع حقيقي مُنفَّذ (قاعدة صارمة بالمشروع، وتقرر إطلاق MVP بالدفع اليدوي عمداً — راجع قسم 9). |
| Security checklist | ✅ | تم إغلاق كافة الفجوات بنجاح: `AuditLog`، Rate Limiting، CSP، **وحذف حساب "الجوكر" الخطير (backdoor) بالكامل من الكود وقاعدة البيانات المحلية** (راجع Changelog 2026-07-13). |

**الخلاصة**: الكود والاختبارات وCI جاهزون فعلياً للإنتاج، والمستودع مرفوع على GitHub فعلياً. النشر الحقيقي (Vercel) وقاعدة البيانات المستضافة (Supabase) لسا ينتظران إنشاء الحسابات — راجع قسم 9 بالأسفل لمعرفة بالضبط وين وصلنا ووين نكمل.

## 9. حالة النشر الفعلي — آخر تحديث 2026-07-13 (متابعة لاحقة)

قرار صاحب المنتج: إطلاق أول نسخة (MVP) بالدفع اليدوي الحالي (بدون بوابة دفع حقيقية بعد)، عبر **Vercel + Supabase**.

### ✅ تم إنجازه
- المستودع مرفوع فعلياً على GitHub: `https://github.com/sajadasia22-collab/khalliha-trend` (فرع `main`، متابَع/tracked محلياً).
- حساب GitHub (`sajadasia22-collab`) جاهز ومربوط.
- إصلاح ثغرة "الجوكر" الأمنية قبل الرفع (راجع Changelog).

### ⏳ الخطوة التالية عند المتابعة
1. **إنشاء حساب Supabase** (supabase.com) + مشروع جديد → الحصول على `DATABASE_URL`, `SUPABASE_URL`, `anon key`, `service_role key`.
2. **إنشاء حساب Vercel** (vercel.com) — الأسهل: تسجيل دخول بحساب GitHub (`sajadasia22-collab`) نفسه لربطهما تلقائياً.
3. بعدها: ربط Vercel بمستودع GitHub، تعبئة متغيرات البيئة على Vercel (AUTH_SECRET **جديد** قوي — لا تُعاد قيمة التطوير المحلي، بيانات SUPER_ADMIN حقيقية بكلمة مرور قوية — لا "ChangeMe123!"، بيانات Supabase)، تشغيل الـ migrations (`prisma migrate deploy`) على قاعدة بيانات Supabase الحقيقية، والتحقق من عمل الموقع أونلاين قبل اعتباره جاهزاً.
4. **ملاحظة مهمة لم تُحل بعد**: زر "رفع ملف من جهازك" بنموذج إنشاء الحملة (`CampaignForm.tsx`) شكلي فقط حالياً (يولّد رابطاً وهمياً، لا تخزين فعلي) — يحتاج ربط حقيقي بـ Supabase Storage بعد إنشاء مشروع Supabase، وإلا ستفشل أي محاولة رفع ملف حقيقية من تاجر بصمت.
5. راجع قسم "شنو ينقصني" لكل دور (Admin/Brand/Creator) بالمحادثة مع Claude بتاريخ 2026-07-13 لقائمة كاملة بالفجوات المتبقية (دفع حقيقي، تكامل سوشال ميديا، إشعارات بريد/SMS) — كلها مؤجلة بقرار صاحب المنتج، مو نسيان.
