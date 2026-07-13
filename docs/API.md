# API Structure - خلّيها ترند

## 1. المبادئ

- جميع الوظائف الأساسية تكون متاحة عبر REST API.
- النسخة الأولى تحت `/api/v1`.
- كل endpoint يتحقق من Authentication وAuthorization على السيرفر.
- كل input يمر عبر Zod validation.
- كل خطأ يرجع بصيغة ثابتة.
- العمليات المالية تستخدم idempotency key.
- لا ترجع بيانات حساسة أو tokens.

## 2. صيغة الخطأ

```json
{
  "error": {
    "code": "CAMPAIGN_NOT_FOUND",
    "message": "لم يتم العثور على الحملة.",
    "requestId": "req_...",
    "details": {}
  }
}
```

## 3. Pagination

```text
GET /api/v1/campaigns?page=1&pageSize=20&sort=createdAt&order=desc
```

الاستجابة:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 0,
    "pageCount": 0
  }
}
```

## 4. Endpoints مقترحة

### Auth

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
POST /api/v1/auth/logout-all
GET  /api/v1/me
```

### Public

```text
GET /api/v1/campaigns
GET /api/v1/campaigns/:id
GET /api/v1/categories
```

### Creator

```text
GET   /api/v1/creator/profile
PATCH /api/v1/creator/profile
GET   /api/v1/creator/campaigns/joined
POST  /api/v1/campaigns/:id/join
GET   /api/v1/creator/submissions
POST  /api/v1/submissions
GET   /api/v1/submissions/:id
GET   /api/v1/creator/earnings
GET   /api/v1/creator/trust-score
```

### Social Accounts

```text
GET    /api/v1/social-accounts
POST   /api/v1/social-accounts
PATCH  /api/v1/social-accounts/:id
DELETE /api/v1/social-accounts/:id
POST   /api/v1/social-accounts/:id/verify
```

### Brand

```text
GET   /api/v1/brand/profile
PATCH /api/v1/brand/profile
POST  /api/v1/brand/verification
GET   /api/v1/brand/campaigns
POST  /api/v1/brand/campaigns
GET   /api/v1/brand/campaigns/:id
PATCH /api/v1/brand/campaigns/:id
POST  /api/v1/brand/campaigns/:id/submit-review
GET   /api/v1/brand/submissions
POST  /api/v1/brand/submissions/:id/review
GET   /api/v1/brand/deposits
POST  /api/v1/deposits
```

### Wallets and Payouts

```text
GET  /api/v1/wallet
GET  /api/v1/creator/payouts
POST /api/v1/creator/payouts
```

### Disputes

```text
GET  /api/v1/disputes
POST /api/v1/disputes
POST /api/v1/disputes/:id/messages
```

### Notifications

```text
GET  /api/v1/notifications
POST /api/v1/notifications/:id/read
POST /api/v1/notifications/read-all
GET  /api/v1/notification-preferences
PATCH /api/v1/notification-preferences
```

### Admin

```text
GET  /api/v1/admin/users
PATCH /api/v1/admin/users/:id/status
GET  /api/v1/admin/brands
POST /api/v1/admin/brands/:id/verify
GET  /api/v1/admin/campaigns/review
POST /api/v1/admin/campaigns/:id/review
GET  /api/v1/admin/submissions
POST /api/v1/admin/submissions/:id/metrics
GET  /api/v1/admin/fraud-queue
GET  /api/v1/admin/deposits
POST /api/v1/admin/deposits/:id/review
GET  /api/v1/admin/payouts
POST /api/v1/admin/payouts/:id/review
GET  /api/v1/admin/financial
POST /api/v1/admin/financial
POST /api/v1/admin/fraud-queue/:id/review
POST /api/v1/admin/submissions/:id/fraud-signals
POST /api/v1/admin/disputes/:id/resolve
GET  /api/v1/admin/audit-logs
GET  /api/v1/admin/system-health
```

## 5. Stable Error Codes

أمثلة:

```text
UNAUTHENTICATED
FORBIDDEN
VALIDATION_ERROR
RATE_LIMITED
CAMPAIGN_NOT_FOUND
CAMPAIGN_NOT_ACTIVE
CAMPAIGN_BUDGET_EXHAUSTED
CREATOR_NOT_ELIGIBLE
SOCIAL_ACCOUNT_NOT_VERIFIED
DUPLICATE_POST_URL
SUBMISSION_NOT_FOUND
METRICS_SNAPSHOT_DUPLICATE
INSUFFICIENT_AVAILABLE_BALANCE
PAYOUT_ALREADY_PROCESSED
IDEMPOTENCY_CONFLICT
```

## 6. OpenAPI

في مرحلة التطبيق يجب إنشاء:

```text
docs/openapi.yaml
```

أو توليده من route schemas إذا اعتمدنا أداة مناسبة.
