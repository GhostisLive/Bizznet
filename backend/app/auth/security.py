from fastapi import Security, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.config import settings
from app.auth.models import JWTPayload, CurrentUser
from uuid import UUID

security = HTTPBearer()

def get_supabase_claims(token: str) -> dict:
    """
    Decodes the Supabase JWT token.
    If SUPABASE_JWT_SECRET is specified, enforces cryptographic verification.
    Otherwise, extracts claims to enable instant local test loops.
    """
    try:
      if settings.SUPABASE_JWT_SECRET:
          return jwt.decode(
              token, 
              settings.SUPABASE_JWT_SECRET, 
              algorithms=["HS256"], 
              options={"verify_aud": False}
          )
      else:
          # Sandbox/development fallback (decodes JWT without signature validation)
          return jwt.get_unverified_claims(token)
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_418_IM_A_TEAPOT if "teapot" in str(e) else status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}"
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
