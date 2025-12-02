# Okapi Care Network

## Overview

Okapi Care Network is a two-sided marketplace platform connecting Adult Family Home (AFH) owners in Washington State with families seeking care. The application integrates DSHS compliance data, facility management tools, and a training/certification platform (Okapi Academy). 

Built as a full-stack web application with a React frontend and Express backend, the platform enables families to search for verified care facilities, view detailed compliance information, and contact providers. AFH owners can manage their facility listings, staff credentials, and maintain regulatory compliance visibility.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- **Framework:** React 18 with TypeScript
- **Routing:** Wouter (lightweight client-side routing)
- **UI Components:** Shadcn/ui component library with Radix UI primitives
- **Styling:** Tailwind CSS v4 with custom Okapi brand theming
- **State Management:** TanStack Query (React Query) for server state
- **Forms:** React Hook Form with Zod validation
- **Animations:** Framer Motion for page transitions

**Design System:**
- Custom color palette focused on teal/green for trust and healthcare
- Typography: "Lora" serif for headings, "Plus Jakarta Sans" for body text
- Responsive design with mobile-first approach
- Consistent elevation system using shadow utilities

**Key Pages:**
- **Home:** Hero section with search functionality and featured facilities
- **Search Results:** Filterable facility listings with compliance snapshots
- **Facility Details:** Comprehensive view including photos, services, compliance data, and team credentials
- **Owner Portal:** Dashboard for facility management and team credential tracking

### Backend Architecture

**Technology Stack:**
- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js
- **Database ORM:** Drizzle ORM
- **Build Tool:** ESbuild for production bundling
- **Development:** Vite for HMR and development server

**API Design:**
- RESTful API endpoints under `/api` namespace
- JSON-based request/response format
- Structured error handling with proper HTTP status codes
- Server-side filtering and search capabilities

**Data Layer:**
- **Storage Pattern:** Repository pattern implemented via `storage.ts`
- **Schema Definition:** Centralized in `shared/schema.ts` for type safety across client/server
- **Query Builder:** Drizzle ORM with type-safe queries

**Key Entities:**
- **Users:** Authentication for facility owners
- **Facilities:** AFH listings with compliance and feature data
- **Team Members:** Staff associated with facilities
- **Credentials:** Training certifications and licenses for team members

### Database Architecture

**Database Provider:** Neon PostgreSQL (serverless)
- WebSocket connections for serverless compatibility
- Connection pooling via `@neondatabase/serverless`

**Schema Design:**

**Users Table:**
- Authentication credentials
- Email-based identification
- Optional facility association

**Facilities Table:**
- Core facility information (name, address, capacity)
- DSHS compliance data (license status, violations, inspection dates)
- Feature flags (Medicaid acceptance, specialties)
- Media arrays (photos stored as text arrays)
- Searchable by city, county, specialties, payment types

**Team Members Table:**
- Staff profiles linked to facilities
- Role and contact information
- Photo storage for trust building

**Credentials Table:**
- Training certifications and licenses
- Expiration tracking
- Issuing organization details
- PDF document references

**Key Design Decisions:**
- Array columns for flexible specialty/amenity storage
- UUID primary keys for all entities
- Timestamp tracking for audit trails
- Normalized relationships with foreign keys

### Build and Deployment

**Development Mode:**
- Vite dev server on port 5000 for client
- TSX for running TypeScript server directly
- Hot module replacement enabled
- Replit-specific plugins for development tools

**Production Build:**
- Client: Vite builds to `dist/public`
- Server: ESbuild bundles to `dist/index.cjs`
- Strategic dependency bundling to optimize cold starts
- Static file serving from Express

**Environment Variables:**
- `DATABASE_URL`: Required PostgreSQL connection string
- `NODE_ENV`: Controls development vs production behavior

## External Dependencies

### Core Infrastructure
- **Neon Database:** Serverless PostgreSQL hosting with WebSocket support
- **Replit Platform:** Deployment and hosting environment with custom Vite plugins

### UI Framework
- **Radix UI:** Headless component primitives (30+ components including Dialog, Dropdown, Tooltip, etc.)
- **Shadcn/ui:** Pre-styled component library built on Radix
- **Tailwind CSS:** Utility-first styling with v4 features
- **Lucide React:** Icon library

### State and Data Management
- **TanStack Query:** Server state management and caching
- **React Hook Form:** Form state and validation
- **Zod:** Schema validation shared between client and server
- **Drizzle ORM:** Type-safe database queries and migrations

### Development Tools
- **Vite:** Development server and build tool
- **ESBuild:** Production server bundling
- **TypeScript:** Type safety across full stack
- **Drizzle Kit:** Database migration tooling

### Notable Integrations
- **WebSocket (ws):** Required for Neon serverless database connections
- **Embla Carousel:** Image carousels for facility photos
- **date-fns:** Date formatting and manipulation
- **Framer Motion:** Animation library for enhanced UX

### Custom Plugins
- **vite-plugin-meta-images:** Updates OpenGraph meta tags for Replit deployment URLs
- **@replit/vite-plugin-runtime-error-modal:** Development error overlay
- **@replit/vite-plugin-cartographer:** Replit integration tools (dev only)