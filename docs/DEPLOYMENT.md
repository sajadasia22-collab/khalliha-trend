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
RESEND_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

ملاحظة: `SUPABASE_SERVICE_ROLE_KEY` سيرفر فقط ولا يصل للمتصفح.

رفع صورة وغلاف صانع المحتوى يستخدم Supabase Storage عبر السيرفر. ينشئ التطبيق bucket
عاماً باسم `profile-images` عند أول رفع مع MIME allowlist وحد 5MB. يجب أن تكون
`SUPABASE_URL` و`SUPABASE_SERVICE_ROLE_KEY` معرفتين في بيئة Vercel قبل تفعيل الميزة؛
الصور عامة لأن صفحة الملف نفسها عامة، بينما مفتاح service role لا يُرسل للمتصفح.
ملاحظة: `RESEND_API_KEY` مطلوب لإرسال رسائل استعادة كلمة المرور فعلياً على الإنتاج (بدونه محلياً فقط، الرابط يُطبع بالـ console بدل الإرسال الحقيقي — راجع Changelog 2026-07-13).

### إعداد Google OAuth

1. أنشئ OAuth Client من نوع **Web application** في Google Cloud Console.
2. أضف Redirect URIs التالية بالضبط:
   - `http://localhost:3000/api/v1/auth/google/callback`
   - `https://khalliha-trend.vercel.app/api/v1/auth/google/callback`
3. أضف `GOOGLE_CLIENT_ID` و`GOOGLE_CLIENT_SECRET` لبيئة Production في Vercel، ولا تضع القيم في Git.
4. الصلاحيات المطلوبة هي `openid email profile` فقط؛ لا يتم طلب Drive أو أي API إضافي.

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
| الاختبارات الحرجة تعمل | ✅ | 253 اختبار وحدة/تكامل ناجح + 35 اختبار E2E ناجح (يشمل الهاتف، الصلاحيات، الوصولية، وتصدير البيانات). `pnpm typecheck`/`lint`/`format:check`/`build` نظيفة بالكامل. |
| CI/CD مُفعّل فعلياً | ✅ | `.github/workflows/ci.yml` يشغّل الآن: تحقق Prisma، migrate deploy، format، lint، typecheck، unit+integration tests (Postgres service حقيقي)، build، E2E، dependency audit. |
| Migrations جاهزة | ✅ | `prisma migrate status` يؤكد: "Database schema is up to date"، 21 migration متسلسلة بلا drift، وآخرها مراسلة الحملات. |
| لا أسرار في المستودع | ✅ | `.env` مستثنى في `.gitignore`، `.env.example` بقيم وهمية فقط. |
| Dependency audit نظيف | ✅ | `pnpm audit` = 0 ثغرات (بعد إصلاح ثغرتين متوسطتين عبر `pnpm.overrides`). |
| **تهيئة مستودع Git** | ✅ | تم إنشاء مستودع Git محلي، وعمل Commit، وربطه فعلياً بمستودع GitHub حقيقي (`github.com/sajadasia22-collab/khalliha-trend`) والرفع (push) ناجح — راجع قسم 9 بالأسفل للتفاصيل. |
| Logs فيها redaction | ✅ | أخطاء السيرفر غير المعالجة تسجل بصيغة منظمة ومحدودة عبر `src/instrumentation.ts`، من دون access tokens أو أسرار. |
| Backup/restore | ✅ | Supabase قاعدة الإنتاج، و`scripts/backup-db.sh` مجرّب وموثق للاستعادة؛ النسخ التلقائية اليومية تعتمد على خطة Supabase. |
| Monitoring (Sentry أو بديل) | ✅ جزئياً | مراقبة JSON منظمة مفعلة؛ التنبيه الخارجي جاهز وينتظر ضبط `ERROR_ALERT_WEBHOOK_URL` يدوياً في Vercel. |
| Legal/payment review | ⏸️ | لا ينطبق بعد — لا تكامل دفع حقيقي مُنفَّذ (قاعدة صارمة بالمشروع، وتقرر إطلاق MVP بالدفع اليدوي عمداً — راجع قسم 9). |
| Security checklist | ✅ | تم إغلاق كافة الفجوات بنجاح: `AuditLog`، Rate Limiting، CSP، **وحذف حساب "الجوكر" الخطير (backdoor) بالكامل من الكود وقاعدة البيانات المحلية** (راجع Changelog 2026-07-13). |

**الخلاصة**: التطبيق منشور فعلياً على Vercel مع Supabase، وGitHub/Vercel CI/CD يعمل. كل إصدار جديد يطبّق migrations قبل البناء ويفشل بأمان عند أي مشكلة.

## 9. حالة النشر الفعلي — آخر تحديث 2026-07-15

قرار صاحب المنتج: إطلاق أول نسخة (MVP) بالدفع اليدوي الحالي (بدون بوابة دفع حقيقية بعد)، عبر **Vercel + Supabase**.

### ✅ الحالة الحالية
- المستودع مرفوع فعلياً على GitHub: `https://github.com/sajadasia22-collab/khalliha-trend` (فرع `main`، متابَع/tracked محلياً).
- Vercel مربوط بفرع `main` وينشر تلقائياً على `khalliha-trend.vercel.app`.
- قاعدة الإنتاج Supabase ومخزن صور الملفات المهنية مربوطان بمتغيرات Vercel.
- `vercel.json` يشغّل `prisma migrate deploy` قبل كل build.

### ⏳ المتبقي التشغيلي

1. ضبط `ERROR_ALERT_WEBHOOK_URL` في Vercel إذا أُريدت تنبيهات Slack/Discord الفورية.
2. زر "رفع ملف من جهازك" في نموذج الحملة ما زال غير مربوط بتخزين حقيقي؛ الروابط الخارجية Drive/Dropbox/OneDrive هي المسار الفعلي المعتمد حالياً.
3. التكاملات الحقيقية للدفع والسوشال تحتاج حسابات مزودين وCredentials وSandbox وموافقة منفصلة.

## 10. آلية رفع التعديلات المستقبلية (Git → Vercel)

المشروع مربوط: `GitHub (sajadasia22-collab/khalliha-trend)` ↔ `Vercel (sajad-asia/khalliha-trend)`. أي تعديل بالكود يتبع نفس المسار دائماً:

1. تعديل الكود محلياً.
2. Commit (بعد موافقة صاحب المشروع صراحة على كل commit).
3. Push لفرع `main` على GitHub (بعد موافقة صريحة أيضاً — خطوة تؤثر على مستودع مشترك).
4. Vercel ينشر تلقائياً فور وصول push جديد لـ `main` (Git Integration مفعّل)، بدون أي خطوة يدوية بلوحة التحكم.

لا يوجد نشر مباشر (`vercel --prod`) من جهاز التطوير — النشر دائماً عبر GitHub فقط، عشان يبقى تاريخ Git هو المرجع الوحيد لكل نسخة منشورة فعلياً.

### ترقيم الإصدارات

كل دفعة تعديلات تُنشر فعلياً على الإنتاج تاخذ **رقم إصدار تسلسلي** (v1, v2, v3...) + **اسم قصير** يلخّص أهم تغيير فيها، مسجّلة بأعلى [`CHANGELOG.md`](./CHANGELOG.md) بجدول "سجل الإصدارات". الهدف: أي نسخة حية على `khalliha-trend.vercel.app` تُعرف برقم واحد واضح بدل الرجوع لتاريخ commit.

## 11. المراقبة والتنبيهات (Monitoring)

مراقبة أخطاء السيرفر مبنية داخل المشروع بلا اعتماديات خارجية (على نهج المشروع في تجنب المكتبات غير الضرورية):

- **سجلات منظمة**: أي خطأ سيرفر غير معالج (صفحات، API routes) يلتقطه `src/instrumentation.ts` (خطاف `onRequestError` في Next.js) ويطبع سطر JSON بمفتاح ثابت `khalliha:server-error` يتضمن الرسالة والمسار وأول 8 أسطر من الـ stack. في Vercel: **Logs ← ابحث عن `khalliha:server-error`**.
- **تنبيهات فورية (اختيارية)**: عيّن متغير البيئة `ERROR_ALERT_WEBHOOK_URL` في Vercel برابط Incoming Webhook (يدعم Slack وDiscord معاً — الحمولة تتضمن `text` و`content`). عند أي خطأ يصل تنبيه فيه المسار والرسالة، مع كبح تلقائي (تنبيه واحد لكل رسالة خطأ في الدقيقة) حتى لا يغرق الـ webhook.
- **اختبار محلي**: المسار `GET /api/dev/boom` (معطّل في الإنتاج) يرمي خطأ عمداً للتأكد من عمل السلسلة كاملة.
- المنطق في `src/lib/error-alert.ts` مع اختبارات وحدة في `src/lib/error-alert.test.ts`؛ فشل إرسال التنبيه لا يؤثر على معالجة الطلب إطلاقاً.

`SENTRY_DSN` المذكور في `.env.example` محجوز لترقية مستقبلية اختيارية إلى Sentry؛ غير مستخدم حالياً.

## 12. النسخ الاحتياطي (Backup)

- **السكربت**: `./scripts/backup-db.sh` يأخذ نسخة `pg_dump` بصيغة custom مضغوطة إلى `backups/khalliha-<تاريخ>-<وقت>.dump`، يقرأ `DATABASE_URL` من `.env` تلقائياً أو من البيئة (مرر رابط قاعدة الإنتاج لأخذ نسخة منها). يحتفظ بآخر 14 نسخة افتراضياً (`BACKUP_RETENTION_COUNT` للتغيير).
- **الاستعادة**: `pg_restore --clean --if-exists -d "$DATABASE_URL" backups/<file>.dump`
- مجلد `backups/` مستثنى في `.gitignore` — النسخ تحتوي بيانات مستخدمين حساسة ولا تُرفع لأي مستودع أبداً. خزّنها في مكان آمن (قرص خارجي/تخزين سحابي خاص مشفّر).
- **الإيقاع المقترح**: نسخة يدوية قبل كل نشر يغيّر schema، ونسخة أسبوعية على الأقل في التشغيل الاعتيادي.
- **داخل Supabase**: لوحة Supabase توفر نسخاً يومية تلقائية في الخطط المدفوعة (Pro)؛ الخطة المجانية بلا نسخ تلقائية — لذلك السكربت أعلاه هو خط الدفاع الأساسي حالياً.
