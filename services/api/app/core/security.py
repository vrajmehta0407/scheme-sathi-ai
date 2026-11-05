from fastapi import HTTPException, Security, status
from fastapi.security import APIKeyHeader
from app.core.config import settings
import logging

api_key_header = APIKeyHeader(name="X-Admin-Secret", auto_error=False)
logger = logging.getLogger("schemesathi")

def verify_admin_key(api_key: str = Security(api_key_header)) -> bool:
    if not api_key or api_key != settings.ADMIN_SECRET:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing admin credentials."
        )
    return True

SENSITIVE_KEYS = {"aadhaar", "otp", "password", "pin", "bank_account", "pan"}

def sanitize_profile_for_logging(data: dict) -> dict:
    """Ensure no accidentally submitted sensitive identifiers are logged."""
    sanitized = {}
    for k, v in data.items():
        if any(s in k.lower() for s in SENSITIVE_KEYS):
            sanitized[k] = "[REDACTED]"
        elif isinstance(v, dict):
            sanitized[k] = sanitize_profile_for_logging(v)
        else:
            sanitized[k] = v
    return sanitized
