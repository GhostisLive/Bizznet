# BizzNet Frontend - Vite + React + TypeScript

## Commands

- `pnpm dev` - Start development server on port 3000
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm lint` - Run ESLint

## Tech Stack

- **Vite 5** - Fast build tool and dev server
- **React 19** - UI library
- **TypeScript** - Type safety
- **React Router v6** - Client-side routing
- **Tailwind CSS v4** - Styling
- **Framer Motion** - Animations
- **Lucide React** - Icons

## Project Structure

```
src/
├── components/       # Reusable UI components
├── pages/            # Page components (routed)
├── app/              # App-level components (Layout, providers)
├── lib/              # Utilities, API client, auth
├── main.tsx          # Entry point
├── App.tsx           # Router configuration
├── vite-env.d.ts     # Vite type declarations
└── globals.css       # Global styles with Tailwind
```

## API Configuration

The API base URL is configured via `VITE_API_URL` environment variable (default: `/api/backend/api/v1`). The Vite dev server proxies `/api/backend` requests to `http://127.0.0.1:8000`.

## Routing

Routes are defined in `src/App.tsx` using React Router v6. All authenticated routes are wrapped with the `Layout` component which includes the Sidebar and navigation.

## Authentication

Auth state is managed via `AuthProvider` in `src/lib/AuthProvider.tsx` using React Context. The `useAuth` hook provides access to user, organization, and auth methods.

## Styling

Uses Tailwind CSS v4 with custom color palette defined in `globals.css`. Fonts (Inter, JetBrains Mono) are loaded via Google Fonts in `index.html`.