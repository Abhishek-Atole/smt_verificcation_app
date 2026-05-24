# Feature Test Report

## Test Scope
This report records live request/response checks, workspace build/test verification, and the current state of the user-facing desktop UI.

## Verified Commands
- `pnpm build` passed across the workspace.
- `pnpm -r run test -- --run` passed across the workspace.
- Full api-server suite currently passes 161 tests.

## Live API Checks

| Area | Request | Expected | Actual |
|---|---|---|---|
| Health | `GET /api/v1/health` | `200` with status payload | `200` with `{"status":"ok","timestamp":...,"database":"connected","uptime":...}` |
| Auth failure | `POST /api/v1/auth/login` with a wrong password | `401` | `401` |
| User list protection | `GET /api/v1/users` as a non-admin user | `403` | `403` |
| User detail protection | `GET /api/v1/users/:userId` as a non-admin user | `403` or filtered data | `200` with the full user record, including `passwordHash` |
| Internal logs | `GET /internal/logs?lines=3` without auth | `401` | `200` with recent log entries |

## Feature Notes

### Health endpoint
The health endpoint works and returns a concise status payload. It does not currently expose version or memory fields, so any documentation that promises those fields is ahead of the actual implementation.

### Authentication
Login failure handling works correctly for invalid credentials. The API also supports a development test-login flow, but that route should be treated as dev-only and gated carefully in production-like environments.

### User management
User list protection works for non-admin users, but the single-user lookup route is not restricted correctly. That is a real authorization bug, not just a missing test.

### Logs and diagnostics
Recent logs are currently exposed through the internal router without authentication. That means the diagnostics feature is functioning, but it is not safely protected.

## Desktop UI State
- The current React root is [apps/admin-desktop/src/main.tsx](../apps/admin-desktop/src/main.tsx#L1).
- The legacy dashboard entry at [apps/admin-desktop/src/index.tsx](../apps/admin-desktop/src/index.tsx#L1) still exists as an artifact, but it is not the active React root.
- [apps/admin-desktop/src/contexts/AuthContext.tsx](../apps/admin-desktop/src/contexts/AuthContext.tsx#L1) still uses mocked in-memory users instead of the API.
- [apps/admin-desktop/src/pages/LoginPage.tsx](../apps/admin-desktop/src/pages/LoginPage.tsx#L1) and [apps/admin-desktop/src/pages/ScanSessionPage.tsx](../apps/admin-desktop/src/pages/ScanSessionPage.tsx#L1) are placeholders.

## Build and Test Coverage
- Workspace build and test commands are green.
- The UI still has multiple placeholder pages, so feature completeness is below what the routing shell implies.
- The feature set is therefore functional in the backend core, but incomplete in the desktop experience.

## Current Gaps
- The desktop auth flow is still mocked.
- Several pages are simple stubs.
- Internal log access is not protected.
- The user detail route returns too much data.
