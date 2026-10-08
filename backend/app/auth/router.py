from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from app.config import settings
from supabase import create_client, Client
from typing import Any
from app.auth.security import verify_token
from app.auth.models import JWTPayload
from uuid import UUID
from app.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.modules.network.models import Organization

router = APIRouter()


class LoginRequest(BaseModel):
    email: str
    password: str


class SignupRequest(BaseModel):
    email: str
    password: str
    role: str = "manufacturer"


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    user: dict[str, Any]


class UserResponse(BaseModel):
    id: UUID
    email: str
    role: str
    organization_id: UUID


@router.post("/login", response_model=LoginResponse)
async def login(login_request: LoginRequest):
    """
    Authenticate a user with email and password using Supabase Auth.
    Returns the Supabase session tokens and user data.
    """
    try:
        # Initialize Supabase client with anon key (public, safe to use in backend)
        supabase: Client = create_client(
            settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY
        )
        
        # Sign in user with email and password
        response = supabase.auth.sign_in_with_password(
            {
                "email": login_request.email,
                "password": login_request.password,
            }
        )
        
        if not response.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )
        
        session = response.session
        user = response.user
        
        return LoginResponse(
            access_token=session.access_token,
            refresh_token=session.refresh_token,
            user=user.__dict__ if user else {},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Authentication failed: {str(e)}",
        )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    payload: JWTPayload = Depends(verify_token),
    db: AsyncSession = Depends(get_db),
):
    """
    Get the current user's information from the token and database.
    """
    query = select(Organization).where(Organization.id == payload.sub)
    result = await db.execute(query)
    org = result.scalar_one_or_none()

    if not org:
        # Fallback to JWT metadata role if organization not yet registered
        meta_role = (
            payload.user_metadata.get("role")
            or payload.app_metadata.get("role")
            or "manufacturer"
        )
        return UserResponse(
            id=payload.sub,
            email=payload.email,
            role=meta_role,  # Note: This is the raw role from metadata, not normalized
            organization_id=payload.sub,
        )

    return UserResponse(
        id=payload.sub,
        email=payload.email,
        role=org.role,
        organization_id=org.id,
    )


@router.post("/refresh", response_model=LoginResponse)
async def refresh_token(refresh_token: str):
    """
    Refresh the access token using the provided refresh token.
    """
    try:
        # Initialize Supabase client with anon key (public, safe to use in backend)
        supabase: Client = create_client(
            settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY
        )
        
        # Refresh the session
        response = supabase.auth.refresh_session(refresh_token)
        
        if not response.session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )
        
        session = response.session
        user = response.user
        
        return LoginResponse(
            access_token=session.access_token,
            refresh_token=session.refresh_token,
            user=user.__dict__ if user else {},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Token refresh failed: {str(e)}",
        )


@router.post("/logout")
async def logout(authorization: str = None):
    """
    Logout endpoint. Invalidate the session on the client side.
    Note: Since we are using JWTs, token invalidation must be handled client-side
    by removing the tokens. This endpoint can be extended in the future to
    revoke refresh tokens using the service role key if needed.
    """
    # For now, we just return success. The client should remove the tokens.
    return {"message": "Logged out successfully"}