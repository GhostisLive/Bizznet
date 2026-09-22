from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db

# Import all models so SQLModel.metadata.create_all can see them
from app.modules.network.models import Organization, Facility  # noqa: F401
from app.modules.marketplace.models import Listing  # noqa: F401
from app.modules.provenance.models import ProvenanceRecord, ListingProvenanceSnapshot  # noqa: F401
from app.modules.negotiation.models import Negotiation, NegotiationBid  # noqa: F401

# Import routers
from app.modules.network.router import router as network_router
from app.modules.marketplace.router import router as marketplace_router
from app.modules.provenance.router import router as provenance_router
from app.modules.negotiation.router import router as negotiation_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
    await init_db()


# Include routers
app.include_router(network_router, prefix=settings.API_V1_STR)
app.include_router(marketplace_router, prefix=settings.API_V1_STR)
app.include_router(provenance_router, prefix=settings.API_V1_STR)
app.include_router(negotiation_router, prefix=settings.API_V1_STR)


@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
    }
