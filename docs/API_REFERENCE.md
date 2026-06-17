# E2M API 接口文档

Base URL: `http://localhost:8000/api/v1`

所有需要认证的接口在 Header 中传 `Authorization: Bearer <token>`。

---

## 1. 认证 (Auth)

### POST /auth/register — 邮箱注册

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "your_password",
  "nickname": "昵称（选填）"
}
```

**Response:**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user": {
    "id": "abc123",
    "email": "user@example.com",
    "phone": null,
    "nickname": "user",
    "avatar_url": null,
    "auth_provider": "email",
    "role": "user",
    "subscription_plan": "free",
    "subscription_expires_at": null
  }
}
```

### POST /auth/login — 邮箱登录

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "your_password"
}
```

**Response:** 同上 AuthResponse 格式。

### POST /auth/sms/send — 发送短信验证码

**Request Body:**
```json
{
  "phone": "+8613800138000",
  "purpose": "login"
}
```

**Response:**
```json
{ "message": "Verification code sent" }
```

### POST /auth/sms/verify — 手机号验证码登录/注册

**Request Body:**
```json
{
  "phone": "+8613800138000",
  "code": "123456",
  "purpose": "login"
}
```

**Response:** 同 AuthResponse 格式。新用户自动创建账号。

### GET /auth/google — Google OAuth 跳转

重定向到 Google 授权页面。

### GET /auth/google/callback?code=xxx — Google OAuth 回调

**Response:** AuthResponse 格式。

### GET /auth/me — 获取当前用户信息 (需认证)

**Response:** UserInfo 对象。

---

## 2. 支付 (Payment)

### GET /payment/plans — 获取套餐列表

**Response:**
```json
{
  "plans": [
    { "name": "Monthly", "price_cents": 999, "currency": "USD", "interval": "month" },
    { "name": "Monthly (CNY)", "price_cents": 2900, "currency": "CNY", "interval": "month" }
  ]
}
```

### POST /payment/checkout — 创建支付会话 (需认证)

**Request Body:**
```json
{
  "provider": "stripe",
  "success_url": "http://localhost:3000/pricing?success=1",
  "cancel_url": "http://localhost:3000/pricing?cancelled=1"
}
```

provider 可选: `stripe`, `wechat`, `alipay`

**Response:**
```json
{
  "payment_id": "xxx",
  "url": "https://checkout.stripe.com/...",
  "session_id": "cs_xxx"
}
```

### POST /payment/webhook/stripe — Stripe Webhook

Stripe 服务器回调，自动处理 `checkout.session.completed` 事件。

### POST /payment/webhook/wechat — 微信支付回调

接收微信支付异步通知 XML。

### POST /payment/webhook/alipay — 支付宝回调

接收支付宝异步通知表单。

### GET /payment/subscription — 查询当前订阅 (需认证)

**Response:**
```json
{
  "id": "xxx",
  "plan": "monthly",
  "status": "active",
  "provider": "stripe",
  "current_period_start": "2024-01-01T00:00:00+00:00",
  "current_period_end": "2024-01-31T00:00:00+00:00"
}
```

### POST /payment/cancel — 取消订阅 (需认证)

**Response:**
```json
{ "message": "Subscription cancelled" }
```

---

## 3. 埋点 (Tracking)

### POST /tracking/event — 上报事件 (可选认证)

**Request Body:**
```json
{
  "event_type": "page_view",
  "event_data": { "path": "/video" },
  "page_url": "http://localhost:3000/video",
  "session_id": "abc123"
}
```

**Response:**
```json
{ "ok": true }
```

此外，后端中间件自动记录所有 API 请求到 `tracking_events` 表。

---

## 4. 管理员 (Admin)

所有 admin 接口需要 `role=admin` 的 JWT token。

### GET /admin/dashboard — 仪表盘数据

**Response:**
```json
{
  "total_users": 100,
  "new_users_30d": 25,
  "active_subscriptions": 15,
  "revenue_30d_cents": 14985,
  "total_conversions": 500
}
```

### GET /admin/users?page=1&size=20&search= — 用户列表

**Response:**
```json
{
  "total": 100,
  "page": 1,
  "size": 20,
  "items": [
    {
      "id": "xxx",
      "email": "user@example.com",
      "phone": null,
      "nickname": "user",
      "role": "user",
      "is_blocked": false,
      "subscription_plan": "free",
      "auth_provider": "email",
      "created_at": "2024-01-01T00:00:00"
    }
  ]
}
```

### PATCH /admin/users/{user_id}/block?block=true — 拉黑/解封用户

**Response:**
```json
{ "id": "xxx", "is_blocked": true }
```

### GET /admin/revenue?days=30 — 收入明细

**Response:**
```json
{
  "days": 30,
  "data": [
    { "date": "2024-01-15", "total_cents": 999, "count": 1 }
  ]
}
```

### GET /admin/orders?page=1&size=20 — 订单列表

分页返回 `order_tracking` 表数据。

### GET /admin/tracking?page=1&size=50&event_type= — 埋点事件查询

分页返回 `tracking_events` 表数据，支持按 event_type 筛选。

### GET /admin/config — 读取运行配置

返回 .env 文件中的配置项（敏感字段脱敏为 `****`）。

### PATCH /admin/config — 修改运行配置

**Request Body:** 键值对对象，仅允许修改白名单内的安全配置项。

```json
{
  "APP_NAME": "My E2M",
  "MAX_FILE_SIZE_MB": "100"
}
```

---

## 5. 内容转换 (原有接口)

### GET /health — 健康检查

### POST /video/process — 视频转笔记

### GET /video/status/{task_id} — 视频任务状态

### POST /url/process — URL 转笔记

### GET /url/status/{task_id} — URL 任务状态

### POST /document/convert — 文档转笔记

### GET /document/status/{task_id} — 文档任务状态

### POST /export/{result_id} — 导出结果

### GET /export/result/{result_id} — 获取结果详情

### GET /tasks — 任务列表

### GET /tasks/{task_id} — 任务详情

### GET /files/{task_id}/{filename} — 获取提取的文件

---

## 数据库表结构

共 8 张表：

| 表名 | 说明 |
|------|------|
| `users` | 用户信息（邮箱/手机/Google OAuth/角色/订阅状态） |
| `subscriptions` | 订阅记录 |
| `payments` | 支付记录 |
| `sms_codes` | 短信验证码 |
| `tracking_events` | 埋点事件 |
| `order_tracking` | 订单追踪（冗余宽表，方便管理后台查询） |
| `tasks` | 转换任务 |
| `conversion_results` | 转换结果 |

完整建表 SQL: `backend/db/init.sql`
