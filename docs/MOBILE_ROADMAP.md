# Mobile Roadmap - خلّيها ترند

## 1. الهدف

بناء الويب كـAPI-first حتى يمكن لاحقاً إنشاء تطبيق iOS وAndroid باستخدام Flutter أو React Native دون إعادة بناء backend.

## 2. متطلبات API للتطبيق المستقبلي

- Auth.
- Profiles.
- Campaign discovery.
- Campaign details.
- Join campaign.
- Download campaign assets.
- Submit post URL.
- View submission status.
- Earnings.
- Wallet.
- Payout requests.
- Notifications.
- Disputes.

## 3. اعتبارات Mobile

- Pagination في كل القوائم.
- Responses صغيرة وواضحة.
- Stable error codes.
- Offline محدود للصفحات العامة فقط.
- لا تخزين offline للمحفظة أو البيانات المالية الحساسة.
- Push notifications عبر Provider لاحقاً.

## 4. PWA أولاً

قبل التطبيق الأصلي:

- Manifest.
- App icons.
- Mobile navigation.
- Installability.
- Offline fallback للصفحات العامة.
- عدم تخزين بيانات حساسة في service worker cache.

## 5. قرار لاحق

اختيار Flutter أو React Native يؤجل حتى:

- ثبات API.
- وجود usage فعلي.
- تحديد الحاجة إلى native capabilities.
