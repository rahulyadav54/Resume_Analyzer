from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

from src.auth_service import authenticate_recruiter, verify_access_token
from src.auth_supabase import (
    is_supabase_auth_enabled,
    login_with_supabase,
    verify_supabase_token,
)

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginPayload(BaseModel):
    email: str = Field(min_length=3)
    password: str = Field(min_length=6)


@router.get("/status")
def auth_status():
    return {
        "supabase_auth": is_supabase_auth_enabled(),
        "mode": "supabase" if is_supabase_auth_enabled() else "local",
    }


@router.post("/login")
def login(payload: LoginPayload):
    if is_supabase_auth_enabled():
        result = login_with_supabase(payload.email, payload.password)
        if not result:
            raise HTTPException(status_code=401, detail="Invalid email or password.")

        return {
            "message": "Login successful",
            "user": result["user"],
            "token": result["token"],
            "refresh_token": result.get("refresh_token"),
            "expires_in_hours": result["expires_in_hours"],
            "provider": "supabase",
        }

    result = authenticate_recruiter(payload.email, payload.password)
    if not result:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    return {
        "message": "Login successful",
        "user": result["user"],
        "token": result["token"],
        "expires_in_hours": result["expires_in_hours"],
        "provider": "local",
    }


@router.get("/me")
def me(authorization: str | None = Header(default=None)):
    token = _extract_token(authorization)
    if not token:
        raise HTTPException(status_code=401, detail="Session expired or invalid.")

    if is_supabase_auth_enabled():
        user = verify_supabase_token(token)
        if user:
            return {"user": user, "provider": "supabase"}

    user = verify_access_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Session expired or invalid.")
    return {"user": user, "provider": "local"}


@router.post("/logout")
def logout():
    return {"message": "Logged out successfully"}


def _extract_token(authorization: str | None) -> str | None:
    if not authorization:
        return None
    if authorization.lower().startswith("bearer "):
        return authorization[7:].strip()
    return authorization.strip()
