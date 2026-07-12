# Roadmap - خلّيها ترند

## المرحلة 0: التخطيط والتوثيق

المخرجات:

- PRD.
- Architecture.
- Database design.
- Business rules.
- Security.
- Threat model.
- API structure.
- Social integrations plan.
- Payment integrations plan.
- Deployment plan.
- Mobile roadmap.
- README.
- AGENTS.md.

معايير القبول:

- الوثائق موجودة ومترابطة.
- الألوان الرسمية مثبتة.
- لا توجد ادعاءات بتكاملات حقيقية.
- المرحلة 1 واضحة وقابلة للتنفيذ.

## المرحلة 1: تأسيس المشروع

المخرجات:

- Next.js App Router.
- TypeScript strict.
- Tailwind.
- Design tokens مدمجة.
- ESLint/formatting.
- Prisma setup.
- Environment validation.
- Test setup.
- CI.

معايير القبول:

- `pnpm lint` يعمل.
- `pnpm typecheck` يعمل.
- `pnpm test` يعمل.
- `pnpm build` يعمل.
- صفحة أولية RTL تستخدم ألوان الهوية.

## المرحلة 2: المصادقة والصلاحيات

- تسجيل.
- تسجيل دخول.
- اختيار الدور.
- Route protection.
- RBAC server-side.
- Admin setup.

معايير القبول:

- لا يستطيع مستخدم الوصول لمسارات غير دوره.
- Super Admin لا ينشأ من التسجيل العام.
- اختبارات صلاحيات أساسية تعمل.

## المرحلة 3: الواجهة العامة

- Home.
- Discover campaigns.
- Campaign details.
- Static pages.
- Responsive navigation.

معايير القبول:

- RTL كامل.
- لا أرقام وهمية مضللة.
- تطبيق الهوية بالألوان الثلاثة فقط.

## المرحلة 4: ملفات المستخدمين والحسابات الاجتماعية

- Creator profile.
- Brand profile.
- Brand verification workflow.
- Manual social account provider.

## المرحلة 5: الحملات

- Campaign wizard.
- Assets.
- Requirements.
- Platform rates.
- Terms snapshot.
- Admin campaign review.
- Discover filters.

## المرحلة 6: الانضمام والإرسالات

- Join campaign.
- Eligibility checks.
- Submit post URL.
- URL normalization.
- Review workflow.
- Rejection and revision reasons.

## المرحلة 7: الإحصائيات والأرباح

- Metrics snapshots.
- Manual admin metrics.
- Qualified views.
- Earnings engine.
- Caps.
- Budget depletion.
- Holds.

## المرحلة 8: النظام المالي - مكتملة

- Ledger.
- Wallets.
- Deposits.
- Campaign budget reservation.
- Commissions.
- Payout requests.
- Manual payout processing.

ملاحظات التنفيذ:

- النظام يستخدم Ledger double-entry لكل الإيداعات، حجز ميزانية الحملات، تحرير الأرباح، حجز السحوبات، وتسوية السحوبات.
- الدفع ما زال يدوياً عبر الإدارة، ولا يوجد تكامل ZainCash/FastPay حقيقي.
- تم توفير Reversal للقيود المالية بدل حذفها.

## المرحلة 9: مكافحة الاحتيال والنزاعات - مكتملة

- Fraud rules.
- Fraud score.
- Trust score.
- Fraud queue.
- Disputes.
- Evidence.
- Admin resolution.

ملاحظات التنفيذ:

- MVP يستخدم قواعد واضحة ومراجعة بشرية، وليس نظام AI متقدم.
- يتم تسجيل TrustScoreEvent عند تأكيد/إزالة الاحتيال أو حل النزاعات المؤثرة.
- النزاعات مرتبطة بالإرسالات وتدعم رسائل بين الأطراف المصرح لها.

## المرحلة 10: لوحات التحكم والتحليلات - مكتملة

- Creator dashboard.
- Brand dashboard.
- Admin dashboard.
- Analytics.
- Notifications.

ملاحظات التنفيذ:

- نظام إشعارات فعلي (`Notification` model) مربوط بخمسة أحداث حقيقية: مراجعة الحملة، مراجعة الإرسال، مراجعة الإيداع، مراجعة السحب، وحل النزاع، وليس بيانات وهمية.
- لوحة الإدارة استبدلت الأصفار الثابتة بأرقام مستعلمة فعلياً من قاعدة البيانات.
- التحليلات تعتمد رسوم SVG بسيطة بدون مكتبة خارجية، متوافقة مع الألوان الرسمية.

## المرحلة 11: PWA والجودة - مكتملة

- Manifest.
- App icons placeholders.
- Offline fallback للصفحات العامة فقط.
- Accessibility QA.
- Performance QA.
- Empty/loading/error states.

ملاحظات التنفيذ:

- Service worker مكتوب يدوياً (`public/sw.js`) بدل مكتبة next-pwa (غير متوافقة رسمياً مع Turbopack)، بمنطق allowlist صريح بالمسار يقتصر على الصفحات العامة تحت `(marketing)` فقط ولا يلمس أي طلب `/api/**` أو مسارات admin/brand/creator.
- `not-found.tsx` وَ`global-error.tsx` جذريان، وَ`error.tsx`/`loading.tsx` لكل route group كشبكة أمان دفاعية فوق نمط try/catch اليدوي الموجود مسبقاً في صفحات البيانات.
- لا `next/image`: `thumbnailUrl` رابط خارجي حر بلا نطاق محدد، وتفعيل `remotePatterns` مفتوح كان سيحوّل السيرفر لـ proxy تحسين صور لأي رابط؛ استُخدم `<img loading="lazy">` عادي بدلاً منه.
- `eslint-plugin-jsx-a11y` وَ`@axe-core/playwright` أضيفا كأدوات فحص a11y آلية دائمة (لينت + e2e)، بدل الاعتماد على مراجعة يدوية فقط.

## المرحلة 12: الأمان والاختبارات - مكتملة

- Threat model verification.
- Security tests.
- Permission matrix tests.
- Financial concurrency tests.
- E2E.
- Dependency audit.

ملاحظات التنفيذ:

- **ثغرة سباق مالي حقيقية اكتُشفت وأُصلحت**: `requestPayout`، `reserveCampaignBudget`، وَ`releaseAvailableEarnings` كانت تفحص الرصيد ثم تخصمه ضمن نفس المعاملة لكن بلا قفل صف — ما يسمح لطلبين متزامنين بقراءة نفس الرصيد قبل التزام أي منهما وتجاوزه معاً (double-spend). تم إصلاحها بإضافة `LedgerEngine.lockFinancialAccount` (قفل Postgres عبر `SELECT ... FOR UPDATE`). أُثبتت الثغرة تجريبياً قبل الإصلاح (`src/modules/financial/concurrency.test.ts`، اختبار حقيقي ضد قاعدة بيانات فعلية، يتخطى تلقائياً بدون `DATABASE_URL`).
- `src/lib/permissions/rbac.test.ts` أصبح مصفوفة صلاحيات كاملة (كل الأدوار × كل الصلاحيات المعرّفة) بدل عينات محدودة.
- اختبارات IDOR e2e جديدة (`e2e/permission-boundaries.spec.ts`) تتحقق من رفض كل دور للـ APIs غير المخصصة له عبر الـ pipeline الفعلي (HTTP status/JSON)، فوق `src/middleware.test.ts` الموجود مسبقاً.
- `pnpm audit` كشف ثغرتين متوسطتين (transitive عبر next وprisma، أدوات وقت-بناء فقط) وتم تثبيتهما عبر `pnpm.overrides`. `pnpm audit` الآن نظيف.
- تحقق threat model موثّق بالتفصيل في `docs/THREAT_MODEL.md` §8، ويشمل فجوات حقيقية متبقية بصراحة: لا يوجد نموذج `AuditLog` فعلي في قاعدة البيانات، لا rate limiting، لا CSP/security headers. هذه القرارات التصميمية تفوق نطاق "كتابة اختبارات" وتُرشَّح كعمل منفصل.

## المرحلة 13: Staging والنشر - جزئية (بانتظار شراء استضافة)

- Staging deployment config.
- Migrations.
- Monitoring.
- Backup.
- Deployment checklist.
- Production readiness report.

ملاحظات التنفيذ:

- **قرار صاحب المنتج**: النشر الفعلي (Vercel/Supabase أو أي استضافة حقيقية) مؤجّل عمداً لحين شراء اشتراك سيرفر. تم إنجاز كل ما يمكن تجهيزه محلياً بدون استضافة فعلية:
  - `.github/workflows/ci.yml` أصبح خط أنابيب CI/CD كامل وفعلي: Postgres service حقيقي، `prisma migrate deploy`، format/lint/typecheck، unit+integration tests (بما فيها اختبار السباق المالي ضد قاعدة بيانات فعلية)، build، E2E كامل، dependency audit. تم تشغيله محلياً بمحاكاة كاملة (نفس متغيرات البيئة) والتأكد أن كل الخطوات تنجح.
  - `pnpm format:check` كان يفشل على 53 ملف موجودة من قبل (تراكم من مراحل سابقة) — تم إصلاحها بالكامل؛ الـ CI الآن يمرّ فعلياً بدل الفشل من أول خطوة.
  - `prisma migrate status` تؤكد: لا drift، 9 migrations متسلسلة، جاهزة لـ `prisma migrate deploy` على أي قاعدة بيانات جديدة.
  - تقرير جاهزية إنتاج صريح موثّق في `docs/DEPLOYMENT.md` §8، يوضح بالتفصيل ما هو جاهز فعلياً (الكود، الاختبارات، CI) مقابل ما هو عائق حقيقي (**المشروع ليس git repository بعد** — عائق أساسي أمام أي نشر) وما هو مؤجَّل بقرار (logging/monitoring/backup/استضافة).
