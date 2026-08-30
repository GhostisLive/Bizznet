from pydantic import BaseModel, EmailStr
from uuid import UUID

class JWTPayload(BaseModel):
    sub: UUID                # matches auth.users.id
    email: EmailStr | None = None
    role: str | None = None
    app_metadata: dict = {}
    user_metadata: dict = {}

class CurrentUser(BaseModel):
    id: UUID
    email: EmailStr | None = None
    role: str                # resolved role (supplier, manufacturer, etc.)
    organization_id: UUID    # matches organizations.id (same as user.id in our setup)
