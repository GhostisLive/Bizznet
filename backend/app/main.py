from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from app.config import settings
from app.database import init_db

# Import all models so SQLModel.metadata.create_all can see them
from app.modules.network.models import Organization, Facility  # noqa: F401
from app.modules.marketplace.models import Listing  # noqa: F401
from app.modules.provenance.models import ProvenanceRecord, ListingProvenanceSnapshot  # noqa: F401
from app.modules.negotiation.models import Negotiation, NegotiationBid, NegotiationDocument  # noqa: F401
from app.modules.rfq.models import RFQ, RFQBid  # noqa: F401
from app.modules.orders.models import Order, OrderStatusHistory, OrderDocument  # noqa: F401
from app.modules.products.models import Product  # noqa: F401

# Import routers
from app.modules.network.router import router as network_router
from app.modules.marketplace.router import router as marketplace_router
from app.modules.provenance.router import router as provenance_router
from app.modules.negotiation.router import router as negotiation_router
from app.modules.rfq.router import router as rfq_router
from app.modules.orders.router import router as orders_router
from app.modules.products.router import router as products_router
from app.modules.dashboard.router import router as dashboard_router
from app.auth.router import router as auth_router


@asynccontextmanager
async def lifespan(_: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include routers
app.include_router(network_router, prefix=settings.API_V1_STR)
app.include_router(marketplace_router, prefix=settings.API_V1_STR)
app.include_router(provenance_router, prefix=settings.API_V1_STR)
app.include_router(negotiation_router, prefix=settings.API_V1_STR)
app.include_router(rfq_router, prefix=settings.API_V1_STR)
app.include_router(orders_router, prefix=settings.API_V1_STR)
app.include_router(products_router, prefix=settings.API_V1_STR)
app.include_router(dashboard_router, prefix=settings.API_V1_STR)
app.include_router(auth_router, prefix=settings.API_V1_STR + "/auth")


@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
    }


def dev():
    """Run development server with hot reload."""
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
