# Integration Testing Guide

## Overview

This guide covers the comprehensive integration test suite for the SMT Verification API. The test suite validates all 41+ endpoints across 8 route modules with emphasis on functionality, error handling, security, and performance.

## Test Structure

```
apps/api-server/tests/
├── integration/
│   ├── fixtures.ts          # Shared test utilities, tokens, fixtures
│   ├── health.test.ts       # Health check endpoint tests
│   ├── users.test.ts        # User CRUD and auth tests (8 endpoints)
│   ├── boms.test.ts         # BOM management tests (10 endpoints)
│   ├── sessions.test.ts     # Session lifecycle tests (8 endpoints)
│   ├── scans.test.ts        # Scan validation tests (6 endpoints)
│   ├── audit.test.ts        # Audit log tests (5 endpoints)
│   ├── metrics.test.ts      # Analytics tests (4 endpoints)
│   └── e2e.test.ts          # End-to-end workflow tests
├── INTEGRATION_TEST_PLAN.md  # Complete test plan reference
└── vitest.config.ts         # Vitest configuration
```

## Running Tests

### Prerequisites
```bash
# Install dependencies
pnpm install

# Ensure database is running
# Ensure API server can start (or mock it for tests)
```

### Run All Tests
```bash
pnpm test
```

### Run Specific Test File
```bash
# Test users endpoint
pnpm test -- users.test.ts

# Test scans endpoint
pnpm test -- scans.test.ts

# Test with pattern matching
pnpm test -- 'users|sessions'
```

### Run Tests in Watch Mode
```bash
pnpm test -- --watch
```

### Run Tests with Coverage Report
```bash
pnpm test:coverage
```

### Run Specific Test Suite
```bash
pnpm test -- -t "User Routes"
pnpm test -- -t "Scan Validation Pipeline"
```

### Generate HTML Coverage Report
```bash
pnpm test:coverage
# Open test-results/report.html in browser
```

## Test Categories

### 1. Authentication & Authorization (ALL ENDPOINTS)
Each endpoint tests:
- ✓ Missing authorization header → 401 Unauthorized
- ✓ Invalid/expired token → 401 Unauthorized
- ✓ Insufficient permissions → 403 Forbidden
- ✓ Valid token → Allowed (based on role)

**Roles tested:**
- `admin`: Full access to all endpoints
- `supervisor`: Access to audit, metrics, limited user ops
- `qa`: Access to scan override, audit
- `operator`: Access to scan recording, limited queries

### 2. Input Validation (ALL ENDPOINTS)
Each endpoint tests:
- ✓ Missing required fields → 400 Bad Request
- ✓ Invalid field types → 400 Bad Request
- ✓ Invalid enum values → 400 Bad Request
- ✓ Invalid UUID format → 400 Bad Request
- ✓ Out-of-range values → 400 Bad Request
- ✓ Valid input → Success

### 3. User Routes (8 endpoints)
- Create, list, get, update, delete users
- Soft delete implementation
- Bulk operations
- Search functionality
- Password management
- Audit logging

### 4. BOM Routes (10 endpoints)
- Create, list, get, update, delete BOMs
- Manage feeder items
- Support multiple part numbers (MPN1/2/3)
- Free-scan detection
- Approval workflow
- Version control
- Audit logging

### 5. Session Routes (8 endpoints)
- Create, list, get sessions
- State transitions (active → paused → completed)
- Pause/resume functionality
- Cancel capability
- Dashboard/statistics
- Duration calculation
- Feeder coverage tracking

### 6. Scan Routes (6 endpoints)
- Record scans with 7-stage validation
- Scan statistics retrieval
- FPY (First Pass Yield) calculation
- Multi-session summaries
- Admin/QA scan override
- Socket.IO event broadcasting
- Audit logging

**7-Stage Validation:**
- Stage 1: Session active check
- Stage 2: Feeder exists validation
- Stage 3: Free-scan detection (no expected values)
- Stage 4: MPN1 exact match (primary)
- Stage 5: MPN2 exact match (secondary/alternate)
- Stage 6: MPN3 exact match (tertiary/alternate)
- Stage 7: Internal part number tokenized matching

### 7. Audit Routes (5 endpoints)
- Query by entity type/ID
- Query by user actor
- Query by action type
- Query by date range
- Statistics aggregation
- Sensitive data redaction
- Immutable audit trail

### 8. Metrics Routes (4 endpoints)
- Session aggregated metrics
- User performance metrics
- BOM usage metrics
- System summary/dashboard
- Historical trending
- Metric caching

## Success Criteria

### Code Coverage Goals
- **Line Coverage:** > 80%
- **Branch Coverage:** > 75%
- **Function Coverage:** > 85%
- **Statement Coverage:** > 80%

### Performance Benchmarks
- Simple queries: < 500ms
- Complex queries: < 2s
- Batch operations: < 5s
- Scan recording: < 100ms
- FPY calculation: < 200ms

### Data Integrity
- All CRUD operations verified
- Referential integrity enforced
- Soft delete consistency
- Version tracking accuracy
- Audit trail completeness

### Security
- All endpoints require authentication
- Role-based access enforced
- Rate limiting applied
- Sensitive data redacted
- No SQL injection vulnerabilities
- No authorization bypass possible

## Test Data Fixtures

### Users
```typescript
testUsers = {
  admin: { id, email, role, token },
  supervisor: { id, email, role, token },
  qa: { id, email, role, token },
  operator: { id, email, role, token },
}
```

### BOMs
- Simple BOM: 5 items
- Complex BOM: 50+ items
- BOM with alternates: MPN1, MPN2, MPN3
- Free-scan BOM: No expected values

### Sessions
- Active session
- Completed session
- Paused session
- Cancelled session

### Scans
- Pass scans (MPN1 match)
- Alternate scans (MPN2/3)
- Manual match (tokenized)
- Failed scans
- Free scans

## Running Specific Test Scenarios

### Validate 7-Stage Scan Pipeline
```bash
pnpm test -- -t "7-Stage Validation Pipeline"
```

### Validate Role-Based Access
```bash
pnpm test -- -t "Role-Based"
```

### Validate End-to-End Workflows
```bash
pnpm test -- e2e.test.ts
```

### Validate Audit Trail
```bash
pnpm test -- -t "Audit"
```

### Validate Error Handling
```bash
pnpm test -- -t "should return.*400|401|403|404|409"
```

## Debugging Tests

### Verbose Output
```bash
pnpm test -- --reporter=verbose
```

### Debug Specific Test
```bash
pnpm test -- -t "specific test name" --reporter=verbose
```

### Run Single Test File with Debug
```bash
pnpm test -- scans.test.ts --reporter=verbose
```

## Continuous Integration

### GitHub Actions Workflow
```yaml
- name: Run tests
  run: pnpm test

- name: Generate coverage
  run: pnpm test:coverage

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
```

## Known Issues & Limitations

1. **Database Mocking:** Current tests use placeholder structure. Implement mocking layer for isolated testing.
2. **Socket.IO Events:** Event broadcasting tests need WebSocket mock implementation.
3. **Async Operations:** Some async flows need proper promise handling.
4. **Concurrent Tests:** Enable parallel test execution after implementing proper test isolation.

## Next Steps

1. **Implement fixtures:** Create database fixtures and seed data
2. **Mock dependencies:** Add Jest/Vitest mocks for database, Socket.IO
3. **Add performance tests:** Implement load testing and benchmarks
4. **Generate reports:** Set up coverage reporting and trending
5. **CI/CD integration:** Integrate tests into GitHub Actions
6. **API documentation:** Generate OpenAPI spec from tests

## Test Maintenance

### When Adding New Endpoints
1. Create new test file in `tests/integration/`
2. Add tests for all CRUD operations
3. Add tests for error cases
4. Add authorization tests
5. Add integration tests in `e2e.test.ts`
6. Update test plan document

### When Modifying Endpoints
1. Update corresponding test cases
2. Run full test suite to ensure no regressions
3. Update integration tests if workflow changes

### Regular Maintenance
- Run full suite weekly
- Review coverage reports monthly
- Update fixtures when schema changes
- Add regression tests for bugs found

## Resources

- [Vitest Documentation](https://vitest.dev)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Jest Testing Best Practices](https://jestjs.io/docs/testing-frameworks)
- [API Testing Guide](https://www.smashingmagazine.com/2021/04/testing-api-nodejs-javascript/)
