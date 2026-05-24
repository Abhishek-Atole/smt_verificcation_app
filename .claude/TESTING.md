# TESTING.md

## Verified Commands
- `pnpm build`
- `pnpm -r run test -- --run`
- `pnpm audit --json`

## Live API Checks
- `GET /api/v1/health` returns a healthy status payload.
- Invalid login credentials return `401`.
- Non-admin access to `GET /api/v1/users` returns `403`.
- Non-admin access to `GET /api/v1/users/:userId` currently returns `200` and leaks the full record.
- `GET /internal/logs?lines=3` currently returns log data without auth.

## What to Re-check After Changes
- Re-run the workspace build.
- Re-run the workspace test suite.
- Re-run the two security reproductions above.
- Re-run `pnpm audit --json` after any dependency change.

## Notes
- The test-login route exists for development workflows and should stay gated carefully.
- If a fix touches auth or headers, validate both the successful and denied paths.
