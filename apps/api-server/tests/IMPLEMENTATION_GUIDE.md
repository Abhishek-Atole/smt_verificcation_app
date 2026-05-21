# Integration Test Implementation Guide

## Overview

This guide explains how to implement the integration test logic. All test files currently contain placeholder assertions (`expect(true).toBe(true)`). This document provides templates and patterns for implementing real test logic.

## Architecture Pattern

### 1. Test Structure
```typescript
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { getTestToken, testUsers, testData } from './fixtures';
import app from '../src/index';

describe('Route Group', () => {
  describe('Endpoint', () => {
    it('should do something', async () => {
      // 1. Setup: Create test data or get tokens
      const token = getTestToken('admin');
      
      // 2. Act: Make HTTP request
      const response = await request(app)
        .post('/api/endpoint')
        .set('Authorization', `Bearer ${token}`)
        .send(testData);
      
      // 3. Assert: Verify response
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(testData.name);
    });
  });
});
```

### 2. Fixture Usage
```typescript
import { 
  getTestToken, 
  testUsers, 
  testData,
  expectSuccessResponse,
  expectErrorResponse 
} from './fixtures';

// Get admin token
const adminToken = getTestToken('admin');

// Access test user
const operatorUser = testUsers.operator;

// Use predefined test data
const validBom = testData.validBom;

// Use helper assertions
expectSuccessResponse(response, 200);
expectErrorResponse(response, 401);
```

## Implementation Templates

### Template 1: Successful CRUD Operation

```typescript
it('should create a new user', async () => {
  const token = getTestToken('admin');
  const userData = {
    email: 'newuser@test.com',
    password: 'TestPass123!',
    name: 'Test User',
    role: 'operator',
  };

  const response = await request(app)
    .post('/api/users')
    .set('Authorization', `Bearer ${token}`)
    .send(userData);

  expect(response.status).toBe(201);
  expect(response.body).toHaveProperty('id');
  expect(response.body.email).toBe(userData.email);
  expect(response.body).not.toHaveProperty('password'); // Sensitive field
});
```

### Template 2: Authorization Error Test

```typescript
it('should prevent unauthorized access', async () => {
  const response = await request(app)
    .post('/api/users')
    .send({ email: 'test@test.com' });
    // No Authorization header

  expect(response.status).toBe(401);
  expect(response.body).toHaveProperty('error');
  expect(response.body.error).toContain('Unauthorized');
});
```

### Template 3: Validation Error Test

```typescript
it('should reject invalid input', async () => {
  const token = getTestToken('admin');
  const invalidData = {
    email: 'invalid-email', // Invalid email format
    password: '123', // Too short
  };

  const response = await request(app)
    .post('/api/users')
    .set('Authorization', `Bearer ${token}`)
    .send(invalidData);

  expect(response.status).toBe(400);
  expect(response.body).toHaveProperty('errors');
});
```

### Template 4: Role-Based Access Control

```typescript
it('should enforce role-based access', async () => {
  const operatorToken = getTestToken('operator');
  
  const response = await request(app)
    .delete('/api/users/someid')
    .set('Authorization', `Bearer ${operatorToken}`);

  expect(response.status).toBe(403);
  expect(response.body.error).toContain('Forbidden');
});
```

### Template 5: Workflow Test

```typescript
it('should execute complete workflow', async () => {
  const adminToken = getTestToken('admin');
  
  // Step 1: Create BOM
  const bomResponse = await request(app)
    .post('/api/boms')
    .set('Authorization', `Bearer ${adminToken}`)
    .send(testData.validBom);
  
  expect(bomResponse.status).toBe(201);
  const bomId = bomResponse.body.id;
  
  // Step 2: Add items to BOM
  const itemResponse = await request(app)
    .post(`/api/boms/${bomId}/items`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send(testData.validBomItem);
  
  expect(itemResponse.status).toBe(201);
  
  // Step 3: Approve BOM
  const approveResponse = await request(app)
    .patch(`/api/boms/${bomId}/approve`)
    .set('Authorization', `Bearer ${adminToken}`);
  
  expect(approveResponse.status).toBe(200);
  expect(approveResponse.body.status).toBe('approved');
});
```

## Common Patterns

### Pattern 1: Testing with Query Parameters
```typescript
it('should filter results with query parameters', async () => {
  const token = getTestToken('supervisor');
  
  const response = await request(app)
    .get('/api/users')
    .set('Authorization', `Bearer ${token}`)
    .query({ role: 'operator', status: 'active' });
  
  expect(response.status).toBe(200);
  expect(response.body).toBeInstanceOf(Array);
  response.body.forEach(user => {
    expect(user.role).toBe('operator');
    expect(user.isActive).toBe(true);
  });
});
```

### Pattern 2: Testing with Request Body
```typescript
it('should process request with nested data', async () => {
  const token = getTestToken('admin');
  
  const response = await request(app)
    .post('/api/boms')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: 'Test BOM',
      items: [
        { feederSlot: 1, mpn1: 'IC001' },
        { feederSlot: 2, mpn1: 'IC002' },
      ],
    });
  
  expect(response.status).toBe(201);
  expect(response.body.items).toHaveLength(2);
});
```

### Pattern 3: Testing Error Response Structure
```typescript
it('should return properly formatted error', async () => {
  const response = await request(app)
    .post('/api/invalid-endpoint')
    .send({});
  
  expect(response.status).toBe(404);
  expect(response.body).toHaveProperty('error');
  expect(response.body).toHaveProperty('code');
  expect(response.body).toHaveProperty('timestamp');
});
```

### Pattern 4: Testing Data Integrity
```typescript
it('should maintain data integrity after update', async () => {
  const token = getTestToken('admin');
  const userId = testUsers.operator.id;
  
  const updateResponse = await request(app)
    .patch(`/api/users/${userId}`)
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Updated Name' });
  
  expect(updateResponse.status).toBe(200);
  
  // Verify by fetching
  const getResponse = await request(app)
    .get(`/api/users/${userId}`)
    .set('Authorization', `Bearer ${token}`);
  
  expect(getResponse.status).toBe(200);
  expect(getResponse.body.name).toBe('Updated Name');
});
```

### Pattern 5: Testing Pagination
```typescript
it('should support pagination', async () => {
  const token = getTestToken('supervisor');
  
  const page1 = await request(app)
    .get('/api/sessions')
    .set('Authorization', `Bearer ${token}`)
    .query({ page: 1, limit: 10 });
  
  expect(page1.status).toBe(200);
  expect(page1.body).toHaveProperty('data');
  expect(page1.body).toHaveProperty('pagination');
  expect(page1.body.pagination.total).toBeGreaterThanOrEqual(0);
});
```

### Pattern 6: Testing Real-Time Events
```typescript
it('should broadcast socket event', async (done) => {
  const io = require('socket.io-client');
  const socket = io('http://localhost:3000', {
    query: { token: getTestToken('operator') }
  });
  
  socket.on('scan:recorded', (data) => {
    expect(data).toHaveProperty('scanId');
    expect(data).toHaveProperty('result');
    socket.disconnect();
    done();
  });
  
  // Trigger scan recording
  await request(app)
    .post('/api/scans/record')
    .set('Authorization', `Bearer ${getTestToken('operator')}`)
    .send(testData.validScan);
});
```

## Implementation Checklist

For each test file, follow this sequence:

### [ ] Setup Phase
- [ ] Import required modules and fixtures
- [ ] Define describe blocks for route groups
- [ ] Add beforeAll/afterAll hooks if needed
- [ ] Import test data fixtures

### [ ] Authentication Tests
- [ ] Test missing authorization header (401)
- [ ] Test invalid token (401)
- [ ] Test expired token (401)
- [ ] Test valid token (2xx)

### [ ] Authorization Tests
- [ ] Test insufficient permissions (403)
- [ ] Test correct role access (2xx)
- [ ] Test role-specific endpoints

### [ ] Input Validation Tests
- [ ] Test missing required fields (400)
- [ ] Test invalid field types (400)
- [ ] Test out-of-range values (400)
- [ ] Test invalid enum values (400)
- [ ] Test valid input (2xx)

### [ ] CRUD Operation Tests
- [ ] Test Create (201)
- [ ] Test Read (200)
- [ ] Test Update (200/204)
- [ ] Test Delete (200/204)
- [ ] Test Get non-existent (404)

### [ ] Business Logic Tests
- [ ] Test workflow sequences
- [ ] Test state transitions
- [ ] Test calculations (FPY, etc.)
- [ ] Test referential integrity

### [ ] Error Handling Tests
- [ ] Test constraint violations (409)
- [ ] Test server errors (500)
- [ ] Test rate limiting (429)
- [ ] Test timeout scenarios

## Example: Implementing Scan Routes Tests

```typescript
describe('Scan Routes', () => {
  describe('POST /api/scans/record', () => {
    it('should record scan with validation result', async () => {
      // Setup: Create session first
      const sessionRes = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${getTestToken('admin')}`)
        .send(testData.validSession);
      const sessionId = sessionRes.body.id;
      
      // Act: Record scan
      const scanRes = await request(app)
        .post('/api/scans/record')
        .set('Authorization', `Bearer ${getTestToken('operator')}`)
        .send({
          sessionId,
          feederSlot: 1,
          scannedValue: 'IC001',
        });
      
      // Assert
      expect(scanRes.status).toBe(201);
      expect(scanRes.body).toHaveProperty('validationResult');
      expect(['pass', 'fail', 'alternate', 'manual']).toContain(
        scanRes.body.validationResult
      );
    });

    it('should execute 7-stage validation', async () => {
      // Setup
      const sessionId = testData.activeSession.id;
      
      // Test each stage
      const stages = [
        { feederSlot: 1, scannedValue: 'IC001', expected: 'pass' },
        { feederSlot: 2, scannedValue: 'ALT001', expected: 'alternate' },
        { feederSlot: 999, scannedValue: 'IC001', expected: 'fail' },
      ];
      
      for (const stage of stages) {
        const res = await request(app)
          .post('/api/scans/record')
          .set('Authorization', `Bearer ${getTestToken('operator')}`)
          .send({
            sessionId,
            feederSlot: stage.feederSlot,
            scannedValue: stage.scannedValue,
          });
        
        expect(res.status).toBe(201);
        expect(res.body.validationResult).toBe(stage.expected);
      }
    });
  });
});
```

## Best Practices

1. **Use Fixtures:** Always use predefined test data from fixtures
2. **Clear Test Names:** Use descriptive names that explain what is being tested
3. **Arrange-Act-Assert:** Follow AAA pattern for clarity
4. **One Assertion Focus:** Each test should verify one primary behavior
5. **Independent Tests:** Tests should not depend on other tests
6. **Cleanup:** Use afterEach/afterAll to clean up test data
7. **Mock External Services:** Mock Socket.IO, database when needed
8. **Error Messages:** Expect specific error messages, not just status codes
9. **Response Structure:** Verify response structure, not just values
10. **Realistic Data:** Use realistic test data that matches production scenarios

## Troubleshooting

### Issue: Tests timeout
**Solution:** Increase timeout in vitest.config.ts or use `{ timeout: 20000 }` on specific tests

### Issue: Port already in use
**Solution:** Ensure app listens on different port for tests or close existing server

### Issue: Database connection errors
**Solution:** Mock database layer or use test database connection string

### Issue: Token validation fails
**Solution:** Ensure token generation in fixtures matches API expectation

### Issue: Async operations not completing
**Solution:** Use `async`/`await` and ensure proper promise handling

## Next Steps

1. Start implementing tests file by file
2. Begin with simpler endpoints (health, users)
3. Progress to complex endpoints (scans, sessions)
4. Implement end-to-end workflows last
5. Run coverage reports and identify gaps
6. Iterate on fixtures and error handling
7. Integrate into CI/CD pipeline

## Resources

- Supertest API: https://github.com/visionmedia/supertest#api
- Vitest Docs: https://vitest.dev/api/
- Express Testing Patterns: https://expressjs.com/en/guide/testing.html
- HTTP Status Codes: https://httpwg.org/specs/rfc9110.html#status.codes
