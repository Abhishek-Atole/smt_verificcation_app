# Security Audit Report

## Scope
This audit combined source review, live HTTP reproduction, and `pnpm audit --json` output from the workspace. The focus was on confirmed security behavior in the running application, not just code intent.

## Executive Summary
The highest-risk findings are an unauthenticated internal log disclosure, an IDOR in user detail retrieval, and tracked example environment values that look like real credentials. In addition, the backend security headers contain a path-matching bug that prevents cache protection from applying to the actual `/api/v1/...` routes, and Socket.IO auth failures log raw handshake headers.

The dependency audit also reported multiple Electron advisories for `apps/admin-desktop`.

## Confirmed Findings

### 1. Unauthenticated internal log disclosure
- Severity: High
- Evidence: [apps/api-server/src/routes/internal.ts](../apps/api-server/src/routes/internal.ts#L10)
- Verified behavior: `GET /internal/logs` returned recent logs without authentication.
- Live reproduction: `curl.exe -s http://localhost:3000/internal/logs?lines=3` returned JSON log entries.
- Risk: Recent logs can contain request headers, IP hashes, status codes, and other operational data that should not be publicly readable.
- Fix: Require authentication and an appropriate role for log access, and add an explicit authorization check before returning log data.

### 2. IDOR on user detail route
- Severity: High
- Evidence: [apps/api-server/src/routes/users.ts](../apps/api-server/src/routes/users.ts#L35)
- Verified behavior: an authenticated non-admin user could call `GET /api/v1/users/:userId` and receive the full target user object, including `passwordHash`.
- Related control: [apps/api-server/src/routes/users.ts](../apps/api-server/src/routes/users.ts#L12) protects list/create/delete with role checks, but the detail route only uses `authMiddleware`.
- Risk: Any authenticated user can enumerate or fetch other users' records if they know the ID.
- Fix: Restrict the route to admin-only access or enforce self-only access, and never return password hashes in API responses.

### 3. Tracked example env contains credential-like values
- Severity: High
- Evidence: [.env.example](../.env.example#L13)
- Supporting lines: [.env.example](../.env.example#L29), [.env.example](../.env.example#L35), [.env.example](../.env.example#L57)
- Risk: The tracked example file includes a PostgreSQL DSN with a concrete password-like value plus other secret-bearing placeholders. That is unsafe for a template file and can leak credentials or encourage reuse.
- Fix: Replace any real values with harmless placeholders, rotate any exposed secrets, and keep the example file strictly non-sensitive.

### 4. Security header cache-control matcher misses `/api/v1/...`
- Severity: Medium
- Evidence: [apps/api-server/src/middleware/security-headers.ts](../apps/api-server/src/middleware/security-headers.ts#L36)
- Verified behavior: the middleware checks for `/api/auth` and `/api/users`, but the live API uses `/api/v1/...`, so the no-store header does not apply to those sensitive responses.
- Risk: Sensitive responses can be cached when they should not be.
- Fix: Match the real route prefixes or apply the header based on route metadata rather than raw URL substrings.

### 5. Socket auth failure logs raw handshake headers
- Severity: Medium
- Evidence: [apps/api-server/src/realtime/socket-server.ts](../apps/api-server/src/realtime/socket-server.ts#L54)
- Risk: Logging `socket.handshake.headers` on auth failure can expose cookies, bearer tokens, and other request metadata in logs.
- Fix: Redact handshake headers before logging or log only a minimal, allowlisted subset.

## Dependency Audit
`pnpm audit --json` reported multiple advisories in the workspace output, including:
- 1 critical
- 5 high
- 8 moderate
- 3 low

Most of the package-level advisories were tied to Electron in `apps/admin-desktop`.
- Evidence: [apps/admin-desktop/package.json](../apps/admin-desktop/package.json#L57)
- Electron has been upgraded to `42.2.0`; the fresh audit no longer showed Electron advisories.

Impact note: the remaining advisories in the latest audit are non-Electron packages (for example Vite and backend dependencies), so the Electron-specific risk is now resolved.

## What Was Not Confirmed
- I did not verify any exploit path for the Electron advisories beyond the package audit output.
- I did not find evidence that `/api/v1/health` exposes secrets; it currently returns a simple status payload.

## Recommended Priority Order
1. Lock down `/internal/logs`.
2. Fix the `GET /api/v1/users/:userId` authorization and response shape.
3. Remove real credentials from `.env.example` and rotate anything already exposed.
4. Correct the cache-control matcher.
5. Redact Socket.IO handshake headers before logging.
6. Upgrade Electron to a patched release and re-run the dependency audit.
