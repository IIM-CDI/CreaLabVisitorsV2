from fastapi import FastAPI
from supabase import create_client
from dotenv import load_dotenv
import bcrypt
import os

#INITITLAISATION

load_dotenv()

app = FastAPI()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

#FONCTIONS PRATIQUES

def verify_email(email: str) -> bool:
    return "@edu.devinci.fr" in email or "@devinci.fr" in email

def get_role(email: str) -> str:
    return "etudiant" if "@edu.devinci.fr" in email else "staff"

def get_prenom_nom(email: str) -> tuple[str, str]:
    prenom_nom = email.split("@")[0]
    prenom, nom = prenom_nom.split(".")
    return prenom.capitalize(), nom.capitalize()

def time_to_str(time) -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%S")

#ROUTES UTILISATEURS

@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.post("/user/")
async def create_user(email: str, password: str):
    if not email:
        return {"message": "Email is required"}
    if not verify_email(email):
        return {"message": "Invalid email address"}
    if supabase.table("CreaLab_visitors").select("*").eq("email", email).execute().data:
        return {"message": "User already exists"}
    prenom, nom = get_prenom_nom(email)
    if not password:
        return {"message": "Password is required"}
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    role = get_role(email)
    supabase.table("CreaLab_visitors").insert({"first_name": prenom, "last_name": nom, "email": email, "password": hashed_password, "role": role}).execute()
    return {"message": "User created", "email": email, "prenom": prenom, "nom": nom, "role": role}

@app.post("/login/")
async def login(email: str, password: str):
    if not email or not password:
        return {"message": "Email and password are required"}
    response = supabase.table("CreaLab_visitors").select("*").eq("email", email).execute()
    if not response.data:
        return {"message": "User not found"}
    user = response.data[0]
    if bcrypt.checkpw(password.encode('utf-8'), user["password"].encode('utf-8')):
        return {"message": "Login successful"}
    else:
        return {"message": "Incorrect password"}

@app.put("/user/")
async def update_user(email: str, new_password: str):
    if not email or not new_password:
        return {"message": "Email and new password are required"}
    response = supabase.table("CreaLab_visitors").select("*").eq("email", email).execute()
    if not response.data:
        return {"message": "User not found"}
    hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    supabase.table("CreaLab_visitors").update({"password": hashed_password}).eq("email", email).execute()
    return {"message": "Password updated"}

@app.delete("/user/")
async def delete_user(email: str):
    if not email:
        return {"message": "Email is required"}
    response = supabase.table("CreaLab_visitors").select("*").eq("email", email).execute()
    if not response.data:
        return {"message": "User not found"}
    supabase.table("CreaLab_visitors").delete().eq("email", email).execute()
    return {"message": "User deleted"}

#ROUTES EVENEMENTS

@app.post("/event/")
async def create_event(title:str, user_mail:str, start:str, end:str, color:str):
    if not title or not user_mail or not start or not end or not color:
        return {"message": "All fields are required"}
    if end <= start:
        return {"message": "End time must be after start time"}
    response = supabase.table("CreaLab_visitors").select("first_name", "last_name").eq("email", user_mail).execute()
    if not response.data:
        return {"message": "User not found"}
    user = response.data[0]
    supabase.table("CreaLab_events").insert({"title": title, "user": user, "user_mail": user_mail, "start": start, "startStr": time_to_str(start), "end": end, "endStr": time_to_str(end), "duration": end - start, "color": color, "accepted": False}).execute()
    return {"message": "Event created"}

@app.get("/events/")
async def get_events():
    response = supabase.table("CreaLab_events").select("*").execute()
    return {"events": response.data}

@app.delete("/event/")
async def delete_event(event_id: int):
    if not event_id:
        return {"message": "Event ID is required"}
    response = supabase.table("CreaLab_events").select("*").eq("id", event_id).execute()
    if not response.data:
        return {"message": "Event not found"}
    supabase.table("CreaLab_events").delete().eq("id", event_id).execute()
    return {"message": "Event deleted"}


# import bcrypt
# pw = b'GeekPassword'
# s = bcrypt.gensalt()
# h = bcrypt.hashpw(pw, s) # Hash password
# entered_pw = b'GeekPassword'

# if bcrypt.checkpw(entered_pw, h):
#     print("Password match!")
# else:
#     print("Incorrect password.")