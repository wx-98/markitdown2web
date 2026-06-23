import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from backend.config import settings

logger = logging.getLogger(__name__)


def _build_message(to_email: str, subject: str, html_body: str, from_addr: str) -> MIMEMultipart:
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = from_addr
    msg["To"] = to_email
    msg.attach(MIMEText(html_body, "html", "utf-8"))
    return msg


def _pick_smtp_config(to_email: str) -> tuple[str, int, str, str]:
    """根据收件人邮箱后缀选择 SMTP 通道，Gmail 收件优先走 Gmail SMTP。"""
    domain = to_email.rsplit("@", 1)[-1].lower()
    if domain == "gmail.com" and settings.SMTP_GMAIL_USERNAME:
        return (
            settings.SMTP_GMAIL_HOST,
            settings.SMTP_GMAIL_PORT,
            settings.SMTP_GMAIL_USERNAME,
            settings.SMTP_GMAIL_PASSWORD,
        )
    if settings.SMTP_QQ_USERNAME:
        return (
            settings.SMTP_QQ_HOST,
            settings.SMTP_QQ_PORT,
            settings.SMTP_QQ_USERNAME,
            settings.SMTP_QQ_PASSWORD,
        )
    if settings.SMTP_GMAIL_USERNAME:
        return (
            settings.SMTP_GMAIL_HOST,
            settings.SMTP_GMAIL_PORT,
            settings.SMTP_GMAIL_USERNAME,
            settings.SMTP_GMAIL_PASSWORD,
        )
    raise RuntimeError(
        "SMTP 未配置。请设置 SMTP_QQ_USERNAME/SMTP_QQ_PASSWORD 或 "
        "SMTP_GMAIL_USERNAME/SMTP_GMAIL_PASSWORD 环境变量"
    )


async def send_email(to_email: str, subject: str, html_body: str) -> bool:
    """通过 SMTP 发送邮件（同步操作在线程池中执行）。"""
    import asyncio

    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, _send_sync, to_email, subject, html_body)


def _send_sync(to_email: str, subject: str, html_body: str) -> bool:
    try:
        host, port, username, password = _pick_smtp_config(to_email)
        msg = _build_message(to_email, subject, html_body, username)

        with smtplib.SMTP(host, port, timeout=15) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(username, password)
            server.sendmail(username, [to_email], msg.as_string())

        logger.info("Email sent to %s via %s", to_email, host)
        return True
    except Exception:
        logger.exception("Failed to send email to %s", to_email)
        return False


def build_verification_html(code: str) -> str:
    return f"""\
<!DOCTYPE html>
<html><body style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px">
<h2 style="color:#1e40af">E2M 邮箱验证码</h2>
<p>您的验证码为：</p>
<div style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#2563eb;
            background:#eff6ff;border-radius:8px;padding:16px 24px;text-align:center;
            margin:16px 0">{code}</div>
<p style="color:#6b7280;font-size:14px">验证码有效期 5 分钟，请勿将验证码告知他人。</p>
<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
<p style="color:#9ca3af;font-size:12px">此邮件由 Everything2Markdown 系统自动发送，请勿回复。</p>
</body></html>"""
