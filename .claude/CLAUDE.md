# CLAUDE.md

## Project Summary
This workspace is a pnpm monorepo for the SMT Verification desktop and API stack.

## Main Pieces
- `apps/api-server`: Express API with JWT auth, CSRF, rate limiting, Socket.IO, Drizzle, and PostgreSQL.
- `apps/admin-desktop`: Electron + React desktop shell.
- `apps/web-client`: Web UI and log viewer.
- `packages/config`: shared environment validation.
- `packages/db`: shared schema and database access.
- `packages/api-types`: shared API client and types.

## Verified Commands
- `pnpm build`
- `pnpm -r run test -- --run`
- `pnpm audit --json`

## Current High-Risk Areas
- `apps/api-server/src/routes/users.ts` has an authorization bug on the user detail route.
- `apps/api-server/src/routes/internal.ts` exposes recent logs without auth.
- `.env.example` contains real-looking credential values.
- `apps/api-server/src/middleware/security-headers.ts` misses `/api/v1/...` paths.
- `apps/api-server/src/realtime/socket-server.ts` logs handshake headers on auth failure.
- `apps/admin-desktop` depends on Electron 28.3.3, which `pnpm audit` flags with multiple advisories.

## Working Style
- Prefer targeted changes over broad rewrites.
- Preserve existing conventions and the current route structure.
- Re-run build or focused tests after any functional edit.

## Useful References
- [docs/SECURITY_AUDIT_REPORT.md](../docs/SECURITY_AUDIT_REPORT.md)
- [docs/FEATURE_TEST_REPORT.md](../docs/FEATURE_TEST_REPORT.md)
- [docs/IMPLEMENTATION_STATUS.md](../docs/IMPLEMENTATION_STATUS.md)
