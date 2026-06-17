-- ============================================================
-- Everything2Markdown (E2M) — MySQL 初始化脚本
-- 运行: mysql -u root -p < backend/db/init.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS e2m DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE e2m;

-- ======================== 原有表 ========================

CREATE TABLE IF NOT EXISTS tasks (
    id           VARCHAR(32)  PRIMARY KEY,
    type         ENUM('video','url','document') NOT NULL,
    source       TEXT         NOT NULL,
    status       ENUM('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
    progress     INT          NOT NULL DEFAULT 0,
    error_message TEXT        NULL,
    result_id    VARCHAR(32)  NULL,
    created_at   DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at   DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    INDEX idx_tasks_status (status),
    INDEX idx_tasks_created (created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS conversion_results (
    id               VARCHAR(32)  PRIMARY KEY,
    title            VARCHAR(500) NOT NULL DEFAULT '',
    raw_content      LONGTEXT     NOT NULL,
    markdown_content LONGTEXT     NOT NULL,
    summary          LONGTEXT     NOT NULL,
    tags             JSON         NULL,
    source_type      VARCHAR(50)  NOT NULL DEFAULT '',
    source_url       TEXT         NOT NULL,
    metadata         JSON         NULL,
    created_at       DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB;

-- ======================== 用户 ========================

CREATE TABLE IF NOT EXISTS users (
    id                      VARCHAR(32)  PRIMARY KEY,
    email                   VARCHAR(255) NULL UNIQUE,
    phone                   VARCHAR(20)  NULL UNIQUE,
    password_hash           VARCHAR(255) NULL,
    nickname                VARCHAR(100) NOT NULL DEFAULT '',
    avatar_url              VARCHAR(512) NULL,
    auth_provider           ENUM('email','google','phone') NOT NULL DEFAULT 'email',
    google_id               VARCHAR(128) NULL UNIQUE,
    role                    ENUM('user','admin') NOT NULL DEFAULT 'user',
    is_blocked              BOOLEAN      NOT NULL DEFAULT FALSE,
    subscription_plan       ENUM('free','monthly') NOT NULL DEFAULT 'free',
    subscription_expires_at DATETIME(6)  NULL,
    created_at              DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at              DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    INDEX idx_users_email (email),
    INDEX idx_users_role (role)
) ENGINE=InnoDB;

-- ======================== 订阅 ========================

CREATE TABLE IF NOT EXISTS subscriptions (
    id                       VARCHAR(32)  PRIMARY KEY,
    user_id                  VARCHAR(32)  NOT NULL,
    plan                     ENUM('monthly') NOT NULL DEFAULT 'monthly',
    status                   ENUM('active','cancelled','expired','past_due') NOT NULL DEFAULT 'active',
    payment_provider         ENUM('stripe','wechat','alipay') NOT NULL,
    external_subscription_id VARCHAR(255) NULL,
    current_period_start     DATETIME(6)  NULL,
    current_period_end       DATETIME(6)  NULL,
    created_at               DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    INDEX idx_sub_user (user_id),
    INDEX idx_sub_status (status),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ======================== 支付 ========================

CREATE TABLE IF NOT EXISTS payments (
    id                  VARCHAR(32)  PRIMARY KEY,
    user_id             VARCHAR(32)  NOT NULL,
    subscription_id     VARCHAR(32)  NULL,
    amount_cents        INT          NOT NULL,
    currency            VARCHAR(3)   NOT NULL DEFAULT 'USD',
    provider            ENUM('stripe','wechat','alipay') NOT NULL,
    external_payment_id VARCHAR(255) NOT NULL DEFAULT '',
    status              ENUM('pending','succeeded','failed','refunded') NOT NULL DEFAULT 'pending',
    paid_at             DATETIME(6)  NULL,
    created_at          DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    INDEX idx_pay_user (user_id),
    INDEX idx_pay_status (status),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ======================== 短信验证码 ========================

CREATE TABLE IF NOT EXISTS sms_codes (
    id         INT          PRIMARY KEY AUTO_INCREMENT,
    phone      VARCHAR(20)  NOT NULL,
    code       VARCHAR(6)   NOT NULL,
    purpose    ENUM('register','login','reset') NOT NULL DEFAULT 'login',
    expires_at DATETIME(6)  NOT NULL,
    used       BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    INDEX idx_sms_phone (phone),
    INDEX idx_sms_expires (expires_at)
) ENGINE=InnoDB;

-- ======================== 邮箱验证码 ========================

CREATE TABLE IF NOT EXISTS email_codes (
    id         INT          PRIMARY KEY AUTO_INCREMENT,
    email      VARCHAR(255) NOT NULL,
    code       VARCHAR(6)   NOT NULL,
    purpose    ENUM('register','login','reset') NOT NULL DEFAULT 'login',
    expires_at DATETIME(6)  NOT NULL,
    used       BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    INDEX idx_email_code_email (email),
    INDEX idx_email_code_expires (expires_at)
) ENGINE=InnoDB;

-- ======================== 埋点事件 ========================

CREATE TABLE IF NOT EXISTS tracking_events (
    id          BIGINT       PRIMARY KEY AUTO_INCREMENT,
    user_id     VARCHAR(32)  NULL,
    event_type  VARCHAR(50)  NOT NULL,
    event_data  JSON         NULL,
    ip_address  VARCHAR(45)  NOT NULL DEFAULT '',
    user_agent  VARCHAR(512) NOT NULL DEFAULT '',
    page_url    VARCHAR(1024) NOT NULL DEFAULT '',
    session_id  VARCHAR(64)  NOT NULL DEFAULT '',
    created_at  DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    INDEX idx_te_user (user_id),
    INDEX idx_te_type (event_type),
    INDEX idx_te_session (session_id),
    INDEX idx_te_created (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ======================== 订单追踪 ========================

CREATE TABLE IF NOT EXISTS order_tracking (
    id           BIGINT       PRIMARY KEY AUTO_INCREMENT,
    user_id      VARCHAR(32)  NOT NULL,
    user_email   VARCHAR(255) NOT NULL DEFAULT '',
    payment_id   VARCHAR(32)  NOT NULL,
    plan         VARCHAR(20)  NOT NULL DEFAULT '',
    amount_cents INT          NOT NULL DEFAULT 0,
    currency     VARCHAR(3)   NOT NULL DEFAULT 'USD',
    provider     VARCHAR(20)  NOT NULL DEFAULT '',
    order_status VARCHAR(20)  NOT NULL DEFAULT '',
    order_time   DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    paid_time    DATETIME(6)  NULL,
    ip_address   VARCHAR(45)  NOT NULL DEFAULT '',
    user_agent   VARCHAR(512) NOT NULL DEFAULT '',
    extra_data   JSON         NULL,
    created_at   DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    INDEX idx_ot_user (user_id),
    INDEX idx_ot_payment (payment_id),
    INDEX idx_ot_order_time (order_time),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ======================== 默认管理员 ========================
-- 密码: 123456  bcrypt hash: $2b$12$LJ3m4ys3Lk0TQKZ6K5pOZOGdGRM0F1xrQqOGNnLCnGECfx5BPyXa

INSERT IGNORE INTO users (id, email, password_hash, nickname, auth_provider, role, created_at, updated_at)
VALUES (
    'admin00000000000000000000000001',
    '728003092@qq.com',
    '$2b$12$LJ3m4ys3Lk0TQKZ6K5pOZOGdGRM0F1xrQqOGNnLCnGECfx5BPyXa',
    'Admin',
    'email',
    'admin',
    NOW(6),
    NOW(6)
);
