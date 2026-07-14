# Roadmap - خلّيها ترند

## وين وصلنا — ملخص الحالة (آخر تحديث: 2026-07-14)

**كل المراحل 0–13 مكتملة والمنصة منشورة على الإنتاج** (`khalliha-trend.vercel.app`، آخر commit منشور: `1081142`). آخر ما أُنجز:

- نظام النزاعات والاحتيال مكتمل ومجرّب يدوياً بدورة كاملة (إحصائيات ← إشارات تلقائية ← مراجعة ← نزاع ← حسم) مع إصلاح 4 أخطاء خرجت من التجربة — تفاصيلها في `CHANGELOG.md` 2026-07-13.
- نماذج قرارات الإدارة أصبحت داخل الصفحة بدل `window.prompt`.
- مراقبة أخطاء الإنتاج مفعّلة (سجلات JSON + تنبيهات webhook اختيارية) ونسخ احتياطي موثق بسكربت مجرّب — `DEPLOYMENT.md` §11–12.

**التالي عند الاستئناف (بالأولوية):**

1. **المرحلة 14 قيد التنفيذ**: اكتمل الملف المهني، معرض الأعمال، الدليل، المتابعة، والمجتمع العام مع الإشراف ضمن الإصدار v3.
2. متابعة المرحلة 14 بالمراسلة المرتبطة بالحملة وبحث الرسائل، ثم تجربة تشغيل حقيقية.
3. **خطوة يدوية على صاحب المشروع**: إنشاء Incoming Webhook (Slack/Discord) وإضافته كـ`ERROR_ALERT_WEBHOOK_URL` في Vercel لتفعيل تنبيهات الأخطاء.
4. **تكامل الدفع الحقيقي** (ZainCash/FastPay): يبدأ بالحصول على حساب تاجر + credentials + sandbox ومراجعة قانونية — البنية جاهزة (`PAYMENT_INTEGRATIONS.md`).
5. **تكامل السوشال الرسمي** (TikTok/Meta/YouTube APIs): يبدأ بالتقديم على حسابات المطورين وانتظار الموافقات (`SOCIAL_INTEGRATIONS.md`).
6. تشغيل فعلي بمستخدمين حقيقيين — ملاحظات الاستخدام سترسم الأولويات القادمة.

---

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
- جرت تجربة يدوية نهائية للدورة الكاملة (إحصائيات ← إشارات تلقائية ← مراجعة الاحتيال ← نزاع ← حسم) بتاريخ 2026-07-13، والقواعد التفصيلية موثقة في `BUSINESS_RULES.md` §14–15.

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
- تحقق threat model موثّق بالتفصيل في `docs/THREAT_MODEL.md` §8. الفجوات الثلاث التي رُصدت وقتها (نموذج `AuditLog`، rate limiting، CSP/security headers) **أُغلقت لاحقاً بالكامل** — راجع «الفجوات التي أُغلقت» في `THREAT_MODEL.md` §8؛ المتبقي الوحيد هو اختبارات رفع الملفات (لا ينطبق: لا توجد ميزة رفع بعد).

## المرحلة 13: Staging والنشر - منشورة على الإنتاج (Monitoring/Backup مؤجلان)

- Staging deployment config.
- Migrations.
- Monitoring.
- Backup.
- Deployment checklist.
- Production readiness report.

ملاحظات التنفيذ:

- **المنصة منشورة فعلياً على الإنتاج** منذ 2026-07-13: `khalliha-trend.vercel.app` (Vercel + Supabase Postgres)، والمشروع git repository مربوط بـ GitHub والنشر يتم تلقائياً عند الدفع إلى `main`. راجع جدول الإصدارات في `CHANGELOG.md` وآلية النشر في `DEPLOYMENT.md` §10.
- `.github/workflows/ci.yml` خط أنابيب CI/CD كامل وفعلي: Postgres service حقيقي، `prisma migrate deploy`، format/lint/typecheck، unit+integration tests (بما فيها اختبار السباق المالي ضد قاعدة بيانات فعلية)، build، E2E كامل، dependency audit.
- `prisma migrate status`: لا drift، والـ migrations مطبقة على قاعدة الإنتاج.
- تقرير جاهزية الإنتاج موثّق في `docs/DEPLOYMENT.md` §8.
- **Monitoring**: مراقبة أخطاء السيرفر مفعّلة (سجلات JSON منظمة عبر `src/instrumentation.ts` + تنبيهات webhook اختيارية عبر `ERROR_ALERT_WEBHOOK_URL`) — راجع `DEPLOYMENT.md` §11.
- **Backup**: سكربت `scripts/backup-db.sh` (pg_dump مع سياسة احتفاظ) موثق مع خطة الإيقاع والاستعادة في `DEPLOYMENT.md` §12. الترقية المستقبلية الاختيارية: Sentry ونسخ Supabase Pro التلقائية.

## المرحلة 14: الهوية المهنية والمجتمع - قيد التنفيذ

الدفعة الأولى المكتملة ضمن v3:

- اسم مستخدم فريد يدعم العربية واللاتينية، مع منع الأسماء المحجوزة.
- صورة شخصية وصورة غلاف عبر Supabase Storage مع تحقق فعلي من bytes ونوع الملف وحد 5MB.
- اختصاصات المحتوى واللغات وخيار إخفاء الصفحة العامة.
- صفحة عامة تحت `/creators/:username` تعرض المعلومات المهنية والحسابات الاجتماعية الموثقة فقط.
- ربط صناع المحتوى الظاهرين في لوحة الشرف بصفحاتهم العامة.

الدفعة الثانية المكتملة ضمن v3:

- معرض أعمال بعلاقات قاعدة بيانات فعلية، يدعم 12 عملاً وترتيبها وحذفها.
- التحقق من روابط المنشورات وتطبيعها وحصرها بالمنصات الرسمية المدعومة.
- صور أغلفة للأعمال عبر نفس مسار Supabase Storage الآمن.
- عرض الأعمال المختارة في الصفحة العامة لصانع المحتوى.
- دليل عام تحت `/creators` مع بحث بالاسم واسم المستخدم وفلاتر الاختصاص والمنصة والمحافظة واللغة.
- API عامة مقسّمة الصفحات للدليل، لا تعرض إلا الملفات العامة النشطة ذات اسم مستخدم.

الدفعة الثالثة المكتملة ضمن v3:

- علاقة متابعة فعلية بين الحسابات مع منع متابعة النفس والتكرار على مستوى PostgreSQL.
- متابعة وإلغاء متابعة من الملف العام مع عدادات محدثة من قاعدة البيانات.
- قائمة المتابَعين داخل إعدادات الحساب، ولا تعرض الملفات الخاصة أو الحسابات غير النشطة.
- حماية ملكية، rate limit واختبارات لقواعد المتابعة الأساسية.

الدفعة الرابعة المكتملة ضمن v3:

- مجتمع نصوص وصور وروابط خارجية، بلا استضافة فيديو وبلا تحقيق دخل اجتماعي.
- إعجاب وتعليقات وحفظ ومشاركة وتعديل وحذف، مع خلاصات عامة/متابَعة/محفوظة وبحث.
- إبلاغ وكتم وحظر ولوحة إدارة للمراجعة البشرية مع Audit Log.
- اقتراح صناع محتوى وإشعارات متابعة وتفاعل وإعداد خصوصية للمراسلة.
- عرض معلومات الجلسة وسجل الدخول الحقيقي بدل البيانات الوهمية السابقة.

الدفعات التالية:

- مراسلة مرتبطة بالحملة مع الحظر والإبلاغ.
- بحث داخل الرسائل عند تفعيل نظام المراسلة؛ بحث المجتمع مكتمل.
- تحسينات المجتمع الاحترافية مكتملة: تعدد الصور، الروابط الدائمة، الردود، معاينة الروابط، المتابعة من الاقتراحات، والتحميل التلقائي.
