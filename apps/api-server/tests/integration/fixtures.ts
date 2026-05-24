import { expect } from 'vitest';
import express, { Application } from 'express';
import request from 'supertest';
import { sign, decode } from 'jsonwebtoken';

/**
 * Test JWT secret (for testing only)
 */
const TEST_JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-tests-only-12345';

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
 * Extract role from JWT token
 */
function extractRoleFromToken(token: string): string | null {
  try {
    const decoded = decode(token) as any;
    return decoded?.role || null;
  } catch {
    return null;
  }
}

/**
 * Auth middleware for testing - validates token and extracts role
 */
const testAuthMiddleware = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    const role = extractRoleFromToken(token);
    
    if (!role) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.userRole = role;
    req.userId = 'test-user-id';
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

/**
 * Role-based access middleware
 */
const requireRole = (allowedRoles: string[]) => (req: any, res: any, next: any) => {
  if (!allowedRoles.includes(req.userRole)) {
    return res.status(401).json({ error: 'Insufficient permissions' });
  }
  next();
};

/**
 * Strip sensitive fields from user object
 */
function sanitizeUser(user: any) {
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}

/**
 * Create a test Express app with all routes
 */
export function createTestApp(): Application {
  const app: express.Application = express();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Mock in-memory database for testing
  const mockDB = {
    users: [] as any[],
    boms: [] as any[],
    sessions: [] as any[],
    scans: [] as any[],
  };

  // ========== HEALTH ROUTES ==========
  app.get('/api/health', (_req, res) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
    });
  });

  // Minimal auth test-login for fixture app
  app.post('/api/auth/test-login', (_req, res) => {
    const token = createToken('test-user-id', 'test@example.com', 'admin');
    res.json({ data: { user: { id: 'test-user-id', email: 'test@example.com', role: 'admin' }, token } });
  });

  // ========== USER ROUTES ==========
  app.get('/api/users', testAuthMiddleware, requireRole(['admin']), (req: any, res) => {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;
    
    const sanitized = mockDB.users.map(sanitizeUser).slice(offset, offset + limit);
    res.json({
      data: sanitized,
      limit,
      offset,
      total: mockDB.users.length,
    });
  });

  app.get('/api/users/:userId', testAuthMiddleware, (req: any, res) => {
    const user = mockDB.users.find(u => u.id === req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ data: sanitizeUser(user) });
  });

  app.post('/api/users', testAuthMiddleware, requireRole(['admin']), (req: any, res) => {
    const { email, passwordHash, role, firstName, lastName } = req.body;
    
    if (!email || !passwordHash || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (mockDB.users.find(u => u.email === email)) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const newUser = {
      id: `user-${Date.now()}`,
      email,
      passwordHash,
      role,
      firstName,
      lastName,
      createdAt: new Date().toISOString(),
      isDeleted: false,
    };

    mockDB.users.push(newUser);
    res.status(201).json({ data: sanitizeUser(newUser) });
  });

  app.patch('/api/users/:userId', testAuthMiddleware, (req: any, res) => {
    const idx = mockDB.users.findIndex(u => u.id === req.params.userId);
    if (idx === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    mockDB.users[idx] = { ...mockDB.users[idx], ...req.body, updatedAt: new Date().toISOString() };
    res.json({ data: sanitizeUser(mockDB.users[idx]) });
  });

  app.delete('/api/users/:userId', testAuthMiddleware, requireRole(['admin']), (req: any, res) => {
    const idx = mockDB.users.findIndex(u => u.id === req.params.userId);
    if (idx === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    mockDB.users[idx].isDeleted = true;
    mockDB.users[idx].deletedAt = new Date().toISOString();
    res.json({ data: sanitizeUser(mockDB.users[idx]), message: 'User deleted successfully' });
  });

  // ========== BOM ROUTES ==========
  app.get('/api/boms', testAuthMiddleware, (req: any, res) => {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;
    res.json({ data: mockDB.boms.slice(offset, offset + limit), limit, offset, total: mockDB.boms.length });
  });

  // Export BOM as CSV (test implementation)
  app.get('/api/boms/:bomId/export', testAuthMiddleware, requireRole(['admin', 'supervisor', 'qa']), (req: any, res: any) => {
    const bom = mockDB.boms.find(b => b.id === req.params.bomId);
    if (!bom) return res.status(404).json({ error: 'Not found' });

    // Simple CSV helpers for tests
    const csvSafeValue = (v: any) => {
      if (v === null || v === undefined) return '';
      const s = String(v).trim();
      if (/^[=+\-@]/.test(s)) return `'${s}`;
      return s;
    };
    const csvEscape = (v: any) => {
      const s = String(v ?? '');
      if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const rows: string[] = [];
    rows.push(['feederSlot', 'internalPartNumber', 'mpn1', 'quantity', 'createdAt'].join(','));
    for (const item of bom.items || []) {
      rows.push([
        csvEscape(csvSafeValue(item.feederSlot)),
        csvEscape(csvSafeValue(item.internalPartNumber)),
        csvEscape(csvSafeValue(item.mpn1)),
        csvEscape(csvSafeValue(item.quantity)),
        csvEscape(csvSafeValue(item.createdAt)),
      ].join(','));
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${(bom.name || 'bom').replace(/[^a-zA-Z0-9._-]/g, '_')}_${req.params.bomId}.csv"`);
    res.send(rows.join('\r\n'));
  });

  app.get('/api/boms/:bomId', testAuthMiddleware, (req: any, res) => {
    const bom = mockDB.boms.find(b => b.id === req.params.bomId);
    if (!bom) return res.status(404).json({ error: 'Not found' });
    res.json({ data: bom });
  });

  app.post('/api/boms', testAuthMiddleware, requireRole(['admin', 'supervisor']), (req: any, res) => {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    const newBom = { id: `bom-${Date.now()}`, name, description, createdAt: new Date().toISOString(), isDeleted: false };
    mockDB.boms.push(newBom);
    res.status(201).json({ data: newBom });
  });

  app.patch('/api/boms/:bomId', testAuthMiddleware, requireRole(['admin', 'supervisor']), (req: any, res) => {
    const idx = mockDB.boms.findIndex(b => b.id === req.params.bomId);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    mockDB.boms[idx] = { ...mockDB.boms[idx], ...req.body };
    res.json({ data: mockDB.boms[idx] });
  });

  app.delete('/api/boms/:bomId', testAuthMiddleware, requireRole(['admin']), (req: any, res) => {
    const idx = mockDB.boms.findIndex(b => b.id === req.params.bomId);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    mockDB.boms[idx].isDeleted = true;
    res.json({ data: mockDB.boms[idx] });
  });

  // ========== SESSION ROUTES ==========
  // Create session
  app.post('/api/sessions', testAuthMiddleware, (req: any, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    const newSession = {
      id: `session-${Date.now()}`,
      name,
      state: 'active',
      createdAt: new Date().toISOString(),
      isDeleted: false,
    };
    mockDB.sessions.push(newSession);
    res.status(201).json({ data: newSession });
  });

  // List sessions (admin only)
  app.get('/api/sessions', testAuthMiddleware, requireRole(['admin']), (req: any, res) => {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;
    const status = req.query.status as string | undefined;
    let items = mockDB.sessions.filter((s) => !s.isDeleted);
    if (status) items = items.filter((s) => s.state === status);
    res.json({ data: items.slice(offset, offset + limit), limit, offset, total: items.length });
  });

  // Get session by id
  app.get('/api/sessions/:sessionId', testAuthMiddleware, (req: any, res) => {
    const session = mockDB.sessions.find((s) => s.id === req.params.sessionId && !s.isDeleted);
    if (!session) return res.status(404).json({ error: 'Not found' });
    // attach related scans
    const scans = mockDB.scans.filter((sc) => sc.sessionId === session.id);
    res.json({ data: { ...session, scans } });
  });

  // Patch session (state transitions)
  app.patch('/api/sessions/:sessionId', testAuthMiddleware, requireRole(['supervisor', 'admin']), (req: any, res) => {
    const idx = mockDB.sessions.findIndex((s) => s.id === req.params.sessionId && !s.isDeleted);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    mockDB.sessions[idx] = { ...mockDB.sessions[idx], ...req.body, updatedAt: new Date().toISOString() };
    res.json({ data: mockDB.sessions[idx] });
  });

  // Delete (soft-delete) session
  app.delete('/api/sessions/:sessionId', testAuthMiddleware, requireRole(['supervisor', 'admin']), (req: any, res) => {
    const idx = mockDB.sessions.findIndex((s) => s.id === req.params.sessionId && !s.isDeleted);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    mockDB.sessions[idx].isDeleted = true;
    mockDB.sessions[idx].deletedAt = new Date().toISOString();
    res.json({ data: mockDB.sessions[idx] });
  });
  // Export BOM as CSV (test implementation)
  app.get('/api/boms/:bomId/export', testAuthMiddleware, requireRole(['admin', 'supervisor', 'qa']), (req: any, res: any) => {
    const bom = mockDB.boms.find(b => b.id === req.params.bomId);
    if (!bom) return res.status(404).json({ error: 'Not found' });

    // Simple CSV helpers for tests
    const csvSafeValue = (v: any) => {
      if (v === null || v === undefined) return '';
      const s = String(v).trim();
      if (/^[=+\-@]/.test(s)) return `'${s}`;
      return s;
    };
    const csvEscape = (v: any) => {
      const s = String(v ?? '');
      if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const rows: string[] = [];
    rows.push(['feederSlot', 'internalPartNumber', 'mpn1', 'quantity', 'createdAt'].join(','));
    for (const item of bom.items || []) {
      rows.push([
        csvEscape(csvSafeValue(item.feederSlot)),
        csvEscape(csvSafeValue(item.internalPartNumber)),
        csvEscape(csvSafeValue(item.mpn1)),
        csvEscape(csvSafeValue(item.quantity)),
        csvEscape(csvSafeValue(item.createdAt)),
      ].join(','));
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${(bom.name || 'bom').replace(/[^a-zA-Z0-9._-]/g, '_')}_${req.params.bomId}.csv"`);
    res.send(rows.join('\r\n'));
  });

  app.get('/api/boms/:bomId', testAuthMiddleware, (req: any, res: any) => {
    const bom = mockDB.boms.find(b => b.id === req.params.bomId);
    if (!bom) return res.status(404).json({ error: 'Not found' });
    res.json({ data: bom });
  });

  app.post('/api/scans', testAuthMiddleware, (req: any, res) => {
    const { sessionId, bomId } = req.body;
    if (!sessionId || !bomId) return res.status(400).json({ error: 'sessionId and bomId required' });
    const newScan = { id: `scan-${Date.now()}`, sessionId, bomId, stage: 1, createdAt: new Date().toISOString() };
    mockDB.scans.push(newScan);
    res.status(201).json({ data: newScan });
  });

  // List scans (admin only)
  app.get('/api/scans', testAuthMiddleware, requireRole(['admin']), (req: any, res) => {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;
    const items = mockDB.scans.slice(offset, offset + limit);
    res.json({ data: items, limit, offset, total: mockDB.scans.length });
  });

  // Get single scan
  app.get('/api/scans/:scanId', testAuthMiddleware, requireRole(['admin']), (req: any, res) => {
    const scan = mockDB.scans.find((s) => s.id === req.params.scanId);
    if (!scan) return res.status(404).json({ error: 'Not found' });
    res.json({ data: scan });
  });

  app.patch('/api/scans/:scanId', testAuthMiddleware, (req: any, res) => {
    const idx = mockDB.scans.findIndex(s => s.id === req.params.scanId);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    mockDB.scans[idx] = { ...mockDB.scans[idx], ...req.body };
    res.json({ data: mockDB.scans[idx] });
  });

  app.delete('/api/scans/:scanId', testAuthMiddleware, (req: any, res) => {
    const idx = mockDB.scans.findIndex(s => s.id === req.params.scanId);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    res.json({ data: mockDB.scans[idx] });
  });

  // ========== AUDIT ROUTES ==========
  app.get('/api/audit', testAuthMiddleware, (req: any, res) => {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;
    res.json({ data: [], limit, offset, total: 0 });
  });

  // ========== METRICS ROUTES ==========
  app.get('/api/metrics/dashboard', testAuthMiddleware, (_req, res) => {
    res.json({ data: { totalScans: 0, totalSessions: 0, avgScanTime: 0 } });
  });

  app.get('/api/metrics/scans', testAuthMiddleware, (_req, res) => {
    res.json({ data: { count: 0 } });
  });

  app.get('/api/metrics/efficiency', testAuthMiddleware, (_req, res) => {
    res.json({ data: { passRate: 0 } });
  });

  app.get('/api/metrics/trends', testAuthMiddleware, (_req, res) => {
    res.json({ data: { trends: [] } });
  });

  app.get('/api/metrics/boms', testAuthMiddleware, (_req, res) => {
    res.json({ data: { boms: [] } });
  });

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({ error: 'Not Found' });
  });

  return app;
}

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
export const expectSuccessResponse = (response: any, _expectedStatus: number = 200) => {
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
