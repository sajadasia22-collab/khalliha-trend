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

## 8. تقرير جاهزية الإنتاج - حالة فعلية (بعد المرحلة 12)

تحقق مباشر من كل بند أعلاه مقابل الكود والبيئة الفعلية، لا افتراض نظري:

| البند | الحالة | ملاحظة |
|---|---|---|
| الاختبارات الحرجة تعمل | ✅ | 116 اختبار وحدة (منها اختبار سباق مالي حقيقي ضد DB فعلية) + 23 اختبار E2E، كلها ناجحة. `pnpm typecheck`/`lint`/`format:check`/`build` نظيفة. |
| CI/CD مُفعّل فعلياً | ✅ | `.github/workflows/ci.yml` يشغّل الآن: تحقق Prisma، migrate deploy، format، lint، typecheck، unit+integration tests (Postgres service حقيقي)، build، E2E، dependency audit. |
| Migrations جاهزة | ✅ | `prisma migrate status` يؤكد: "Database schema is up to date"، 9 migrations متسلسلة بلا drift. |
| لا أسرار في المستودع | ✅ | `.env` مستثنى في `.gitignore`، `.env.example` بقيم وهمية فقط. |
| Dependency audit نظيف | ✅ | `pnpm audit` = 0 ثغرات (بعد إصلاح ثغرتين متوسطتين عبر `pnpm.overrides`). |
| **المشروع ليس git repository** | ❌ **عائق أساسي** | لا يوجد `.git` إطلاقاً. أي نشر حقيقي (Vercel أو غيره) يحتاج مستودع Git فعلي كخطوة أولى قبل أي شيء آخر بهذا القسم. |
| Logs فيها redaction | ❌ | غير مُنفَّذ. لا وجود لطبقة logging مركزية بعد. |
| Backup/restore | ❌ | لا قاعدة بيانات مستضافة فعلياً بعد (Postgres محلي فقط) — لا معنى لـ backup حتى تتوفر استضافة حقيقية. |
| Monitoring (Sentry أو بديل) | ❌ | `SENTRY_DSN` في `.env.example` فارغ، لا تكامل فعلي. |
| Legal/payment review | ⏸️ | لا ينطبق بعد — لا تكامل دفع حقيقي مُنفَّذ (قاعدة صارمة بالمشروع). |
| Security checklist | ⚠️ جزئي | راجع `docs/THREAT_MODEL.md` §8: مصفوفة صلاحيات وIDOR وconcurrency مُغطّاة ومُختبرة، لكن لا `AuditLog` فعلي، لا rate limiting، لا CSP/security headers. |

**الخلاصة**: الكود والاختبارات وCI جاهزون فعلياً. العائق الحقيقي أمام أي نشر هو غياب مستودع Git واستضافة فعلية (قرار مؤجل عمداً من صاحب المنتج لحين شراء اشتراك سيرفر). بقية الفجوات (logging/monitoring/backup/AuditLog/rate limiting/CSP) تحتاج عملاً مخصصاً منفصلاً قبل الإنتاج الفعلي، وليست بنفس درجة إلحاح ثغرة السباق المالي التي أُصلحت بالمرحلة 12.
