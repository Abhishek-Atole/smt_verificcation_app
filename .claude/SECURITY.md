# SECURITY.md

## Security Posture
The backend has some security controls in place: JWT auth, CSRF middleware, security headers, and rate limiting. However, the current workspace still has several confirmed security gaps.

## Confirmed Issues
1. Unauthenticated log disclosure in `apps/api-server/src/routes/internal.ts`.
2. IDOR in `apps/api-server/src/routes/users.ts`.
3. Credential-like values in `.env.example`.
4. Cache-control mismatch in `apps/api-server/src/middleware/security-headers.ts`.
5. Raw Socket.IO handshake headers being logged in `apps/api-server/src/realtime/socket-server.ts`.

## Immediate Fix Priority
1. Protect internal logs.
2. Restrict user detail access and stop returning password hashes.
3. Sanitize tracked example env values and rotate anything real.
4. Fix header matching for `/api/v1/...` routes.
5. Redact socket handshake headers before logging.
6. Upgrade Electron and re-run the audit.

## Operational Notes
- Do not rely on the example env file as a harmless template until it is sanitized.
- Treat internal diagnostic endpoints as sensitive by default.
- Use live request testing when validating security fixes; the repo already has working API entry points for that.
