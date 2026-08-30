from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database import get_db
from app.auth.security import verify_token
from app.auth.models import JWTPayload, CurrentUser
from sqlmodel import SQLModel

# We will define a minimal inline Organization model to query the database.
# In a full model layout this matches app.modules.network.models.
class UserOrganizationPlaceholder(SQLModel, table=False):
    id: str
    role: str
    status: str

async def get_current_user(
    payload: JWTPayload = Depends(verify_token),
    db: AsyncSession = Depends(get_db)
) -> CurrentUser:
    """
    Fetches the organization record matching the user's Auth subject ID,
    determining their role permissions.
    """
    # Dynamic SQL execution to fetch user organization profile
    from sqlalchemy import text
    query = text("SELECT id, role, status FROM public.organizations WHERE id = :id")
    result = await db.execute(query, {"id": str(payload.sub)})
    row = result.fetchone()
    
    if not row:
        # Fallback to metadata role if database is empty / not synced yet in sandbox mode
        meta_role = payload.user_metadata.get("role") or payload.app_metadata.get("role") or "manufacturer"
        return CurrentUser(
            id=payload.sub,
            email=payload.email,
            role=meta_role,
            organization_id=payload.sub
        )
        
    org_id, role, status = row
    if status == "suspended":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organization account has been suspended by administrator."
        )
        
    return CurrentUser(
        id=payload.sub,
        email=payload.email,
        role=role,
        organization_id=payload.sub
    )

def require_role(allowed_roles: list[str]):
    """
    Returns a dependency that asserts the current user owns one of the allowed roles.
    """
    async def role_dependency(current_user: CurrentUser = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Action requires one of the following roles: {allowed_roles}"
            )
        return current_user
    return role_dependency
