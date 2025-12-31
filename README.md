# Okapi Care Network

A comprehensive healthcare facility marketplace connecting families with Adult Family Homes (AFH), Assisted Living (ALF), Skilled Nursing (SNF), and Hospice facilities in Washington State.

## Tech Stack

- **Frontend**: React 19, Wouter, TanStack Query, Tailwind CSS, Radix UI
- **Backend**: Express.js, Drizzle ORM, Neon PostgreSQL
- **Build**: Vite (dev), ESBuild (prod)
- **Deployment**: Railway

## Quick Start

```bash
npm install
cp .env.example .env  # Configure environment
npm run db:push       # Setup database
npm run dev           # Start development
```

## HIPAA Compliance Features (v2.0)

### Security
- Role-based access control (RBAC)
- Facility-scoped data isolation
- MFA support (TOTP)
- Staff PIN authentication with device trust
- Session timeout (30 min)
- Account lockout (5 attempts)
- Rate limiting

### Audit Trail
- All PHI access logged
- Before/after values captured
- Security events tracked
- IP and device logging

### Encryption
- HTTPS in transit
- PostgreSQL encryption at rest
- Sensitive fields encrypted (AES-256-GCM)
- MFA secrets encrypted
- Backup codes hashed (SHA-256)

## API Endpoints Summary

| Category | Endpoints | Auth |
|----------|-----------|------|
| Public | /api/public/* | None |
| Secure | /api/secure/* | Session |
| Auth | /api/auth/* | Varies |
| Admin | /api/admin/* | Admin |

## Care Score

Proprietary quality rating system:

| Component | Weight | Description |
|-----------|--------|-------------|
| Violations | 35% | DSHS compliance history |
| Owner Involvement | 20% | On-site presence |
| Staffing | 15% | Qualifications |
| Tenure | 10% | Years in operation |
| Reviews | 10% | Family feedback |
| Response Time | 5% | Inquiry speed |
| Transparency | 5% | Profile completeness |

**Ratings**: A+ (95+), A (85+), B (75+), C (65+), D (50+), F (<50)

## Key Features

- **Facility Search**: Filter by location, type, specialties, Medicaid acceptance
- **Care Score**: Transparent quality ratings based on compliance and feedback
- **Owner Portal**: Manage facility profiles, staff, residents, and documentation
- **EHR Integration**: ADL logging, care plans, medication tracking
- **Staff PIN Login**: Quick tablet-based access with device trust
- **Admin Dashboard**: Facility verification, audit logs, system stats

## Documentation

- [API Documentation](docs/API.md)
- [HIPAA Compliance](docs/HIPAA_COMPLIANCE.md)
- [Setup Guide](docs/SETUP.md)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm start` | Run production server |
| `npm run check` | TypeScript type check |
| `npm run db:push` | Push schema to database |

## Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key

Optional:
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` - S3 storage
- `GOOGLE_MAPS_API_KEY` - Geocoding

See [Setup Guide](docs/SETUP.md) for full configuration.

## License

Proprietary - All rights reserved.
