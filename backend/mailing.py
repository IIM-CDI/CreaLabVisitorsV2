import os
import smtplib
import ssl
from email import encoders
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from email_templates import (
    event_rejected_admin_template,
    event_rejected_user_template,
    event_validated_admin_template,
    event_validated_user_template,
    new_event_admin_template,
    new_event_user_template,
)
from postgrest import APIResponse

# EMAIL SMTP SYSTEM

def _send_via_ssl(smtp_server: str, smtp_port: int, smtp_timeout: int, sender: str, password: str, recipient: str, message: str):
    with smtplib.SMTP_SSL(smtp_server, smtp_port, timeout=smtp_timeout, context=ssl.create_default_context()) as server:
        server.login(sender, password)
        server.sendmail(sender, [recipient], message)


def _send_via_starttls(smtp_server: str, smtp_port: int, smtp_timeout: int, sender: str, password: str, recipient: str, message: str):
    with smtplib.SMTP(smtp_server, smtp_port, timeout=smtp_timeout) as server:
        server.ehlo()
        server.starttls(context=ssl.create_default_context())
        server.ehlo()
        server.login(sender, password)
        server.sendmail(sender, [recipient], message)


def send_email(recipient: str | None, subject: str, body: str, attachments: list[str] | None = None):
    sender = os.getenv("SMTP_SENDER")
    password = os.getenv("SMTP_PASSWORD", "").replace(" ", "")
    smtp_server = os.getenv("SMTP_SERVER")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_timeout = int(os.getenv("SMTP_TIMEOUT", "10"))
    use_ssl = os.getenv("SMTP_USE_SSL", "").lower() in {"1", "true", "yes"} or smtp_port == 465

    if not recipient:
        raise ValueError("Email recipient must be set")

    if not sender or not password or not smtp_server:
        raise ValueError("SMTP_SENDER, SMTP_PASSWORD, and SMTP_SERVER must be set")

    msg = MIMEMultipart()
    msg["From"] = sender
    msg["To"] = recipient
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "html", "utf-8"))

    if attachments:
        for attachment_path in attachments:
            try:
                with open(attachment_path, "rb") as attachment:
                    part = MIMEBase("application", "octet-stream")
                    part.set_payload(attachment.read())
                    encoders.encode_base64(part)
                    part.add_header("Content-Disposition", f"attachment; filename={os.path.basename(attachment_path)}")
                    msg.attach(part)
            except FileNotFoundError:
                raise ValueError(f"Attachment file not found: {attachment_path}") from None

    attempts = []

    try:
        if use_ssl:
            attempts.append(("SSL", smtp_port, _send_via_ssl))
            if smtp_port == 465:
                attempts.append(("STARTTLS", 587, _send_via_starttls))
        else:
            attempts.append(("STARTTLS", smtp_port, _send_via_starttls))
            if smtp_port == 587:
                attempts.append(("SSL", 465, _send_via_ssl))

        errors = []
        for mode_name, attempt_port, sender_fn in attempts:
            try:
                sender_fn(
                    smtp_server=smtp_server,
                    smtp_port=attempt_port,
                    smtp_timeout=smtp_timeout,
                    sender=sender,
                    password=password,
                    recipient=recipient,
                    message=msg.as_string(),
                )
                return
            except (OSError, ssl.SSLError, smtplib.SMTPException) as exc:
                errors.append(f"{mode_name} on {smtp_server}:{attempt_port} -> {exc.__class__.__name__}: {exc}")

        raise RuntimeError("; ".join(errors) if errors else f"Unable to send email via {smtp_server}:{smtp_port}")
    except (OSError, ssl.SSLError, smtplib.SMTPException) as exc:
        raise RuntimeError(f"Unable to send email via {smtp_server}:{smtp_port}: {exc.__class__.__name__}: {exc}") from exc


def _event_from_response(response: APIResponse) -> dict:
    if not response.data:
        raise ValueError("Event response is empty")
    return response.data[0]


def send_new_event_email(
    admin_email: str | None,
    user_email: str,
    data: dict,
    validation_url: str,
    rejection_url: str,
):
    user_subject, user_body = new_event_user_template(data)
    admin_subject, admin_body = new_event_admin_template(data, validation_url, rejection_url)

    send_email(user_email, user_subject, user_body)
    send_email(admin_email, admin_subject, admin_body)


def send_validation_email(admin_email: str | None, recipient: str, response: APIResponse, attachments: list[str] | None = None):
    event = _event_from_response(response)
    user_subject, user_body = event_validated_user_template(event)
    admin_subject, admin_body = event_validated_admin_template(event)

    send_email(recipient, user_subject, user_body, attachments=attachments)
    send_email(admin_email, admin_subject, admin_body, attachments=attachments)


def send_rejection_email(admin_email: str | None, recipient: str, response: APIResponse):
    event = _event_from_response(response)
    user_subject, user_body = event_rejected_user_template(event)
    admin_subject, admin_body = event_rejected_admin_template(event)

    send_email(recipient, user_subject, user_body)
    send_email(admin_email, admin_subject, admin_body)
