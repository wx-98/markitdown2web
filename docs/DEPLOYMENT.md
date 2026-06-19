# E2M 部署指南

## 1. Docker Compose 部署（推荐）

### 前置条件

- Docker >= 20.10
- Docker Compose >= 2.0

### 步骤

```bash
# 1. 克隆项目
git clone <repo-url>
cd markitdown2web

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env，必须填写的配置：
#   - OPENAI_API_KEY（AI 功能必需）
#   - JWT_SECRET_KEY（改为随机字符串）
#   - SECRET_KEY（改为随机字符串）

# 3. 启动所有服务
docker-compose up -d

# 4. 检查服务状态
docker-compose ps
```

### 服务端口

| 服务 | 端口 | 说明 |
|------|------|------|
| frontend | 3000 | 用户界面 |
| admin | 3001 | 管理后台 |
| backend | 8000 | API 服务 |
| mysql | 3306 | 数据库 |

### 默认管理员

- 邮箱: `728003092@qq.com`
- 密码: `123456`
- 登录地址: http://localhost:3001/login

**重要: 部署后请立即修改管理员密码。**

---

## 2. 手动部署

### 2.1 MySQL

```bash
# 安装 MySQL 8.0
# 创建数据库和表
mysql -u root -p < backend/db/init.sql
```

### 2.2 后端

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e .

# 配置环境变量
cp .env.example .env
# 编辑 .env 中的 DATABASE_URL 指向你的 MySQL

# 启动
uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

生产环境建议使用 Gunicorn:
```bash
gunicorn backend.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### 2.3 前端

```bash
cd frontend
npm install
npm run build
# 将 dist/ 目录部署到 Nginx 等 Web 服务器
```

### 2.4 管理后台

```bash
cd admin
npm install
npm run build
# 将 dist/ 目录部署到 Nginx（不同端口或路径）
```

---

## 3. 环境变量说明

详见 `.env.example` 文件中的注释。关键配置：

### 必填

| 变量 | 说明 |
|------|------|
| `DATABASE_URL` | MySQL 连接字符串 |
| `JWT_SECRET_KEY` | JWT 签名密钥（生产请用长随机字符串） |
| `OPENAI_API_KEY` | OpenAI API Key |

### 支付（按需配置）

| 变量 | 说明 |
|------|------|
| `STRIPE_SECRET_KEY` | Stripe 密钥 |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook 签名密钥 |
| `STRIPE_PRICE_ID_MONTHLY` | Stripe 月度订阅 Price ID |
| `WECHAT_APP_ID` / `MCH_ID` / `API_KEY` | 微信支付商户信息 |
| `ALIPAY_APP_ID` / `PRIVATE_KEY` / `PUBLIC_KEY` | 支付宝商户信息 |

### 短信（按需配置）

| 变量 | 说明 |
|------|------|
| `SMS_PROVIDER` | `aliyun` 或 `twilio` |
| `ALIYUN_ACCESS_KEY_ID` / `SECRET` | 阿里云 SMS |
| `TWILIO_ACCOUNT_SID` / `AUTH_TOKEN` | Twilio SMS |

### Google OAuth（按需配置）

| 变量 | 说明 |
|------|------|
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |
| `GOOGLE_REDIRECT_URI` | 回调地址 |

---

## 4. Nginx 反向代理示例

```nginx
server {
    listen 80;
    server_name e2m.example.com;

    # 前端
    location / {
        proxy_pass http://127.0.0.1:3000;
    }

    # API
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        client_max_body_size 500M;
    }
}

server {
    listen 80;
    server_name admin.e2m.example.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 5. 数据备份

```bash
# MySQL 备份
docker-compose exec mysql mysqldump -u e2m -pe2m_password e2m > backup.sql

# 恢复
docker-compose exec -T mysql mysql -u e2m -pe2m_password e2m < backup.sql
```

---

## 6. 常见问题

**Q: 启动后端报 MySQL 连接错误？**
A: 确认 MySQL 已启动，`DATABASE_URL` 格式正确（使用 `mysql+asyncmy://` 前缀），用户有权限访问数据库。

**Q: 短信验证码收不到？**
A: 检查 `.env` 中 SMS 配置，无配置时验证码会打印到日志。

**Q: 支付跳转失败？**
A: 支付相关密钥未配置时为 mock 模式。填入真实商户密钥即可启用。
