from datetime import timedelta
from html import escape

from datetime_utils import format_human_datetime, get_event_datetime

BRAND_NAME = "Creativ'Lab"
TEXT_COLOR = "#2b2f33"
MUTED_COLOR = "#667085"
BACKGROUND_COLOR = "#f3f6f8"
CARD_BORDER_COLOR = "#d9e2ec"
PRIMARY_COLOR = "#1565c0"
SUCCESS_COLOR = "#198754"
DANGER_COLOR = "#c62828"


def _safe(value: object) -> str:
    return escape(str(value or ""))


def _plain(value: object) -> str:
    return str(value or "")


def _format_duration(duration: timedelta) -> str:
    total_minutes = max(0, int(duration.total_seconds() // 60))
    hours, minutes = divmod(total_minutes, 60)
    if hours and minutes:
        return f"{hours} h {minutes:02d}"
    if hours:
        return f"{hours} h"
    return f"{minutes} min"


def _event_period(event: dict) -> str:
    return (
        f"{format_human_datetime(get_event_datetime(event, 'start'))}"
        f" - {format_human_datetime(get_event_datetime(event, 'end'))}"
    )


def _event_duration(event: dict) -> str:
    return _format_duration(
        get_event_datetime(event, "end") - get_event_datetime(event, "start")
    )


def _button(label: str, url: str, color: str) -> str:
    return f"""
        <a href="{escape(url, quote=True)}"
           style="display: inline-block; margin: 6px 8px 6px 0; padding: 12px 18px; border-radius: 6px; background: {color}; color: #ffffff; font-weight: 700; text-decoration: none;">
            {escape(label)}
        </a>
    """


def _details_table(event: dict, include_description: bool = True) -> str:
    description_row = ""
    if include_description:
        description_row = f"""
            <tr>
                <td style="padding: 8px 0; color: {MUTED_COLOR}; width: 155px;">Description</td>
                <td style="padding: 8px 0; color: {TEXT_COLOR};">{_safe(event.get('description'))}</td>
            </tr>
        """

    return f"""
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; margin: 18px 0;">
            <tr>
                <td style="padding: 8px 0; color: {MUTED_COLOR}; width: 155px;">Événement</td>
                <td style="padding: 8px 0; color: {TEXT_COLOR}; font-weight: 700;">{_safe(event.get('title'))}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: {MUTED_COLOR}; width: 155px;">Demandeur</td>
                <td style="padding: 8px 0; color: {TEXT_COLOR};">{_safe(event.get('user'))}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: {MUTED_COLOR}; width: 155px;">E-mail</td>
                <td style="padding: 8px 0; color: {TEXT_COLOR};">{_safe(event.get('user_mail'))}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: {MUTED_COLOR}; width: 155px;">Date / heure</td>
                <td style="padding: 8px 0; color: {TEXT_COLOR};">{_event_period(event)}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: {MUTED_COLOR}; width: 155px;">Durée</td>
                <td style="padding: 8px 0; color: {TEXT_COLOR};">{_event_duration(event)}</td>
            </tr>
            <tr>
                <td style="padding: 8px 0; color: {MUTED_COLOR}; width: 155px;">Type</td>
                <td style="padding: 8px 0; color: {TEXT_COLOR};">{_safe(event.get('badge'))}</td>
            </tr>
            {description_row}
        </table>
    """


def _layout(title: str, subtitle: str, content: str, color: str) -> str:
    return f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{escape(title)}</title>
</head>
<body style="margin: 0; padding: 24px; background: {BACKGROUND_COLOR}; font-family: Arial, Helvetica, sans-serif; color: {TEXT_COLOR};">
    <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid {CARD_BORDER_COLOR}; border-radius: 8px; overflow: hidden;">
        <div style="padding: 22px 26px; background: {color}; color: #ffffff;">
            <div style="font-size: 13px; font-weight: 700; letter-spacing: 0; text-transform: uppercase;">{BRAND_NAME}</div>
            <h1 style="margin: 8px 0 0; font-size: 22px; line-height: 1.25;">{escape(title)}</h1>
            <p style="margin: 8px 0 0; font-size: 14px; line-height: 1.45;">{escape(subtitle)}</p>
        </div>
        <div style="padding: 24px 26px; font-size: 15px; line-height: 1.55;">
            {content}
        </div>
        <div style="padding: 14px 26px; background: #f8fafc; border-top: 1px solid {CARD_BORDER_COLOR}; color: {MUTED_COLOR}; font-size: 12px;">
            Message automatique du système de gestion des événements {BRAND_NAME}.
        </div>
    </div>
</body>
</html>"""


def new_event_user_template(event: dict) -> tuple[str, str]:
    subject = f"Demande d'événement reçue - {_plain(event.get('title'))}"
    content = f"""
        <p>Bonjour {_safe(event.get('user'))},</p>
        <p>Votre demande d'événement a bien été envoyée à l'équipe du {BRAND_NAME}. Elle est maintenant en attente de validation.</p>
        <div style="margin: 18px 0; padding: 14px 16px; border-left: 4px solid {PRIMARY_COLOR}; background: #eef5ff; border-radius: 6px; color: #174a86;">
            Vous recevrez un nouvel e-mail dès que l'événement sera validé ou refusé.
        </div>
        {_details_table(event)}
        <p>Cordialement,<br>L'équipe {BRAND_NAME}</p>
    """
    return subject, _layout(
        "Demande d'événement reçue",
        "Votre proposition est en cours d'examen.",
        content,
        PRIMARY_COLOR,
    )


def new_event_admin_template(
    event: dict, validation_url: str, rejection_url: str
) -> tuple[str, str]:
    subject = f"Nouvel événement à valider - {_plain(event.get('title'))}"
    content = f"""
        <p>Bonjour,</p>
        <p>Une nouvelle demande d'événement attend une décision administrative.</p>
        {_details_table(event)}
        <div style="margin: 20px 0 4px;">
            {_button("Valider l'événement", validation_url, SUCCESS_COLOR)}
            {_button("Refuser l'événement", rejection_url, DANGER_COLOR)}
        </div>
        <p style="margin-top: 18px; color: {MUTED_COLOR}; font-size: 13px;">Ces boutons appliquent directement la décision dans l'application.</p>
    """
    return subject, _layout(
        "Nouvel événement à valider",
        "Une action admin est requise.",
        content,
        PRIMARY_COLOR,
    )


def event_validated_user_template(event: dict) -> tuple[str, str]:
    subject = f"Événement validé - {_plain(event.get('title'))}"
    content = f"""
        <p>Bonjour {_safe(event.get('user'))},</p>
        <p>Votre événement <strong>{_safe(event.get('title'))}</strong> a été validé par l'équipe du {BRAND_NAME}.</p>
        <div style="margin: 18px 0; padding: 14px 16px; border-left: 4px solid {SUCCESS_COLOR}; background: #edf7f1; border-radius: 6px; color: #0f5132;">
            L'invitation calendrier ICS est jointe à cet e-mail pour ajouter l'événement à votre agenda.
        </div>
        {_details_table(event)}
        <p>Cordialement,<br>L'équipe {BRAND_NAME}</p>
    """
    return subject, _layout(
        "Événement validé",
        "La demande est confirmée.",
        content,
        SUCCESS_COLOR,
    )


def event_validated_admin_template(event: dict) -> tuple[str, str]:
    subject = f"Événement confirmé - {_plain(event.get('title'))}"
    content = f"""
        <p>Bonjour,</p>
        <p>L'événement <strong>{_safe(event.get('title'))}</strong> est maintenant confirmé.</p>
        <div style="margin: 18px 0; padding: 14px 16px; border-left: 4px solid {SUCCESS_COLOR}; background: #edf7f1; border-radius: 6px; color: #0f5132;">
            L'invitation calendrier ICS est jointe à cet e-mail.
        </div>
        {_details_table(event)}
    """
    return subject, _layout(
        "Événement confirmé",
        "La validation a été enregistrée.",
        content,
        SUCCESS_COLOR,
    )


def event_rejected_user_template(event: dict) -> tuple[str, str]:
    subject = f"Événement annulé - {_plain(event.get('title'))}"
    content = f"""
        <p>Bonjour {_safe(event.get('user'))},</p>
        <p>Votre événement <strong>{_safe(event.get('title'))}</strong> ne pourra pas être maintenu et a été annulé par l'équipe du {BRAND_NAME}.</p>
        {_details_table(event)}
        <p>Vous pouvez contacter l'équipe du {BRAND_NAME} si vous souhaitez proposer une nouvelle date ou adapter votre demande.</p>
        <p>Cordialement,<br>L'équipe {BRAND_NAME}</p>
    """
    return subject, _layout(
        "Événement annulé",
        "La demande n'a pas été retenue.",
        content,
        DANGER_COLOR,
    )


def event_rejected_admin_template(event: dict) -> tuple[str, str]:
    subject = f"Refus confirmé - {_plain(event.get('title'))}"
    content = f"""
        <p>Bonjour,</p>
        <p>Le refus de l'événement <strong>{_safe(event.get('title'))}</strong> a été enregistré.</p>
        {_details_table(event)}
    """
    return subject, _layout(
        "Refus confirmé",
        "La demande a été supprimée du calendrier.",
        content,
        DANGER_COLOR,
    )


def event_deleted_user_template(event: dict) -> tuple[str, str]:
    subject = f"Événement supprimé - {_plain(event.get('title'))}"
    content = f"""
        <p>Bonjour {_safe(event.get('user'))},</p>
        <p>L'événement <strong>{_safe(event.get('title'))}</strong> a été supprimé du calendrier du {BRAND_NAME}.</p>
        <p>Vous pouvez contacter l'équipe du {BRAND_NAME} si vous souhaitez plus d'informations.</p>
        <div style="margin: 18px 0; padding: 14px 16px; border-left: 4px solid {DANGER_COLOR}; background: #fff1f0; border-radius: 6px; color: #8a1f17;">
            Le fichier ICS joint permet de retirer cet événement de votre agenda.
        </div>
        {_details_table(event)}
        <p>Cordialement,<br>L'équipe {BRAND_NAME}</p>
    """
    return subject, _layout(
        "Événement supprimé",
        "L'événement a été retiré du calendrier.",
        content,
        DANGER_COLOR,
    )


def event_deleted_admin_template(event: dict) -> tuple[str, str]:
    subject = f"Suppression d'événement - {_plain(event.get('title'))}"
    content = f"""
        <p>Bonjour,</p>
        <p>L'événement <strong>{_safe(event.get('title'))}</strong> a été supprimé du calendrier du {BRAND_NAME}.</p>
        <div style="margin: 18px 0; padding: 14px 16px; border-left: 4px solid {DANGER_COLOR}; background: #fff1f0; border-radius: 6px; color: #8a1f17;">
            Le fichier ICS joint permet de retirer cet événement de l'agenda administratif.
        </div>
        {_details_table(event)}
    """
    return subject, _layout(
        "Suppression d'événement",
        "La suppression a été enregistrée.",
        content,
        DANGER_COLOR,
    )
