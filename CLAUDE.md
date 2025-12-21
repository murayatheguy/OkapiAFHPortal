# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev          # Start full-stack dev server (Express + Vite HMR on port 5000)
npm run dev:client   # Vite dev server only (port 5000)
npm run build        # Production build (ESBuild)
npm start            # Production server (requires build first)
npm run check        # TypeScript type checking
npm run db:push      # Push Drizzle schema changes to database
```

## Architecture Overview

This is Okapi Care Network - a healthcare facility marketplace connecting families with Adult Family Homes (AFH), Assisted Living (ALF), Skilled Nursing (SNF), and Hospice facilities in Washington State.

### Stack
- **Frontend**: React 19, Wouter (routing), TanStack Query, React Hook Form + Zod, Tailwind CSS, Radix UI
- **Backend**: Express.js, Drizzle ORM, Neon PostgreSQL
- **Build**: Vite (dev), ESBuild (prod), TSX for server

### Directory Structure
```
client/src/
├── pages/          # Route components (Home, Search, FacilityDetails, OwnerPortal, Admin)
├── components/     # UI components (uses shadcn/ui pattern in components/ui/)
├── hooks/          # Custom React hooks
├── lib/            # API client, auth context, query client

server/
├── index.ts        # Express app setup and middleware
├── routes.ts       # All API endpoints (~1700 lines)
├── storage.ts      # DatabaseStorage class - all DB operations
├── db.ts           # Drizzle/Neon connection
├── dshs-sync/      # Automated DSHS compliance data scraping (Puppeteer)

shared/
└── schema.ts       # Drizzle schema - single source of truth for types
```

### Key Patterns

**Single-port architecture**: Frontend and backend both serve from port 5000. API routes at `/api/*`.

**Centralized storage**: All database operations go through `DatabaseStorage` class in `server/storage.ts`. Import as `storage` singleton.

**Shared types**: Schema in `shared/schema.ts` generates both DB tables and Zod validators. Use `createInsertSchema()` for validation.

**Auth**: Session-based with express-session. Owner auth via `OwnerAuthProvider` context. Admin auth separate.

**API calls**: Use `apiRequest()` from `client/src/lib/queryClient.ts` which handles credentials and errors.

### Important Features

**DSHS Sync**: Automated daily scraping (3 AM Pacific) of Washington DSHS website for facility compliance data. See `server/dshs-sync/`.

**Ownership Claims**: Multi-step verification workflow for facility owners to claim their listings.

**Transport Marketplace**: Medical transport booking system with full lifecycle (pending → confirmed → completed).

**Activity Log**: Audit trail for all significant actions in `activity_log` table.

### Path Aliases
- `@/` → `client/src/`
- `@shared/` → `shared/`

### Environment Variables
- `DATABASE_URL` - Neon PostgreSQL connection string
- `SESSION_SECRET` - Express session secret
- `GOOGLE_MAPS_API_KEY` - For location features
- `PRERENDER_TOKEN` - SEO prerendering (optional)
