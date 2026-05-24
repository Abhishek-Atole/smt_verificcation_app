# Implementation Status

## Snapshot
- Inventoried files: 145
- Planned files checked: 42
- Existing implementations: 21
- Stubs/placeholders: 10
- Missing planned files: 10

The codebase has a solid backend foundation, but the UI and several planned support files are still ahead of the actual implementation.

## Implemented Well

### Backend
- Auth cookie flow and JWT verification exist.
- PostgreSQL-backed repositories exist for users, BOMs, sessions, scans, audit logs, system logs, and rate limits.
- Security middleware exists for headers, CSRF, logging, and rate limiting.
- Socket.IO integration and short-lived socket tokens exist.
- Health and readiness endpoints exist.
- Rate limiting now has a fallback strategy instead of hard failing.

### Shared packages
- `@smt/config` centralizes env validation.
- `@smt/db` centralizes schema and pool access.
- `@smt/api-types` provides a shared client.

### Desktop shell
- The routed shell exists in `apps/admin-desktop/src/App.tsx`.
- Theme and toast contexts exist.
- Several reusable UI primitives already exist.

## Partial Or Mocked
- [apps/admin-desktop/src/contexts/AuthContext.tsx](../apps/admin-desktop/src/contexts/AuthContext.tsx#L1) still uses static in-memory users.
- [apps/admin-desktop/src/pages/LoginPage.tsx](../apps/admin-desktop/src/pages/LoginPage.tsx#L1) is still a placeholder.
- [apps/admin-desktop/src/pages/ScanSessionPage.tsx](../apps/admin-desktop/src/pages/ScanSessionPage.tsx#L1) is still a placeholder.
- [apps/admin-desktop/src/index.tsx](../apps/admin-desktop/src/index.tsx#L1) remains as a legacy dashboard entry and is not the current root.

## Missing Planned Files
- `apps/admin-desktop/electron/main.ts`
- `apps/admin-desktop/electron/preload.ts`
- `apps/admin-desktop/src/components/ui/Toast.tsx`
- `apps/api-server/src/middleware/request-context.ts`
- `apps/api-server/src/services/user-service.ts`
- `apps/api-server/tests/unit/users-repo.test.ts`
- `apps/api-server/tests/unit/validation-schemas.test.ts`
- `docs/README.md`
- `docs/API.md`
- `docs/TESTING.md`


## Generated Analysis Docs
- `docs/SECURITY_AUDIT_REPORT.md`
- `docs/FEATURE_TEST_REPORT.md`
- `docs/IMPLEMENTATION_STATUS.md`
- `docs/CHANGELOG.md`
- `.claude/CLAUDE.md`
- `.claude/SECURITY.md`
- `.claude/TESTING.md`
- `.claude/ARCHITECTURE.md`
- `.claude/NEXT_SESSION.md`

## Notable Risk Gaps
- The user detail authorization bug is still present.
- Internal logs are exposed without auth.
- The example env file contains sensitive-looking values.
- Electron is on a vulnerable major line per `pnpm audit`.

## Practical Interpretation
The backend is farther along than the UI. The shell and service layer are present, but several user-facing flows are still mocked or stubbed, so the implementation should be treated as partially complete rather than production ready.
