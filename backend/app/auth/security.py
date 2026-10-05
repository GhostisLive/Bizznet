from fastapi import Security, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.config import settings
from app.auth.models import JWTPayload
from uuid import UUID
import time
import base64
import json

security = HTTPBearer()


def decode_token_payload(token: str) -> dict:
    """Decode JWT payload, handling Supabase's malformed 'is_anonymous':6false bug."""
    parts = token.split('.')
    if len(parts) != 3:
        raise JWTError("Invalid token format")
    
    payload_b64 = parts[1]
    payload_b64 += '=' * (-len(payload_b64) % 4)
    payload_bytes = base64.urlsafe_b64decode(payload_b64)
    payload_str = payload_bytes.decode('utf-8')
    
    # Fix Supabase bug: "is_anonymous":6false -> "is_anonymous":false
    payload_str = payload_str.replace('"is_anonymous":6false', '"is_anonymous":false')
    payload_str = payload_str.replace('"is_anonymous":6true', '"is_anonymous":true')
    
    return json.loads(payload_str)


async def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)) -> JWTPayload:
    """
    Development token verification with Supabase bug workaround.
    Decodes token without signature verification (trusts Supabase-issued tokens).
    WARNING: Only for development! In production, always verify signatures.
    """
    token = credentials.credentials
    
    try:
        # Decode with Supabase bug fix
        claims = decode_token_payload(token)
        
        # Basic validation
        sub = claims.get("sub")
        if not sub:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token missing subject (sub)",
            )
        
        # Check expiration
        exp = claims.get("exp")
        if exp and exp < time.time():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired",
            )
        
        print(f"DEBUG: Token accepted for {claims.get('email')} (sub: {sub})")
        
        return JWTPayload(
            sub=UUID(sub),
            email=claims.get("email"),
            app_metadata=claims.get("app_metadata", {}),
            user_metadata=claims.get("user_metadata", {})
        )
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}",
        )