import os
import re
from datetime import datetime

import bcrypt
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from generationICS import creer_invitation_ics
from mailing import send_new_event_email, send_rejection_email, send_validation_email
from pydantic import BaseModel
from supabase import create_client

#INITITLAISATION

load_dotenv()

app = FastAPI()

FRONTEND_URL = os.getenv("FRONTEND_URL")
FRONTEND_URLS = os.getenv("FRONTEND_URLS")

allow_origins = ["http://localhost:3000"]
if FRONTEND_URLS:
    allow_origins = [origin.strip() for origin in FRONTEND_URLS.split(",") if origin.strip()]
elif FRONTEND_URL:
    allow_origins = [FRONTEND_URL]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_origin_regex=r"^https://crealabvisitorsv2(-\d+)?\.onrender\.com$",
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
    description: str
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
            detail="Email must follow prenom.nom@(edu.)devinci.fr format",
        )
    return prenom.capitalize(), nom.capitalize()

def time_to_str(time) -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%S")


def ensure_text(value: str, field_name: str) -> str:
    cleaned_value = value.strip()
    if not cleaned_value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{field_name} is required",
        )
    return cleaned_value

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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user = dict(response.data[0])
    user.pop("password", None)
    return {"user": user}

@app.post("/user/")
async def create_user(payload: UserCredentials):
    email = normalize_email(ensure_text(payload.email, "Email"))
    password = ensure_text(payload.password, "Password")
    if not verify_email(email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid email address")
    if supabase.table("CreaLab_visitors").select("*").eq("email", email).execute().data:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User already exists")
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
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid email address")
    response = supabase.table("CreaLab_visitors").select("*").eq("email", email).execute()
    if not response.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user = response.data[0]
    try:
        if bcrypt.checkpw(password.encode('utf-8'), user["password"].encode('utf-8')):
            safe_user = dict(user)
            safe_user.pop("password", None)
            return {"message": "Login successful", "user": safe_user}
    except (KeyError, ValueError):
        pass
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")

@app.put("/user/")
async def update_user(payload: PasswordUpdateRequest):
    email = normalize_email(ensure_text(payload.email, "Email"))
    new_password = ensure_text(payload.new_password, "New password")
    response = supabase.table("CreaLab_visitors").select("*").eq("email", email).execute()
    if not response.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    supabase.table("CreaLab_visitors").update({"password": hashed_password}).eq("email", email).execute()
    return {"message": "Password updated"}

@app.delete("/user/")
async def delete_user(email: str):
    normalized_email = normalize_email(ensure_text(email, "Email"))
    response = supabase.table("CreaLab_visitors").select("*").eq("email", normalized_email).execute()
    if not response.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    supabase.table("CreaLab_visitors").delete().eq("email", normalized_email).execute()
    return {"message": "User deleted"}

#ROUTES EVENEMENTS

@app.post("/event/")
async def create_event(payload: EventCreateRequest):
    title = ensure_text(payload.title, "Title")
    description = ensure_text(payload.description, "Description")
    user_mail = normalize_email(ensure_text(payload.user_mail, "User mail"))
    start = ensure_text(payload.start, "Start")
    end = ensure_text(payload.end, "End")
    color = ensure_text(payload.color, "Color")
    badge = ensure_text(payload.badge, "Badge")
    if not verify_email(user_mail):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid email address")
    try:
        start_dt = datetime.fromisoformat(start)
        end_dt = datetime.fromisoformat(end)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid date format")
    if end_dt <= start_dt:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="End time must be after start time")
    response = supabase.table("CreaLab_visitors").select("first_name", "last_name").eq("email", user_mail).execute()
    if not response.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user = response.data[0].get("first_name") + " " + response.data[0].get("last_name")
    id_response = supabase.table("CreaLab_events").select("id").order("id", desc=True).limit(1).execute()
    next_id = 1 if not id_response.data else int(id_response.data[0]["id"]) + 1
    supabase.table("CreaLab_events").insert({"id": next_id, "title": title, "description": description, "user": user, "user_mail": user_mail, "start": start, "startStr": time_to_str(start_dt), "end": end, "endStr": time_to_str(end_dt), "duration": str(end_dt - start_dt), "color": color, "badge": badge, "accepted": False}).execute()
    send_new_event_email(
        recipient=os.getenv("SMTP_SENDER"),
        data={
            "title": title,
            "description": description,
            "user": user,
            "user_mail": user_mail,
            "start": start,
            "end": end,
            "color": color,
            "badge": badge
        }
    )
    return {"message": "Event created", "id": next_id}

@app.get("/events/")
async def get_events():
    response = supabase.table("CreaLab_events").select("*").execute()
    return {"events": response.data}

@app.delete("/event/reject/{event_id}")
async def delete_event(event_id: int):
    if not event_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Event ID is required")
    response = supabase.table("CreaLab_events").select("*").eq("id", event_id).execute()
    if not response.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    supabase.table("CreaLab_events").delete().eq("id", event_id).execute()
    send_rejection_email(
        recipient=response.data[0]["user_mail"],
        response=response
    )
    return {"message": "Event deleted"}

@app.put("/event/validate/{event_id}")
async def update_event(event_id: int):
    if not event_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Event ID is required")
    response = supabase.table("CreaLab_events").select("*").eq("id", event_id).execute()
    if not response.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    supabase.table("CreaLab_events").update({"accepted": True}).eq("id", event_id).execute()
    ICS = creer_invitation_ics(
        sujet=response.data[0]["title"],
        debut=datetime.fromisoformat(response.data[0]["start"]),
        fin=datetime.fromisoformat(response.data[0]["end"]),
        organisateur=os.getenv("ADMIN_EMAIL"),
        participants=[response.data[0]["user_mail"]],
        description=response.data[0]["description"],
        lieu="CreaLab",
    )
    print(f"ICS file created: {ICS}")
    send_validation_email(
        recipient=response.data[0]["user_mail"],
        response=response,
        attachments=[ICS]
    )
    return {"message": "Event updated"}