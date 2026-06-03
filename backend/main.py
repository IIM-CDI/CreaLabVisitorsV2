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

#ROUTES UTILISATEURS

@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.post("/user/")
async def create_user(email: str, password: str):
    if not verify_email(email):
        return {"message": "Invalid email address"}
    prenom, nom = get_prenom_nom(email)
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

#ROUTES EVENEMENTS






# import bcrypt
# pw = b'GeekPassword'
# s = bcrypt.gensalt()
# h = bcrypt.hashpw(pw, s) # Hash password
# entered_pw = b'GeekPassword'

# if bcrypt.checkpw(entered_pw, h):
#     print("Password match!")
# else:
#     print("Incorrect password.")