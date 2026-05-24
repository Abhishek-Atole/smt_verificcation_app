# Changelog

## [Unreleased] - Security Hardening

### Security
- Protected the internal logs endpoint with admin auth.
- Enforced admin-or-self access on `GET /api/v1/users/:userId` and stripped `passwordHash` from responses.
- Sanitized `.env.example` to remove credential-like values.
- Redacted raw Socket.IO handshake headers from auth-failure logs.
- Fixed security header cache-control matching for `/api/v1/...` routes.
- Added timing-attack mitigation to `authenticateUser()` for unknown emails.
- Kept `HASH_PEPPER` sourced from environment configuration.
- Kept JWT auth on HttpOnly cookies with CSRF protection and `credentials: 'include'` client requests.
- Exported `cleanupExpiredEntries()` for rate-limit store maintenance and fixed database cleanup to use `lt()`.
- Upgraded Electron from `28.3.3` to `42.2.0`.

### Tests
- Added security tests for password verification, authentication timing behavior, user-route authorization, internal log authorization, and rate-limit cleanup.
- Full api-server suite: 161 passing tests.
