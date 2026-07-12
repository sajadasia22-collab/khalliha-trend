# Payment Integrations - خلّيها ترند

## 1. القاعدة الأساسية

MVP يستخدم معالجة يدوية للإيداع والسحب. لا يتم تنفيذ دفع حقيقي مع ZainCash أو FastPay أو أي مزود آخر قبل توفر:

- وثائق رسمية حالية.
- Credentials.
- Sandbox.
- Webhook verification.
- موافقة صريحة.
- مراجعة قانونية ومحاسبية عراقية.

## 2. مصطلحات المنتج

استخدم:

```text
ميزانية الحملة المحجوزة
```

لا تستخدم مصطلح Escrow داخل الواجهة قبل مراجعة قانونية.

## 3. ManualPaymentProvider

وظائف MVP:

- إنشاء طلب إيداع.
- اختيار وسيلة دفع يدوية.
- توليد رقم مرجعي.
- رفع إثبات الدفع عند الحاجة.
- مراجعة الإدارة.
- قبول أو رفض الإيداع.
- إضافة الرصيد عند القبول عبر Ledger.

## 4. Payouts

السحب في MVP:

- صانع المحتوى يضيف وسيلة سحب.
- البيانات الحساسة تخزن مشفرة وتعرض masked.
- طلب السحب يحجز الرصيد المتاح.
- الإدارة تعالج الطلب يدوياً.
- عند الدفع تسجل reference وإثبات.
- عند الرفض يحرر الرصيد.

## 5. PaymentProvider interface

```ts
interface PaymentProvider {
  createDepositIntent(input: CreateDepositInput): Promise<CreateDepositResult>;
  verifyWebhook(input: VerifyWebhookInput): Promise<VerifyWebhookResult>;
  getPaymentStatus(input: PaymentStatusInput): Promise<PaymentStatusResult>;
}
```

## 6. متطلبات الأمان

- لا تخزن بيانات بطاقات مصرفية.
- لا تسجل بيانات وسائل السحب الحساسة.
- استخدم idempotency.
- كل قرار مالي يسجل في Audit Log.
- لا يمكن اعتماد payout مرتين.
