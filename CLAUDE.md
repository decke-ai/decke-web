# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Architecture

Next.js 16 application using the App Router pattern with React 19.

**Tech Stack:**
- Next.js 16 with App Router
- React 19
- TypeScript (strict mode)
- Tailwind CSS v4 (via `@tailwindcss/postcss`)
- shadcn/ui components
- Auth0 (authentication)

**Project Structure:**
- `app/(protected)/` - Protected pages requiring authentication (with sidebar layout)
- `app/api/auth/` - Auth0 API routes (login, logout, callback, me)
- `components/ui/` - shadcn/ui components
- `components/` - App-specific components (app-sidebar, providers)
- `contexts/` - React Context providers (auth-context)
- `lib/` - Utilities (auth0 config, cn helper)
- `hooks/` - Custom React hooks

**Authentication Flow:**
- Uses Auth0 with hosted login page (Universal Login)
- Sign-up is disabled (managed via backoffice)
- `AuthProvider` wraps the app and manages auth state via Context API
- Protected routes redirect to Auth0 login if not authenticated
- Auth routes (handled by middleware): `/auth/login`, `/auth/logout`, `/auth/callback`, `/auth/me`

**Path Aliases:**
- `@/*` maps to the project root

**Code Style:**
- Do NOT add inline comments in the code
- Only use JSDoc/docstrings for public APIs and complex functions when necessary
- Code should be self-documenting through clear naming
- NEVER commit code with console.log statements

**Environment Variables:**
- `AUTH0_SECRET` - A long secret value used to encrypt the session cookie (min 32 chars)
- `AUTH0_BASE_URL` - The base URL of your application (e.g., http://localhost:3000)
- `AUTH0_ISSUER_BASE_URL` - Your Auth0 tenant URL (e.g., https://your-tenant.auth0.com)
- `AUTH0_CLIENT_ID` - Your Auth0 application Client ID
- `AUTH0_CLIENT_SECRET` - Your Auth0 application Client Secret
