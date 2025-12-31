# Okapi Care Network - Setup Guide

## Prerequisites
- Node.js 18+
- PostgreSQL (or Neon account)
- Git

## Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/murayatheguy/OkapiAFHPortal.git
cd OkapiAFHPortal
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env` and configure:

```bash
# Required
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
SESSION_SECRET=your-32-char-secret-key

# Optional - Encryption (generate with: openssl rand -hex 32)
ENCRYPTION_KEY=your-64-char-hex-key

# Optional - S3 Storage
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-west-2
S3_BUCKET=okapi-files

# Optional - Google Maps
GOOGLE_MAPS_API_KEY=
```

### 4. Database Setup
```bash
npm run db:push
npm run db:seed  # Optional: seed demo data
```

### 5. Start Development Server
```bash
npm run dev
```

Visit http://localhost:5000

## Production Deployment (Railway)

### 1. Connect Repository
Link your GitHub repo to Railway.

### 2. Add Environment Variables
In Railway dashboard, add:
- `DATABASE_URL` (Railway provides this if using Railway Postgres)
- `SESSION_SECRET`
- `NODE_ENV=production`

### 3. Deploy
Push to main branch - Railway auto-deploys.

## Database Schema

### Push Changes
```bash
npm run db:push
```

### Generate Types
Types auto-generate from `shared/schema.ts`.

## API Structure

```
/api/public/*     → No auth, no PHI
/api/secure/*     → Auth required, facility-scoped
/api/auth/*       → Authentication endpoints
/api/admin/*      → Admin role required
```

## Testing

### Health Check
```bash
curl http://localhost:5000/api/health
```

### Build Check
```bash
npm run build
```

### Type Check
```bash
npm run check
```

## Project Structure

```
├── client/src/          # React frontend
│   ├── components/      # UI components
│   ├── pages/           # Route pages
│   ├── hooks/           # Custom hooks
│   └── lib/             # Utilities
├── server/              # Express backend
│   ├── routes/          # API routes
│   │   ├── public/      # No-auth routes
│   │   ├── secure/      # Auth-required routes
│   │   ├── auth/        # Auth endpoints
│   │   └── admin/       # Admin endpoints
│   ├── middleware/      # Express middleware
│   ├── services/        # Business logic
│   ├── auth/            # Auth services
│   ├── storage/         # File storage (S3)
│   └── utils/           # Utilities
├── shared/              # Shared types
│   └── schema.ts        # Database schema
└── docs/                # Documentation
```

## Common Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm start` | Run production |
| `npm run check` | TypeScript check |
| `npm run db:push` | Push schema changes |

## Common Issues

### "Module not found"
```bash
rm -rf node_modules
npm install
```

### "Database connection failed"
Check DATABASE_URL format includes `?sslmode=require`

### "Session not persisting"
Ensure SESSION_SECRET is set and consistent across restarts.

### "CORS errors"
In development, both frontend and backend run on port 5000.

### "Build fails on Railway"
Check that PUPPETEER_SKIP_DOWNLOAD=true is set.

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| DATABASE_URL | Yes | PostgreSQL connection string |
| SESSION_SECRET | Yes | Session encryption key (32+ chars) |
| NODE_ENV | No | development/production |
| PORT | No | Server port (default: 5000) |
| ENCRYPTION_KEY | No | Field encryption key (64 hex chars) |
| AWS_ACCESS_KEY_ID | No | S3 access key |
| AWS_SECRET_ACCESS_KEY | No | S3 secret key |
| AWS_REGION | No | S3 region (default: us-west-2) |
| S3_BUCKET | No | S3 bucket name |
| GOOGLE_MAPS_API_KEY | No | For geocoding |
