# Security - خلّيها ترند

## 1. المبادئ

- التفويض يتم على السيرفر في كل عملية.
- لا تعتمد الواجهة لإخفاء الصلاحيات.
- لا تخزن الأسرار في المستودع.
- لا ترسل service role keys إلى المتصفح.
- لا تستخدم بيانات حقيقية في الاختبارات أو seed.
- كل عملية مالية أو إدارية حساسة تحتاج Audit Log.

## 2. Authentication

- استخدم مزود مصادقة آمن يدعم sessions.
- كلمات المرور لا تخزن يدوياً خارج نظام المصادقة.
- منع user enumeration عند تسجيل الدخول أو إعادة التعيين.
- Rate limiting لمحاولات الدخول.
- سجل محاولات الدخول المشبوهة.
- وفر logout من جميع الأجهزة.
- Google OAuth يستخدم Authorization Code Flow على السيرفر مع `state` و`nonce` وPKCE، ولا يخزن access/refresh tokens.
- ربط Google بحساب موجود يتطلب بريداً موثقاً من Google؛ الدور لا يؤخذ من Google ولا يتغير للحسابات القائمة.

## 3. Authorization

- RBAC إلزامي.
- تحقق من ملكية الموارد لكل request.
- امنع IDOR عبر فحص `userId`, `brandId`, وmembership.
- Super Admin محمي ولا ينشأ من التسجيل العام.
- العمليات المالية والإدارية تستخدم permission checks منفصلة.

## 4. Input validation

- استخدم Zod لكل body/query/params.
- لا تثق بأي ID قادم من المستخدم.
- Normalize URLs قبل التخزين والمقارنة.
- Sanitization للنصوص التي قد تظهر لاحقاً في HTML.

## 5. Upload security

- Signed URLs فقط.
- File type validation.
- File size limits.
- منع الملفات التنفيذية.
- Virus scan provider interface.
- إزالة metadata الحساسة عند الحاجة.
- عدم جعل الملفات الخاصة public افتراضياً.

## 6. Financial safety

- كل عملية مالية داخل database transaction.
- استخدم idempotency keys.
- استخدم BIGINT للأموال والمشاهدات.
- لا تستخدم floating point.
- Double-entry ledger أو تصميم مكافئ.
- لا تحذف entries مالية.
- استخدم reversals للتصحيح.
- اختبر race conditions والعمليات المتزامنة.

## 7. Secrets and logging

- الأسرار في env فقط.
- Redaction للـlogs.
- لا تسجل tokens أو بيانات سحب حساسة.
- بيانات وسائل السحب تخزن مشفرة وتعرض masked.

## 8. Web security

- Secure cookies.
- SameSite مناسب.
- CSRF strategy حسب نمط المصادقة.
- Security headers.
- CSP عند استقرار مصادر الأصول.
- Output encoding.
- منع path traversal في الملفات.
- حماية SSRF لأي URL يجلبه السيرفر.

## 9. Admin safety

- العمليات الحساسة تحتاج confirmation وسبب إلزامي.
- سجل actor وtarget وbefore/after عند الإمكان.
- جهز Maker-Checker للعمليات المالية الحساسة مستقبلاً.
- لا يسمح للمشرف باعتماد عملية مالية أنشأها بنفسه عندما يتم تفعيل Maker-Checker.

## 10. Dependency safety

- استخدم pnpm audit أو بديل في CI.
- لا تضف حزم غير ضرورية.
- راجع الحزم التي تتعامل مع uploads أو auth أو crypto.

## 11. Checklist قبل الإنتاج

- لا أسرار في المستودع.
- لا service keys في client bundle.
- Rate limits مفعلة.
- Audit logs تعمل.
- اختبارات الصلاحيات تعمل.
- اختبارات العمليات المالية المتزامنة تعمل.
- CSP وsecurity headers مراجعة.
- Backup وrestore موثقان.
- مراجعة قانونية ومحاسبية للمدفوعات.
