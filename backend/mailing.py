import datetime
import os
import smtplib
import ssl
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from postgrest import APIResponse

# EMAIL SMTP SYSTEM

def send_email(recipient: str, subject: str, body: str):
    sender = os.getenv("SMTP_SENDER")
    password = os.getenv("SMTP_PASSWORD", "").replace(" ", "")
    smtp_server = os.getenv("SMTP_SERVER")
    smtp_port = int(os.getenv("SMTP_PORT", 587))
    smtp_timeout = int(os.getenv("SMTP_TIMEOUT", 10))
    use_ssl = os.getenv("SMTP_USE_SSL", "").lower() in {"1", "true", "yes"} or smtp_port == 465

    if not sender or not password or not smtp_server:
        raise ValueError("SMTP_SENDER, SMTP_PASSWORD, and SMTP_SERVER must be set")

    msg = MIMEMultipart()
    msg["From"] = sender
    msg["To"] = recipient
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "html"))

    try:
        if use_ssl:
            with smtplib.SMTP_SSL(smtp_server, smtp_port, timeout=smtp_timeout, context=ssl.create_default_context()) as server:
                server.login(sender, password)
                server.sendmail(sender, [recipient], msg.as_string())
        else:
            with smtplib.SMTP(smtp_server, smtp_port, timeout=smtp_timeout) as server:
                server.ehlo()
                server.starttls(context=ssl.create_default_context())
                server.ehlo()
                server.login(sender, password)
                server.sendmail(sender, [recipient], msg.as_string())
    except Exception as exc:
        raise RuntimeError(f"Unable to send email via {smtp_server}:{smtp_port}") from exc

def send_validation_email(recipient:str, response: APIResponse):
    subject="Événement Creativ'Lab accepté"
    body=f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Événement accepté</title>
</head>
<body style="font-family: Arial, Helvetica, sans-serif; color: #333; background-color: #f7f7f7; padding: 20px; margin: 0;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
        <div style="padding: 20px 24px; background: #0b5ed7; color: #ffffff;">
            <h2 style="margin: 0; font-size: 20px;">Événement accepté</h2>
        </div>
        <div style="padding: 20px; line-height: 1.5; color: #333;">
            <p>Bonjour {response.data[0]['user']},</p>
            <p>Nous sommes heureux de vous informer que votre événement <strong>"{response.data[0]['title']}"</strong> a été <strong>accepté</strong> par l'équipe du Creativ'Lab.</p>
            <p style="margin: 12px 0;"><strong>Détails :</strong></p>
            <ul style="margin: 8px 0; padding-left: 20px;">
                <li>Titre : {response.data[0]['title']}</li>
                <li>Organisateur : {response.data[0]['user']}</li>
                <li>Date / heure : {response.data[0]['start']} → {response.data[0]['end']}</li>
            </ul>
            <p>Si vous avez des questions ou souhaitez modifier des informations, répondez simplement à cet e‑mail ou contactez-nous via le panneau d'administration.</p>
            <p>Cordialement,<br>L'équipe Creativ'Lab</p>
        </div>
        <div style="padding: 12px 20px; background: #f1f1f1; color: #666; font-size: 12px; text-align: center;">
            Merci de respecter les règles du laboratoire et de bien préparer votre matériel avant l'événement.
        </div>
    </div>
</body>
</html>"""
    send_email(recipient, subject, body)
    

def send_rejection_email(recipient:str, response: APIResponse):
    subject="Événement Creativ'Lab refusé"
    body=f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Événement rejeté</title>
</head>
<body style="font-family: Arial, Helvetica, sans-serif; color: #333; background-color: #f7f7f7; padding: 20px; margin: 0;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
        <div style="padding: 20px 24px; background: #dc3545; color: #ffffff;">
            <h2 style="margin: 0; font-size: 20px;">Événement rejeté</h2>
        </div>
        <div style="padding: 20px; line-height: 1.5; color: #333;">
            <p>Bonjour {response.data[0]['user']},</p>
            <p>Nous sommes désolés de vous informer que votre événement <strong>"{response.data[0]['title']}"</strong> a été <strong>rejeté</strong> par l'équipe du Creativ'Lab.</p>
            <p style="margin: 12px 0;"><strong>Détails :</strong></p>
            <ul style="margin: 8px 0; padding-left: 20px;">
                <li>Titre : {response.data[0]['title']}</li>
                <li>Organisateur : {response.data[0]['user']}</li>
                <li>Date / heure proposée : {response.data[0]['start']} → {response.data[0]['end']}</li>
            </ul>
            <p>Si vous avez des questions concernant cette décision ou souhaitez discuter des raisons du rejet, n'hésitez pas à nous contacter via le panneau d'administration.</p>
            <p>Cordialement,<br>L'équipe Creativ'Lab</p>
        </div>
        <div style="padding: 12px 20px; background: #f1f1f1; color: #666; font-size: 12px; text-align: center;">
            Merci de votre intérêt pour le laboratoire. Nous vous encourageons à réessayer avec une autre proposition.
        </div>
    </div>
</body>
</html>"""
    send_email(recipient, subject, body)
    
def send_new_event_email(recipient:str, data: dict):
    subject="Nouvel événement Creativ'Lab"
    body=f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Nouvel événement à valider</title>
</head>
<body style="font-family: Arial, Helvetica, sans-serif; color: #333; background-color: #f7f7f7; padding: 20px; margin: 0;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">
        <div style="padding: 20px 24px; background: #0b5ed7; color: #ffffff;">
                    <h2 style="margin: 0; font-size: 20px;">Nouvel événement à examiner</h2>
        </div>
        <div style="padding: 20px; line-height: 1.5; color: #333;">
                    <p>Bonjour l'équipe du Creativ'Lab,</p>
                    <p>Un nouvel événement a été soumis et attend votre validation.</p>
                    <p style="margin: 12px 0;"><strong>Informations de l'événement :</strong></p>
            <ul style="margin: 8px 0; padding-left: 20px;">
                <li>Titre : {data.get('title')}</li>
                <li>Description : {data.get('description')}</li>
                        <li>Demandeur : {data.get('user')}</li>
                        <li>Adresse e-mail : {data.get('user_mail')}</li>
                <li>Date / heure proposée : {data.get('start')} → {data.get('end')}</li>
                <li>Durée : {datetime.fromisoformat(data.get('end')) - datetime.fromisoformat(data.get('start'))}</li>
                        <li>Couleur : {data.get('color')}</li>
                        <li>Badge : {data.get('badge')}</li>
            </ul>
                    <p>Merci de vérifier cet événement et de le valider ou le refuser depuis l'interface d'administration.</p>
                    <p>Cordialement,<br>Système Creativ'Lab</p>
        </div>
        <div style="padding: 12px 20px; background: #f1f1f1; color: #666; font-size: 12px; text-align: center;">
                    Cet e-mail est destiné aux administrateurs du Creativ'Lab.
        </div>
    </div>
</body>
</html>"""
    send_email(recipient, subject, body)