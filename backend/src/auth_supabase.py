import os
from typing import Any

from supabase import Client, create_client

from src.db.supabase_client import get_supabase


def is_supabase_auth_enabled() -> bool:
    url = os.getenv("SUPABASE_URL", "").strip()
    anon = os.getenv("SUPABASE_ANON_KEY", "").strip()
    return bool(url and anon and get_supabase() is not None)


def _anon_client() -> Client | None:
    url = os.getenv("SUPABASE_URL", "").strip()
    anon = os.getenv("SUPABASE_ANON_KEY", "").strip()
    if not url or not anon:
        return None
    return create_client(url, anon)


def _profile_to_user(profile: dict[str, Any]) -> dict[str, str]:
    return {
        "id": profile["id"],
        "email": profile["email"],
        "name": profile["name"],
        "role": profile.get("role", "Senior Recruiter"),
        "department": profile.get("department", "Talent Acquisition"),
        "initials": profile.get("initials", "R"),
    }


def _default_initials(name: str) -> str:
    parts = [part for part in name.split() if part]
    if not parts:
        return "R"
    if len(parts) == 1:
        return parts[0][:1].upper()
    return f"{parts[0][:1]}{parts[-1][:1]}".upper()


def get_or_create_profile(user_id: str, email: str, metadata: dict | None = None) -> dict[str, str] | None:
    admin = get_supabase()
    if not admin:
        return None

    metadata = metadata or {}
    existing = (
        admin.table("recruiter_profiles")
        .select("*")
        .eq("id", user_id)
        .limit(1)
        .execute()
    )

    if existing.data:
        return _profile_to_user(existing.data[0])

    name = metadata.get("name") or email.split("@")[0].replace(".", " ").title()
    profile_row = {
        "id": user_id,
        "email": email,
        "name": name,
        "role": metadata.get("role", "Senior Recruiter"),
        "department": metadata.get("department", "Talent Acquisition"),
        "initials": metadata.get("initials") or _default_initials(name),
    }
    inserted = admin.table("recruiter_profiles").insert(profile_row).execute()
    if inserted.data:
        return _profile_to_user(inserted.data[0])
    return _profile_to_user(profile_row)


def login_with_supabase(email: str, password: str) -> dict[str, Any] | None:
    client = _anon_client()
    if not client:
        return None

    try:
        response = client.auth.sign_in_with_password(
            {"email": email.strip().lower(), "password": password}
        )
    except Exception:
        return None

    session = response.session
    user = response.user
    if not session or not user or not user.email:
        return None

    metadata = user.user_metadata or {}
    profile = get_or_create_profile(user.id, user.email, metadata)
    if not profile:
        return None

    expires_in = 3600
    if session.expires_in:
        expires_in = int(session.expires_in)

    return {
        "user": profile,
        "token": session.access_token,
        "refresh_token": session.refresh_token,
        "expires_in_hours": max(1, expires_in // 3600),
        "provider": "supabase",
    }


def verify_supabase_token(token: str) -> dict[str, str] | None:
    client = _anon_client()
    if not client or not token:
        return None

    try:
        response = client.auth.get_user(token)
    except Exception:
        return None

    user = response.user if response else None
    if not user or not user.email:
        return None

    profile = get_or_create_profile(user.id, user.email, user.user_metadata or {})
    return profile
