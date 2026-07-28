from datetime import datetime, timezone
from zoneinfo import ZoneInfo


LOCAL_TIMEZONE = ZoneInfo("Europe/Paris")


def parse_datetime(value: str | datetime) -> datetime:
    if isinstance(value, datetime):
        return value
    return datetime.fromisoformat(value.strip().replace("Z", "+00:00"))


def parse_user_datetime(value: str | datetime) -> datetime:
    parsed_datetime = parse_datetime(value)
    if parsed_datetime.tzinfo is None:
        return parsed_datetime.replace(tzinfo=LOCAL_TIMEZONE)
    return parsed_datetime.astimezone(LOCAL_TIMEZONE)


def to_database_datetime(value: datetime) -> str:
    return value.astimezone(timezone.utc).isoformat()


def to_local_datetime_string(value: str | datetime) -> str:
    return parse_user_datetime(value).strftime("%Y-%m-%dT%H:%M:%S")


def parse_stored_event_datetime(value: str | datetime) -> datetime:
    parsed_datetime = parse_datetime(value)
    if parsed_datetime.tzinfo is None:
        return parsed_datetime.replace(tzinfo=LOCAL_TIMEZONE)
    return parsed_datetime.replace(tzinfo=None).replace(tzinfo=LOCAL_TIMEZONE)


def get_event_datetime(event: dict, key: str) -> datetime:
    local_key = f"{key}Str"
    if event.get(local_key):
        return parse_user_datetime(event[local_key])
    return parse_stored_event_datetime(event[key])


def format_human_datetime(value: str | datetime) -> str:
    return parse_user_datetime(value).strftime("%d/%m/%Y à %H:%M")
