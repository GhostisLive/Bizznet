from fastapi import Security, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.config import settings
from app.auth.models import JWTPayload, CurrentUser
from uuid import UUID

security = HTTPBearer()

def get_supabase_claims(token: str) -> dict:
    """
    Decodes and cryptographically verifies the Supabase JWT.
    SUPABASE_JWT_SECRET must be set; unverified decoding is not permitted.
    """
    if not settings.SUPABASE_JWT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Server misconfiguration: SUPABASE_JWT_SECRET is not set.",
        )
    try:
        return jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False},
        )
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {e}",
        )

async def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)) -> JWTPayload:
    """Verifies the bearer token and returns decoded claims."""
    token = credentials.credentials
    claims = get_supabase_claims(token)
    
    sub = claims.get("sub")
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="JWT token payload missing subject (sub)"
        )
        
    return JWTPayload(
        sub=UUID(sub),
        email=claims.get("email"),
        app_metadata=claims.get("app_metadata", {}),
        user_metadata=claims.get("user_metadata", {})
    )
