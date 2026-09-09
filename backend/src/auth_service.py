import base64
import hashlib
import hmac
import json
import os
import time
from typing import Any


def _hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


RECRUITER_ACCOUNTS: list[dict[str, str]] = [
    {
        "id": "rec-ramiyaa",
        "email": "ramiyaa@company.com",
        "password_hash": _hash_password("Recruit@2024"),
        "name": "Ramiyaa",
        "role": "Senior Recruiter",
        "initials": "R",
        "department": "Talent Acquisition",
    },
    {
        "id": "rec-admin",
        "email": "admin@company.com",
        "password_hash": _hash_password("Admin@2024"),
        "name": "Admin User",
        "role": "HR Manager",
        "initials": "AU",
        "department": "Human Resources",
    },
]


def _auth_secret() -> str:
    return os.getenv("AUTH_SECRET", "ai-recruit-dev-secret-change-in-production")


def _public_user(account: dict[str, str]) -> dict[str, str]:
    return {
        "id": account["id"],
        "email": account["email"],
        "name": account["name"],
        "role": account["role"],
        "initials": account["initials"],
        "department": account.get("department", "Talent Acquisition"),
    }


def authenticate_recruiter(email: str, password: str) -> dict[str, Any] | None:
    normalized = email.strip().lower()
    password_hash = _hash_password(password)

    for account in RECRUITER_ACCOUNTS:
        if account["email"] == normalized and account["password_hash"] == password_hash:
            user = _public_user(account)
            token = create_access_token(user["id"], user["email"])
            return {"user": user, "token": token, "expires_in_hours": 24}
    return None


def create_access_token(user_id: str, email: str, hours: int = 24) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": int(time.time()) + hours * 3600,
    }
    data = base64.urlsafe_b64encode(json.dumps(payload).encode("utf-8")).decode("utf-8")
    signature = hmac.new(
        _auth_secret().encode("utf-8"),
        data.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return f"{data}.{signature}"


def verify_access_token(token: str) -> dict[str, Any] | None:
    if not token or "." not in token:
        return None

    data, signature = token.rsplit(".", 1)
    expected = hmac.new(
        _auth_secret().encode("utf-8"),
        data.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(signature, expected):
        return None

    try:
        payload = json.loads(base64.urlsafe_b64decode(data.encode("utf-8")).decode("utf-8"))
    except (json.JSONDecodeError, ValueError):
        return None

    if int(payload.get("exp", 0)) < int(time.time()):
        return None

    user_id = payload.get("sub")
    for account in RECRUITER_ACCOUNTS:
        if account["id"] == user_id:
            return _public_user(account)
    return None
