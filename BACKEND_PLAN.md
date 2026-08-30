# BizzNet Backend Architecture & Implementation Plan

This document outlines the detailed architecture, directory layout, database schema, authentication flows, and API endpoints for the BizzNet modular backend monolith.

---

## 1. Directory Structure

The BizzNet backend is structured as a Python modular monolith. Each business domain manages its own routers, database models (via SQLModel), and business logic.

```text
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # Application factory and configuration mounting
│   ├── config.py               # Settings (Pydantic BaseSettings)
│   ├── database.py             # Supabase/PostgreSQL connection engine (Async SQLAlchemy)
│   ├── dependencies.py         # Shared FastAPI dependencies (DB sessions, current user/role)
│   ├── utils/                  # Common utilities (cryptography, paging, formatting)
│   ├── auth/                   # Authentication logic & Supabase JWT verification
│   │   ├── __init__.py
│   │   ├── security.py
│   │   └── models.py
│   └── modules/                # Core domain modules
│       ├── network/            # Business identity, roles, counterparts matching
│       │   ├── router.py
│       │   ├── models.py
│       │   └── service.py
│       ├── marketplace/        # Material/finished goods catalog & RFQs
│       │   ├── router.py
│       │   ├── models.py
│       │   └── service.py
│       ├── provenance/         # Track & verify audit logs, ESG evidence uploads
│       │   ├── router.py
│       │   ├── models.py
│       │   └── service.py
│       ├── negotiation/        # Structured offer/counter-offer state machine
│       │   ├── router.py
│       │   ├── models.py
│       │   └── service.py
│       └── carbon/             # Stage level CO2e lifecycle calculations
│           ├── router.py
│           ├── models.py
│           └── service.py
├── tests/
│   ├── conftest.py             # Pytest configuration, DB fixtures, mock JWT auth
│   ├── test_auth.py
│   └── modules/                # Domain-specific test files
├── docker-compose.yml          # Local infra services (PostgreSQL, Redis, Elasticsearch)
├── Dockerfile                  # Multi-stage production container
├── pyproject.toml              # Poetry dependencies, Ruff, and Mypy configuration
└── README.md                   # Local setup instructions
```

---

## 2. Tech Stack & Dependencies

| Tool / Library | Role | Details |
|---|---|---|
| **Python 3.12** | Runtime | Modern type hinting, performance updates |
| **FastAPI** | Web Framework | High-performance, asynchronous endpoints |
| **SQLModel** | ORM | Combines SQLAlchemy with Pydantic for validation and models |
| **asyncpg** | Database Driver | Asynchronous PostgreSQL communication |
| **Supabase Auth** | IAM | User signup, session validation, and tenant isolation |
| **Supabase RLS** | Authorization | Database-level data scoping based on roles and claims |
| **Redis** | Cache / Queue Broker | Stores temporal states, caches matching data, and acts as Celery broker |
| **Celery** | Dispatcher | Manages async tasks (emissions calculations, matching updates, email notices) |
| **Elasticsearch** | Search Engine | Powers high-speed marketplace facets (filter-by-provenance, keywords) |
| **Pytest** | Testing | Full integration testing with transaction rollbacks |
| **Ruff / Mypy** | Quality | Fast linting, styling, and strict static type checking |

---

## 3. Database Schema Design (Supabase PostgreSQL)

We use SQLModel to define backend representations mapping directly to physical PostgreSQL tables.

### 3.1 Core Entity Schema (`app/modules/network/models.py`)

#### `organizations`
Stores central enterprise identities.
- `id`: UUID (Primary Key, matches Supabase Auth user metadata association if applicable)
- `name`: VARCHAR(255)
- `tax_id`: VARCHAR(100) (Unique)
- `role`: VARCHAR(50) (Enum: `raw_material_supplier`, `manufacturer`, `distributor`, `retailer`, `transporter`, `auditor`, `admin`)
- `status`: VARCHAR(50) (Enum: `pending_verification`, `verified`, `suspended`)
- `created_at`: TZ DATETIME (Default: `now()`)
- `updated_at`: TZ DATETIME

#### `facilities`
Farms, refineries, manufacturing sites, warehouses.
- `id`: UUID (Primary Key)
- `organization_id`: UUID (Foreign Key -> `organizations.id`)
- `name`: VARCHAR(255)
- `location`: GEOMETRY(POINT, 4326) / JSONB
- `carbon_intensity_factor`: DECIMAL(10, 4)

---

### 3.2 Marketplace Schema (`app/modules/marketplace/models.py`)

#### `listings`
Catalog items showing standard MOQs and prices.
- `id`: UUID (Primary Key)
- `organization_id`: UUID (Foreign Key -> `organizations.id`)
- `facility_id`: UUID (Foreign Key -> `facilities.id`)
- `title`: VARCHAR(255)
- `description`: TEXT
- `category`: VARCHAR(100) (Facetted: e.g., `steel`, `plastics`, `textiles`)
- `price`: DECIMAL(15, 2)
- `currency`: VARCHAR(3) (Default: `INR`)
- `moq`: DECIMAL(12, 2)
- `unit`: VARCHAR(20) (e.g., `MT`, `kg`, `meters`)
- `created_at`: TZ DATETIME

#### `listing_provenance_snapshots`
Ensures that once a listing is posted, its provenance state is snapshotted to guarantee audit trail continuity.
- `id`: UUID (Primary Key)
- `listing_id`: UUID (Foreign Key -> `listings.id`)
- `confidence_score`: DECIMAL(5, 2)
- `provenance_grade`: VARCHAR(50) (Enum: `self_reported`, `audited`, `verified`)
- `active_provenance_records`: JSONB (Array of raw verified certificates)

---

### 3.3 Provenance & ESG Schema (`app/modules/provenance/models.py`)

#### `provenance_records`
Immutable audit register.
- `id`: UUID (Primary Key)
- `organization_id`: UUID (Foreign Key -> `organizations.id`)
- `type`: VARCHAR(50) (Enum: `self_reported`, `audited`, `verified`)
- `verifying_party`: VARCHAR(255) (Nullable)
- `evidence_url`: VARCHAR(512) (Reference to document in Supabase Storage vault)
- `verified_at`: TZ DATETIME (Nullable)
- `expiration_date`: TZ DATETIME (Nullable)
- `payload`: JSONB (Attributes, wages metrics, scope emissions reports)

---

### 3.4 Negotiation Schema (`app/modules/negotiation/models.py`)

#### `negotiations`
Main thread tracking overall transaction setup.
- `id`: UUID (Primary Key)
- `buyer_id`: UUID (Foreign Key -> `organizations.id`)
- `seller_id`: UUID (Foreign Key -> `organizations.id`)
- `listing_id`: UUID (Foreign Key -> `listings.id`)
- `status`: VARCHAR(50) (Enum: `active`, `terms_locked`, `contract_signed`, `completed`, `cancelled`)
- `created_at`: TZ DATETIME

#### `negotiation_bids`
Individual, structured offers.
- `id`: UUID (Primary Key)
- `negotiation_id`: UUID (Foreign Key -> `negotiations.id`)
- `sender_id`: UUID (Foreign Key -> `organizations.id`)
- `price`: DECIMAL(15, 2)
- `moq`: DECIMAL(12, 2)
- `provenance_requirement`: VARCHAR(50) (Must match or exceed this constraint)
- `terms`: TEXT
- `timestamp`: TZ DATETIME (Default: `now()`)

---

## 4. Authentication & Role-Based Access (RLS)

All traffic hitting the modular monolith goes through JWT Validation.
1. The frontend authenticates directly with Supabase.
2. The frontend sends the Bearer JWT token in the `Authorization` header of API requests to the FastAPI backend.
3. The FastAPI app resolves the public key of the Supabase Auth instance and decodes the JWT locally.
4. Custom claims mapping:
   - User context is unpacked (organization mapping).
   - RLS handles row visibility based on organizational contexts.
5. In addition to RLS, FastAPI's `Depends` filters endpoints by enterprise role. E.g.:
```python
def require_role(allowed_roles: list[str]):
    async def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(status_code=403, detail="Insufficient role privileges")
        return current_user
    return role_checker
```

---

## 5. Core API Endpoints

### 5.1 Onboarding & Network Matching (`/api/v1/network/`)
- `POST /register`: Registers organization attributes and assigns supply-chain role context.
- `GET /counterparts`: Dynamically lists potential matching organizations within compatible sectors (e.g., manufacturers see transporters and raw suppliers, but not unrelated retailers).

### 5.2 Marketplace (`/api/v1/marketplace/`)
- `GET /listings/`: Queries materials with filter parameters (category, price, MOQ, provenance grade). Indexed via Elasticsearch.
- `POST /listings/`: Creates a material or finished goods entry. Mounts a `listing_provenance_snapshots`.
- `GET /listings/{id}`: Retrieves details including verified ESG credentials.

### 5.3 Provenance Operations (`/api/v1/provenance/`)
- `POST /evidence/upload`: Signs a temporary pre-signed URL to upload documentation to the Supabase Storage bucket vault.
- `POST /record/create`: Generates an immutable `provenance_record` indicating verification hierarchy.

### 5.4 Negotiation Engine (`/api/v1/negotiations/`)
- `POST /initiate`: Opens state thread between matching counterparts attached to a product listing.
- `POST /{id}/bid`: Submits a structured offer containing target purchase price, amount, and minimum required provenance grade.
- `POST /{id}/lock`: Locks terms when both parties agree on a bid state. Once terms lock, matching contract details become read-only.

---

## 6. Background Jobs & Caching (Redis/Celery)

Background operations are isolated using Celery to prevent API thread starvation:

1. **Carbon Footprint Computations**:
   - Updates `carbon_intensity_factor` indices based on geographic distance and shipment route profiles whenever order updates lock.
2. **Elasticsearch Index Sync**:
   - Updates search index mapping dynamically on listing creations, updates, or when provenance status evolves.
3. **Notification Orchestration**:
   - Publishes WebSocket events to active users inside matched rooms during active bid updates.

---

## 7. Quality Gateways & Local Development

### 7.1 Setup and Diagnostics
- Developers launch PostgreSQL, Elasticsearch, and Redis dependencies using Docker Compose.
- Python dependencies are package-managed using Poetry.
- The project configures Ruff for code vetting:
```toml
# pyproject.toml configuration snippet
[tool.ruff]
line-length = 88
target-version = "py312"
select = ["E", "F", "W", "I", "B"]
```

### 7.2 Testing Suite
Tests execute against a local PostgreSQL docker database with migrations spun up at runtime.
- Mock headers bypass Supabase auth and simulate custom user/role context.
- All requests run within rollback transactions.
- Expected coverage limit target is set to `80%`.
