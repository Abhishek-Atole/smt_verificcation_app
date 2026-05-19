import { expect } from 'vitest';
import express, { Application } from 'express';
import request from 'supertest';
import { sign } from 'jsonwebtoken';

/**
 * Test JWT secret (for testing only)
 */
const TEST_JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-tests-only-12345';

/**
 * Create a test Express app with all routes
 */
export function createTestApp(): Application {
  const app: express.Application = express();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Add mock routes for testing
  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
    });
  });

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({ error: 'Not Found' });
  });

  return app;
}

/**
 * Create JWT token for testing
 */
export const createToken = (
  userId: string,
  email: string,
  role: 'admin' | 'supervisor' | 'qa' | 'operator'
): string => {
  return sign(
    {
      userId,
      email,
      role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
    },
    TEST_JWT_SECRET,
    { algorithm: 'HS256' }
  );
};

/**
 * Get token for a specific test role
 */
export const getTestToken = (role: 'admin' | 'supervisor' | 'qa' | 'operator'): string => {
  const testUser = testUsers[role];
  return createToken(testUser.id, testUser.email, role);
};

/**
 * Predefined test users with roles
 */
export const testUsers = {
  admin: {
    id: 'admin-user-id',
    email: 'admin@test.com',
    password: 'TestPass123!',
    name: 'Admin User',
    role: 'admin' as const,
    get token(): string {
      return createToken(this.id, this.email, this.role);
    },
  },
  supervisor: {
    id: 'supervisor-user-id',
    email: 'supervisor@test.com',
    password: 'TestPass123!',
    name: 'Supervisor User',
    role: 'supervisor' as const,
    get token(): string {
      return createToken(this.id, this.email, this.role);
    },
  },
  qa: {
    id: 'qa-user-id',
    email: 'qa@test.com',
    password: 'TestPass123!',
    name: 'QA User',
    role: 'qa' as const,
    get token(): string {
      return createToken(this.id, this.email, this.role);
    },
  },
  operator: {
    id: 'operator-user-id',
    email: 'operator@test.com',
    password: 'TestPass123!',
    name: 'Operator User',
    role: 'operator' as const,
    get token(): string {
      return createToken(this.id, this.email, this.role);
    },
  },
};

/**
 * Test data fixtures for common entities
 */
export const testData = {
  validBom: {
    name: 'Test BOM',
    description: 'Test bill of materials',
    revisionNumber: '1.0',
    status: 'pending' as const,
  },

  validBomItem: {
    feederSlot: 1,
    internalPartNumber: 'INT-001',
    mpn1: 'IC-001',
    mpn2: 'ALT-IC-001',
    mpn3: 'ALT2-IC-001',
    quantity: 100,
    tolerance: '±5%',
  },

  validSession: {
    bomId: 'bom-id-uuid',
    operatorId: 'operator-user-id',
    status: 'active' as const,
    description: 'Test session',
  },

  validScan: {
    sessionId: 'session-id-uuid',
    feederSlot: 1,
    scannedValue: 'IC-001',
    timestamp: new Date().toISOString(),
  },

  invalidEmail: 'not-an-email',
  invalidUUID: 'not-a-uuid',
  shortPassword: 'Short1!',
};

/**
 * Helper to make authenticated HTTP request
 */
export const makeRequest = async (
  app: Application,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT',
  path: string,
  token?: string,
  data?: any
) => {
  let req = request(app)[method.toLowerCase()](path) as any;

  if (token) {
    req = req.set('Authorization', `Bearer ${token}`);
  }

  if (data && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
    req = req.send(data);
  }

  return req;
};

/**
 * Assertion helper: expect 200 success response
 */
export const expectSuccessResponse = (response: any, expectedStatus: number = 200) => {
  expect([200, 201, 204]).toContain(response.status);
  if (response.status !== 204) {
    expect(response.body).toBeDefined();
  }
};

/**
 * Assertion helper: expect error response with status and type
 */
export const expectErrorResponse = (
  response: any,
  expectedStatus: number,
  errorType?: string
) => {
  expect(response.status).toBe(expectedStatus);
  expect(response.body).toHaveProperty('error');
  if (errorType) {
    expect(response.body.error).toContain(errorType);
  }
};

/**
 * Assertion helper: expect 401 Unauthorized
 */
export const expectUnauthorized = (response: any) => {
  expect(response.status).toBe(401);
  expect(response.body.error).toContain('Unauthorized');
};

/**
 * Assertion helper: expect 403 Forbidden
 */
export const expectForbidden = (response: any) => {
  expect(response.status).toBe(403);
  expect(response.body.error).toContain('Forbidden');
};

/**
 * Assertion helper: expect 400 Bad Request
 */
export const expectBadRequest = (response: any) => {
  expect(response.status).toBe(400);
  expect(response.body).toHaveProperty('error');
};

/**
 * Assertion helper: expect 404 Not Found
 */
export const expectNotFound = (response: any) => {
  expect(response.status).toBe(404);
  expect(response.body.error).toContain('not found');
};
