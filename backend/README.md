# BizzNet backend

## Required environment

Create `backend/.env` on the machine running FastAPI. Do not put these values
in the frontend or commit the file.

```env
DATABASE_URL=postgresql+asyncpg://...
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<Project API key: anon public>
SUPABASE_JWT_SECRET=<Project JWT secret>
```

`SUPABASE_ANON_KEY` is required because the backend performs Supabase Auth
login. If it is missing, the API now fails at startup with an actionable
configuration error instead of returning `No API key` only when a user logs in.

## Running from another device

Set the frontend API URL to the host running this backend, not `localhost` on
the client device:

```env
NEXT_PUBLIC_API_URL=http://<backend-host-or-lan-ip>:8000/api/v1
```

The backend must listen on `0.0.0.0:8000`, and its CORS configuration must
allow the frontend origin. The host firewall must allow ports 3000 and 8000
when using the development servers.