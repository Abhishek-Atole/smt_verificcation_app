# Integration Testing Plan - SMT Verification API

## Overview
Comprehensive integration testing for all 41+ API endpoints across 6 route modules.

## Test Organization

### 1. Health Routes (1 endpoint)
- ✓ GET /api/health - Health status with database connectivity

### 2. User Routes (8 endpoints)
- POST /api/users - Create user
- GET /api/users - List all users
- GET /api/users/:userId - Get user by ID
- PUT /api/users/:userId - Update user
- DELETE /api/users/:userId - Delete user (soft delete)
- POST /api/users/bulk-create - Bulk create users
- GET /api/users/search - Search users
- POST /api/users/change-password - Change password

### 3. BOM Routes (10 endpoints)
- POST /api/boms - Create BOM
- GET /api/boms - List BOMs (with filters)
- GET /api/boms/:bomId - Get BOM by ID
- PUT /api/boms/:bomId - Update BOM
- DELETE /api/boms/:bomId - Delete BOM
- POST /api/boms/:bomId/items - Add BOM item
- GET /api/boms/:bomId/items - Get BOM items
- PUT /api/boms/:bomId/items/:itemId - Update BOM item
- DELETE /api/boms/:bomId/items/:itemId - Delete BOM item
- POST /api/boms/:bomId/approve - Approve BOM

### 4. Session Routes (8 endpoints)
- POST /api/sessions - Create session
- GET /api/sessions - List sessions
- GET /api/sessions/:sessionId - Get session by ID
- PATCH /api/sessions/:sessionId/pause - Pause session
- PATCH /api/sessions/:sessionId/resume - Resume session
- PATCH /api/sessions/:sessionId/complete - Complete session
- PATCH /api/sessions/:sessionId/cancel - Cancel session
- GET /api/sessions/:sessionId/dashboard - Session dashboard

### 5. Metrics Routes (4 endpoints)
- GET /api/metrics/sessions - Session metrics
- GET /api/metrics/users - User metrics
- GET /api/metrics/boms - BOM metrics
- GET /api/metrics/summary - Overall summary

### 6. Scans Routes (6 endpoints)
- POST /api/scans/record - Record scan
- GET /api/scans/session/:sessionId/stats - Scan statistics
- GET /api/scans/session/:sessionId/quick-stats - Quick FPY stats
- GET /api/scans/session/:sessionId/duration - Session duration
- POST /api/scans/summary - Multi-session summary
- PATCH /api/scans/:scanId/override - Override scan (admin/qa)

### 7. Audit Routes (5 endpoints)
- GET /api/audit/entity/:entityType/:entityId - Entity audit logs
- GET /api/audit/user/:userId - User audit logs
- GET /api/audit/action/:action - Action audit logs
- GET /api/audit/range - Date range audit logs
- GET /api/audit/stats - Audit statistics

## Test Categories

### Authentication & Authorization Tests
- Missing authorization header → 401
- Invalid token → 401
- Expired token → 401
- Insufficient permissions → 403
- Valid token → Allowed

### Input Validation Tests
- Missing required fields → 400
- Invalid field types → 400
- Invalid enum values → 400
- Invalid UUID format → 400
- Valid input → Success

### Data Integrity Tests
- Create and verify data persistence
- Update and verify changes
- Delete and verify removal
- Soft delete verification
- Cascade operation handling

### Error Handling Tests
- Resource not found (404)
- Conflict errors (409) - duplicate entries
- Server errors (500) handling
- Database connection errors
- Timeout handling

### Business Logic Tests
- FPY calculation accuracy
- Validation result correctness
- Feeder coverage calculation
- Session state transitions
- Audit log recording

### Performance Tests
- Response time < 500ms for simple queries
- Response time < 2s for complex queries
- Batch operations performance
- Large result set handling
- Pagination accuracy

## Test Data Requirements

### Users
- Admin user
- Supervisor user
- QA user
- Operator user
- Inactive user

### BOMs
- Simple BOM (5 items)
- Complex BOM (50+ items)
- BOM with alternates (MPN2, MPN3)
- BOM with free scans (no expected values)

### Sessions
- Active session
- Completed session
- Paused session
- Cancelled session

### Scans
- Passing scans
- Failing scans
- Alternate part matches
- Free scans

## Coverage Goals
- Line Coverage: > 80%
- Branch Coverage: > 75%
- Function Coverage: > 85%
- Statement Coverage: > 80%

## Test Execution

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run specific test file
pnpm test -- health.test.ts

# Watch mode
pnpm test -- --watch

# Run with reporter
pnpm test -- --reporter=verbose
```

## Success Criteria

✓ All 41+ endpoints tested
✓ All happy paths passing
✓ All error paths validated
✓ Authentication working correctly
✓ Authorization rules enforced
✓ Data integrity verified
✓ No memory leaks
✓ Performance requirements met
✓ Coverage > 80%

## Notes

- Tests use fixtures for consistent test data
- Mock database queries where appropriate
- Use transaction rollback for data cleanup
- Test in isolation to avoid dependencies
- Validate both request and response structures
- Include realistic error scenarios
