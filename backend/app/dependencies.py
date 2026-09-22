from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

# pyrefly: ignore [missing-import]
from app.database import get_db
# pyrefly: ignore [missing-import]
from app.auth.security import verify_token
# pyrefly: ignore [missing-import]
from app.auth.models import JWTPayload, CurrentUser
# pyrefly: ignore [missing-import]
from app.modules.network.models import Organization


async def get_current_user(
    payload: JWTPayload = Depends(verify_token),
    db: AsyncSession = Depends(get_db),
) -> CurrentUser:
    """
    Fetches the organization record matching the user's Auth subject ID,
    determining their role permissions.
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
        return CurrentUser(
            id=payload.sub,
            email=payload.email,
            role=meta_role,
            organization_id=payload.sub,
        )

    if org.status == "suspended":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organization account has been suspended by administrator.",
        )

    return CurrentUser(
        id=payload.sub,
        email=payload.email,
        role=org.role,
        organization_id=org.id,
    )


def require_role(allowed_roles: list[str]):
    """Returns a dependency that asserts the current user owns one of the allowed roles."""

    async def role_dependency(
        current_user: CurrentUser = Depends(get_current_user),
    ):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Action requires one of the following roles: {allowed_roles}",
            )
        return current_user

    return role_dependency
