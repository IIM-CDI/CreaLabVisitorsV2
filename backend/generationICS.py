from datetime import datetime
from uuid import uuid4
from zoneinfo import ZoneInfo

from icalendar import Calendar, Event, vCalAddress, vText


def creer_invitation_ics(
    sujet: str,
    debut: datetime,
    fin: datetime,
    organisateur: str,
    participants: list[str],
    description: str = "",
    lieu: str = "",
    uid: str = None,
    sequence: int = 0,
    method: str = "REQUEST",
    fichier: str = "invitation.ics",
) -> str:
    if uid is None:
        uid = f"{uuid4()}@crealab-visitors"
    
    calendrier = Calendar()
    calendrier.add("prodid", "-//CreaLab Visitors//FR")
    calendrier.add("version", "2.0")
    calendrier.add("method", method)
    calendrier.add("calscale", "GREGORIAN")

    evenement = Event()
    evenement.add("uid", uid)
    evenement.add("summary", sujet)
    evenement.add("dtstart", debut)
    evenement.add("dtend", fin)
    evenement.add("dtstamp", datetime.now(ZoneInfo("UTC")))
    
    if description:
        evenement.add("description", description)
    
    if lieu:
        evenement.add("location", lieu)
    
    evenement.add("status", "CONFIRMED" if method == "REQUEST" else "CANCELLED")
    evenement.add("sequence", sequence)

    # Ajouter l'organisateur
    organisateur_ics = vCalAddress(f"MAILTO:{organisateur}")
    organisateur_ics.params["CN"] = vText(organisateur)
    organisateur_ics.params["ROLE"] = vText("CHAIR")
    evenement["organizer"] = organisateur_ics

    # Ajouter les participants
    for email in participants:
        participant = vCalAddress(f"MAILTO:{email}")
        participant.params["CN"] = vText(email)
        participant.params["ROLE"] = vText("REQ-PARTICIPANT")
        participant.params["RSVP"] = vText("TRUE")
        participant.params["PARTSTAT"] = vText("NEEDS-ACTION")
        evenement.add("attendee", participant, encode=0)

    calendrier.add_component(evenement)

    with open(fichier, "wb") as fichier_ics:
        fichier_ics.write(calendrier.to_ical())

    return fichier