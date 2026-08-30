# Bizznet

Bizznet is a collaborative commerce and B2B workflow platform.

## File Structure

The project has a monorepo structure containing both the frontend and backend applications:

```
├── backend/                  # Python FastAPI Backend
│   ├── app/                  # Main application source code
│   │   ├── auth/             # User authentication and security
│   │   ├── modules/          # Business domains
│   │   │   ├── marketplace/  # B2B product listing and search
│   │   │   ├── negotiation/  # Smart contract deal terms
│   │   │   ├── network/      # Relationship management
│   │   │   └── provenance/   # Cryptographic supply chain tracking
│   │   ├── config.py         # Configuration settings
│   │   ├── database.py       # DB setup
│   │   ├── dependencies.py   # FastAPI dependency injections
│   │   └── main.py           # Backend entrypoint API
│   ├── pyproject.toml        # Python dependencies and packaging
│   └── uv.lock               # Fast Python package lockfile
│
├── frontend/                 # Next.js React Frontend
│   ├── src/
│   │   ├── app/              # Next.js App Router pages and layouts
│   │   ├── components/       # UI components (Hero, Nav, Footer, etc.)
│   │   └── utils/            # Supabase client instantiation
│   ├── package.json          # Node dependencies and scripts
│   └── tsconfig.json         # TypeScript configuration
│
├── .gitignore                # Repository-wide ignore rules
├── AGENT.md                  # Workspace agent guidelines
├── BACKEND_PLAN.md           # Backend module structure plan
├── CLAUDE.md                 # Development helper guides
└── PRODUCT.md                # Bizznet product specifications
```

## Getting Started

### Backend Setup

Navigate to the `backend/` directory:
```bash
cd backend
```
Install dependencies using `uv` or `pip`:
```bash
uv pip install -e .
```
Start the development server:
```bash
fastapi dev app/main.py
```

### Frontend Setup

Navigate to the `frontend/` directory:
```bash
cd frontend
```
Install dependencies:
```bash
npm install
```
Start the Next.js development server:
```bash
npm run dev
```
