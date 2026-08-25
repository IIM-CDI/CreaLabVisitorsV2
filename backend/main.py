import os
import re
from datetime import timedelta
from html import escape

import bcrypt
from datetime_utils import (
    get_event_datetime,
    parse_user_datetime,
    to_database_datetime,
    to_local_datetime_string,
)
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from generationICS import creer_invitation_ics
from mailing import (
    send_deletion_email,
    send_new_event_email,
    send_rejection_email,
    send_validation_email,
)
from pydantic import BaseModel
from supabase import create_client

#INITITLAISATION

load_dotenv()

app = FastAPI()

FRONTEND_URL = os.getenv("FRONTEND_URL")
PUBLIC_API_URL = os.getenv("BACKEND_URL")

allow_origins = [FRONTEND_URL.strip()]


def notify_admin_or_log(action: str, callback, *args, **kwargs):
    try:
        callback(*args, **kwargs)
    except (FileNotFoundError, OSError, RuntimeError, ValueError) as exc:
        print(f"{action} failed: {exc}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_origin_regex=r"^https://crealabvisitorsv2(?:-\d+)?\.onrender\.com$",
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


class UserCredentials(BaseModel):
    email: str
    password: str


class PasswordUpdateRequest(BaseModel):
    email: str
    new_password: str


class EventCreateRequest(BaseModel):
    title: str
    description: str | None = None
    user_mail: str
    start: str
    end: str
    color: str
    badge: str

#FONCTIONS PRATIQUES

EMAIL_PATTERN = re.compile(r"^[\w.+-]+@(?:edu\.)?devinci\.fr$", re.IGNORECASE)


def normalize_email(email: str) -> str:
    return email.strip().lower()

def verify_email(email: str) -> bool:
    return bool(EMAIL_PATTERN.fullmatch(email.strip()))

def get_role(email: str) -> str:
    return "etudiant" if email.endswith("@edu.devinci.fr") else "staff"

def get_prenom_nom(email: str) -> tuple[str, str]:
    prenom_nom = email.split("@")[0]
    prenom, nom = prenom_nom.split(".", 1)
    if not prenom or not nom:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le mail doit être au format prenom.nom@(edu.)devinci.fr",
        )
    return prenom.capitalize(), nom.capitalize()

def ensure_text(value: str, field_name: str) -> str:
    cleaned_value = value.strip()
    if not cleaned_value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{field_name} est requis",
        )
    return cleaned_value


def get_admin_email() -> str | None:
    return (
        os.getenv("SMTP_SENDER")
    )


def build_event_action_url(request: Request, action: str, event_id: int) -> str:
    base_url = PUBLIC_API_URL or str(request.base_url)
    return f"{base_url.rstrip('/')}/event/{action}/{event_id}"


def render_event_action_page(title: str, message: str, color: str, status_code: int = 200) -> HTMLResponse:
    return HTMLResponse(
        content=f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{escape(title)}</title>
</head>
<body style="margin: 0; padding: 32px; background: #f3f6f8; font-family: Arial, Helvetica, sans-serif; color: #2b2f33;">
    <main style="max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #d9e2ec; border-radius: 8px; overflow: hidden;">
        <div style="padding: 22px 26px; background: {color}; color: #ffffff;">
            <h1 style="margin: 0; font-size: 22px;">{escape(title)}</h1>
        </div>
        <div style="padding: 24px 26px; font-size: 15px; line-height: 1.55;">
            <p>{escape(message)}</p>
        </div>
    </main>
</body>
</html>""",
        status_code=status_code,
    )


def get_event_response_or_404(event_id: int):
    if not event_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="l'ID de l'événement est requis")
    response = supabase.table("CreaLab_events").select("*").eq("id", event_id).execute()
    if not response.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evénement non trouvé")
    return response


def is_event_accepted(event: dict) -> bool:
    return event.get("accepted") is True or str(event.get("accepted")).lower() == "true"


def is_admin_user(user: dict) -> bool:
    return user.get("admin") is True or str(user.get("admin")).lower() == "true"


def unique_emails(*emails: str | None) -> list[str]:
    recipients = []
    for email in emails:
        if not email:
            continue
        normalized_email = normalize_email(email)
        if normalized_email not in recipients:
            recipients.append(normalized_email)
    return recipients


def get_event_ics_path(event_id: int, suffix: str = "") -> str:
    return os.path.join("/tmp", f"crealab-event-{event_id}{suffix}.ics")


def get_existing_event_ics_uid(event_id: int) -> str | None:
    try:
        with open(get_event_ics_path(event_id), encoding="utf-8") as ics_file:
            for line in ics_file:
                if line.startswith("UID:"):
                    return line.removeprefix("UID:").strip()
    except OSError:
        return None

    return None


def get_event_ics_uid(event_id: int) -> str:
    return f"crealab-event-{event_id}@crealab-visitors"


def create_event_ics(event_id: int, event: dict, method: str = "REQUEST") -> str:
    method = method.upper()
    is_cancellation = method == "CANCEL"
    suffix = "-cancel" if is_cancellation else ""
    uid = (
        get_existing_event_ics_uid(event_id)
        if is_cancellation and is_event_accepted(event)
        else None
    )

    return creer_invitation_ics(
        sujet=event["title"],
        debut=get_event_datetime(event, "start"),
        fin=get_event_datetime(event, "end"),
        organisateur=event["user_mail"],
        participants=unique_emails(event["user_mail"], get_admin_email()),
        description=event.get("description") or "",
        lieu="CreaLab",
        uid=uid or get_event_ics_uid(event_id),
        sequence=1 if is_cancellation else 0,
        method=method,
        fichier=get_event_ics_path(event_id, suffix),
    )


def get_requester_or_404(requester_email: str) -> dict:
    normalized_email = normalize_email(ensure_text(requester_email, "Requester email"))
    if not verify_email(normalized_email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Adresse email invalide")

    response = supabase.table("CreaLab_visitors").select("*").eq("email", normalized_email).execute()
    if not response.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur non trouvé")

    requester = dict(response.data[0])
    requester["email"] = normalized_email
    return requester


def ensure_event_deletion_allowed(event: dict, requester_email: str):
    requester = get_requester_or_404(requester_email)
    if is_admin_user(requester):
        return

    if normalize_email(event.get("user_mail", "")) == requester["email"]:
        return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Vous ne pouvez supprimer que vos propres événements",
    )


def validate_event_and_notify(event_id: int):
    response = get_event_response_or_404(event_id)
    event = response.data[0]
    if is_event_accepted(event):
        return response, False

    supabase.table("CreaLab_events").update({"accepted": True}).eq("id", event_id).execute()
    event["accepted"] = True
    ics_path = create_event_ics(event_id, event)
    print(f"ICS file created: {ics_path}")
    notify_admin_or_log(
        "Validation notification",
        send_validation_email,
        admin_email=get_admin_email(),
        recipient=event["user_mail"],
        response=response,
        attachments=[ics_path],
    )
    return response, True


def reject_event_and_notify(event_id: int):
    response = get_event_response_or_404(event_id)
    if is_event_accepted(response.data[0]):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Un événement déjà validé ne peut pas être refusé",
        )

    supabase.table("CreaLab_events").delete().eq("id", event_id).execute()
    notify_admin_or_log(
        "Rejection notification",
        send_rejection_email,
        admin_email=get_admin_email(),
        recipient=response.data[0]["user_mail"],
        response=response,
    )
    return response


def delete_event_and_notify(event_id: int, requester_email: str):
    response = get_event_response_or_404(event_id)
    event = response.data[0]
    ensure_event_deletion_allowed(event, requester_email)

    ics_path = create_event_ics(event_id, event, method="CANCEL")
    supabase.table("CreaLab_events").delete().eq("id", event_id).execute()
    notify_admin_or_log(
        "Deletion notification",
        send_deletion_email,
        admin_email=get_admin_email(),
        recipient=event["user_mail"],
        response=response,
        attachments=[ics_path],
    )
    return response

#ROUTES HEALTH

@app.get("/")
async def root():
    return {"message": "Hello World"}

#ROUTES UTILISATEURS

@app.get("/user/{email}")
async def get_user(email: str):
    normalized_email = normalize_email(email)
    response = supabase.table("CreaLab_visitors").select("*").eq("email", normalized_email).execute()
    if not response.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur non trouvé")
    user = dict(response.data[0])
    user.pop("password", None)
    return {"user": user}

@app.post("/user/")
async def create_user(payload: UserCredentials):
    email = normalize_email(ensure_text(payload.email, "Email"))
    password = ensure_text(payload.password, "Password")
    if not verify_email(email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Adresse email invalide")
    if supabase.table("CreaLab_visitors").select("*").eq("email", email).execute().data:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="L'utilisateur existe déjà")
    prenom, nom = get_prenom_nom(email)
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    role = get_role(email)
    supabase.table("CreaLab_visitors").insert({"first_name": prenom, "last_name": nom, "email": email, "password": hashed_password, "role": role}).execute()
    return {"message": "User created", "email": email, "prenom": prenom, "nom": nom, "role": role}

@app.post("/login/")
async def login(payload: UserCredentials):
    email = normalize_email(ensure_text(payload.email, "Email"))
    password = ensure_text(payload.password, "Password")
    if not verify_email(email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Adresse email invalide")
    response = supabase.table("CreaLab_visitors").select("*").eq("email", email).execute()
    if not response.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur non trouvé")
    user = response.data[0]
    try:
        if bcrypt.checkpw(password.encode('utf-8'), user["password"].encode('utf-8')):
            safe_user = dict(user)
            safe_user.pop("password", None)
            return {"message": "Login successful", "user": safe_user}
    except (KeyError, ValueError):
        pass
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Adresse email ou mot de passe incorrect")

@app.put("/user/")
async def update_user(payload: PasswordUpdateRequest):
    email = normalize_email(ensure_text(payload.email, "Email"))
    new_password = ensure_text(payload.new_password, "New password")
    response = supabase.table("CreaLab_visitors").select("*").eq("email", email).execute()
    if not response.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur non trouvé")
    hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    supabase.table("CreaLab_visitors").update({"password": hashed_password}).eq("email", email).execute()
    return {"message": "Password updated"}

@app.delete("/user/")
async def delete_user(email: str):
    normalized_email = normalize_email(ensure_text(email, "Email"))
    response = supabase.table("CreaLab_visitors").select("*").eq("email", normalized_email).execute()
    if not response.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur non trouvé")
    supabase.table("CreaLab_visitors").delete().eq("email", normalized_email).execute()
    return {"message": "User deleted"}

#ROUTES EVENEMENTS

@app.post("/event/")
async def create_event(payload: EventCreateRequest, request: Request):
    title = ensure_text(payload.title, "Title")
    description = (payload.description or "").strip()
    user_mail = normalize_email(ensure_text(payload.user_mail, "User mail"))
    start = ensure_text(payload.start, "Start")
    end = ensure_text(payload.end, "End")
    color = ensure_text(payload.color, "Color")
    badge = ensure_text(payload.badge, "Badge")
    if not verify_email(user_mail):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Adresse email invalide")
    try:
        start_dt = parse_user_datetime(start)
        end_dt = parse_user_datetime(end)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Format de date invalide")
    if end_dt <= start_dt:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="L'heure de fin doit être après l'heure de début")
    if end_dt - start_dt < timedelta(minutes=30):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="La durée de l'événement ne peut pas être inférieure à 30 minutes")
    response = supabase.table("CreaLab_visitors").select("first_name", "last_name").eq("email", user_mail).execute()
    if not response.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Utilisateur non trouvé")
    user = response.data[0].get("first_name") + " " + response.data[0].get("last_name")
    id_response = supabase.table("CreaLab_events").select("id").order("id", desc=True).limit(1).execute()
    next_id = 1 if not id_response.data else int(id_response.data[0]["id"]) + 1
    start_str = to_local_datetime_string(start_dt)
    end_str = to_local_datetime_string(end_dt)
    supabase.table("CreaLab_events").insert({"id": next_id, "title": title, "description": description, "user": user, "user_mail": user_mail, "start": to_database_datetime(start_dt), "startStr": start_str, "end": to_database_datetime(end_dt), "endStr": end_str, "duration": str(end_dt - start_dt), "color": color, "badge": badge, "accepted": False}).execute()
    notify_admin_or_log(
        "New event notification",
        send_new_event_email,
        admin_email=get_admin_email(),
        user_email=user_mail,
        data={
            "id": next_id,
            "title": title,
            "description": description,
            "user": user,
            "user_mail": user_mail,
            "start": start_str,
            "end": end_str,
            "badge": badge,
        },
        validation_url=build_event_action_url(request, "validate", next_id),
        rejection_url=build_event_action_url(request, "reject", next_id),
    )
    return {"message": "Event created", "id": next_id}

@app.get("/events/")
async def get_events():
    response = supabase.table("CreaLab_events").select("*").execute()
    return {"events": response.data}

@app.delete("/event/reject/{event_id}")
async def delete_event(event_id: int):
    reject_event_and_notify(event_id)
    return {"message": "Event deleted"}


@app.delete("/event/{event_id}")
async def delete_existing_event(event_id: int, requester_email: str):
    delete_event_and_notify(event_id, requester_email)
    return {"message": "Event deleted"}


@app.get("/event/reject/{event_id}", response_class=HTMLResponse)
async def reject_event_from_email(event_id: int):
    try:
        response = reject_event_and_notify(event_id)
    except HTTPException as exc:
        return render_event_action_page(
            "Action impossible",
            str(exc.detail),
            "#c62828",
            status_code=exc.status_code,
        )
    return render_event_action_page(
        "Refus confirmé",
        f"L'événement {response.data[0]['title']} a bien été refusé.",
        "#c62828",
    )


@app.put("/event/validate/{event_id}")
async def update_event(event_id: int):
    _, updated = validate_event_and_notify(event_id)
    return {"message": "Event updated" if updated else "Event already validated"}


@app.get("/event/validate/{event_id}", response_class=HTMLResponse)
async def validate_event_from_email(event_id: int):
    try:
        response, updated = validate_event_and_notify(event_id)
    except HTTPException as exc:
        return render_event_action_page(
            "Action impossible",
            str(exc.detail),
            "#c62828",
            status_code=exc.status_code,
        )
    if not updated:
        return render_event_action_page(
            "Événement déjà validé",
            f"L'événement {response.data[0]['title']} était déjà validé. Aucun nouvel e-mail n'a été envoyé.",
            "#198754",
        )
    return render_event_action_page(
        "Événement validé",
        f"L'événement {response.data[0]['title']} a bien été validé.",
        "#198754",
    )
