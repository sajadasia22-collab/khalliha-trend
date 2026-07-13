const GOOGLE_AUTH_ERRORS: Record<string, string> = {
  invalid_request: "طلب تسجيل الدخول بواسطة Google غير صالح.",
  role_required: "اختر نوع الحساب قبل التسجيل بواسطة Google.",
  brand_name_required: "أدخل اسم العلامة التجارية قبل التسجيل بواسطة Google.",
  consent_required: "يجب تأكيد العمر والموافقة على الشروط قبل التسجيل.",
  not_configured: "تسجيل الدخول بواسطة Google غير مفعّل بعد.",
  access_denied: "تم إلغاء تسجيل الدخول بواسطة Google.",
  invalid_state: "انتهت جلسة Google أو أصبحت غير صالحة. حاول مرة أخرى.",
  missing_identity: "لم يرسل Google بيانات الهوية المطلوبة.",
  unverified_email: "يجب استخدام بريد إلكتروني موثّق لدى Google.",
  account_not_found: "لا يوجد حساب بهذا البريد. أنشئ حسابًا جديدًا بواسطة Google أولًا.",
  account_blocked: "هذا الحساب معلّق أو محظور.",
  callback_failed: "تعذّر إكمال تسجيل الدخول بواسطة Google. حاول مرة أخرى.",
};

export function getGoogleAuthErrorMessage(code: string | null): string | null {
  if (!code) return null;
  return GOOGLE_AUTH_ERRORS[code] ?? GOOGLE_AUTH_ERRORS.callback_failed;
}
