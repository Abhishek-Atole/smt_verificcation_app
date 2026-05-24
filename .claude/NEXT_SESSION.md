# NEXT_SESSION.md

## Start Here
1. Fix the `GET /api/v1/users/:userId` authorization bug and stop returning `passwordHash`.
2. Protect `GET /internal/logs` with authentication and a role check.
3. Sanitize `.env.example` and rotate any real credentials that were committed.
4. Fix the cache-control matcher for `/api/v1/...` routes.
5. Redact Socket.IO handshake headers before logging.
6. Upgrade Electron to a patched release and re-run `pnpm audit --json`.

## UI Follow-Up
- Replace the mocked auth context with the real API flow.
- Fill in the placeholder pages.
- Decide whether the legacy `src/index.tsx` should be removed or retained as an artifact.

## Validation Checklist
- `pnpm build`
- `pnpm -r run test -- --run`
- Live auth tests for allow and deny cases
- Live log access test
- `pnpm audit --json`

## Working Notes
- Prefer local, minimal edits.
- Keep security fixes measurable with a direct repro test.
- Preserve the existing monorepo layout and package boundaries.
