# SMTVerification Desktop

Production-grade SMT feeder verification system for PCB assembly shop floors.

## Quick Start

### Prerequisites
- Node.js 22.0.0+
- pnpm 9.0.0+
- PostgreSQL 16+

### Setup

```bash
# Clone and install
git clone https://github.com/Abhishek-Atole/SMTVerification-Desktop.git
cd SMTVerification-Desktop
pnpm install

# Configure environment
cp .env.example .env
# Edit .env with your local PostgreSQL connection

# Verify setup
pnpm typecheck
pnpm lint
pnpm test

# Start development
pnpm dev
```

### Database Setup

```bash
# Push schema to database
pnpm db:push

# Seed with sample data (optional)
pnpm db:seed

# Open Drizzle Studio for DB inspection
pnpm db:studio
```

## Architecture

- **Backend**: Node.js 22 + Express 4 + Socket.IO 4
- **Frontend**: React 18 + Vite 5
- **Database**: PostgreSQL 16 + Drizzle ORM
- **Desktop**: Electron 28 (Windows admin app)
- **Language**: TypeScript 5 (STRICT mode)

## Documentation

See `/docs` for architecture, API reference, and development guides.

## Development

- **Monorepo**: pnpm workspaces (apps/ + packages/)
- **Testing**: Vitest (80%+ coverage target)
- **Quality**: ESLint + Prettier (enforced in CI/CD)
- **Deployment**: Windows Service + Electron installer

## License

Proprietary - SMT Verification Desktop
