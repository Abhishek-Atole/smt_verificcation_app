import express from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { env } from '@smt/config';

type MockUser = {
  id: string;
  email: string;
  passwordHash: string;
  role: string;
  firstName?: string;
  lastName?: string;
  createdAt: string;
  updatedAt: string;
};

let mockUserLookup: MockUser | null = null;

vi.mock('@smt/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(async () => (mockUserLookup ? [mockUserLookup] : [])),
        })),
      })),
    })),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  schema: {
    users: {
      id: 'id',
      email: 'email',
      passwordHash: 'passwordHash',
      role: 'role',
      firstName: 'firstName',
      lastName: 'lastName',
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      isDeleted: 'isDeleted',
    },
    rateLimits: {
      id: 'id',
      ipHash: 'ipHash',
      requestCount: 'requestCount',
      windowResetAt: 'windowResetAt',
    },
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((field: unknown, value: unknown) => ({ type: 'eq', field, value })),
  desc: vi.fn((field: unknown) => ({ type: 'desc', field })),
  lt: vi.fn((field: unknown, value: unknown) => ({ type: 'lt', field, value })),
}));

describe('Authentication Security', () => {
  beforeEach(() => {
    mockUserLookup = null;
  });

  it('verifyUserPassword returns true for correct password', async () => {
    const { verifyUserPassword } = await import('../../src/repositories/users');
    const hash = await bcrypt.hash('correct-password', 10);

    const result = await verifyUserPassword(hash, 'correct-password');

    expect(result).toBe(true);
  });

  it('verifyUserPassword returns false for wrong password', async () => {
    const { verifyUserPassword } = await import('../../src/repositories/users');
    const hash = await bcrypt.hash('correct-password', 10);

    const result = await verifyUserPassword(hash, 'wrong-password');

    expect(result).toBe(false);
  });

  it('authenticateUser returns null for unknown email', async () => {
    const { authenticateUser } = await import('../../src/repositories/users');

    const result = await authenticateUser('notexist@test.com', 'any-password');

    expect(result).toBeNull();
  });

  it('authenticateUser takes similar time for wrong email vs wrong password', async () => {
    const { authenticateUser } = await import('../../src/repositories/users');
    const hash = await bcrypt.hash('correct-password', 10);
    mockUserLookup = {
      id: 'exist-test-user',
      email: 'exist@test.com',
      passwordHash: hash,
      role: 'operator',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const start1 = Date.now();
    await authenticateUser('notexist@test.com', 'password');
    const time1 = Date.now() - start1;

    const start2 = Date.now();
    await authenticateUser('exist@test.com', 'wrong-password');
    const time2 = Date.now() - start2;

    expect(Math.abs(time1 - time2)).toBeLessThan(200);
  });
});

describe('Route Security', () => {
  let app: express.Express;
  let adminToken: string;
  let operatorToken: string;

  const mockUsersById = new Map<string, MockUser>();

  beforeAll(async () => {
    vi.resetModules();
    vi.doMock('../../src/repositories/users', () => ({
      getUserById: vi.fn(async (userId: string) => mockUsersById.get(userId) ?? null),
      getUserByEmail: vi.fn(async () => null),
      listUsers: vi.fn(async () => []),
      createUser: vi.fn(async () => null),
      updateUser: vi.fn(async () => null),
      deleteUser: vi.fn(async () => null),
      verifyUserPassword: vi.fn(async () => true),
      authenticateUser: vi.fn(async () => null),
    }));

    const [{ default: usersRouter }, { default: internalRouter }] = await Promise.all([
      import('../../src/routes/users'),
      import('../../src/routes/internal'),
    ]);

    app = express();
    app.use(express.json());
    app.use('/api/v1/users', usersRouter);
    app.use('/api/v1/internal', internalRouter);

    app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      const message = err instanceof Error ? err.message : String(err);
      const status = /requires one of|forbidden|not allowed/i.test(message) ? 403 : 401;
      res.status(status).json({ error: message });
    });

    adminToken = jwt.sign(
      { userId: 'admin-user-id', email: 'admin@test.com', role: 'admin' },
      env.JWT_SECRET,
      { algorithm: env.JWT_ALGORITHM as any }
    );
    operatorToken = jwt.sign(
      { userId: 'operator-user-id', email: 'operator@test.com', role: 'operator' },
      env.JWT_SECRET,
      { algorithm: env.JWT_ALGORITHM as any }
    );

    mockUsersById.set('admin-user-id', {
      id: 'admin-user-id',
      email: 'admin@test.com',
      passwordHash: 'hashed-admin',
      role: 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    mockUsersById.set('operator-user-id', {
      id: 'operator-user-id',
      email: 'operator@test.com',
      passwordHash: 'hashed-operator',
      role: 'operator',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  it('GET /users/:id returns 403 when operator requests another user', async () => {
    const res = await request(app)
      .get('/api/v1/users/admin-user-id')
      .set('Authorization', `Bearer ${operatorToken}`);

    expect(res.status).toBe(403);
  });

  it('GET /users/:id never returns passwordHash field', async () => {
    const res = await request(app)
      .get('/api/v1/users/admin-user-id')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).not.toHaveProperty('passwordHash');
  });

  it('GET /internal/logs returns 401 without auth', async () => {
    const res = await request(app).get('/api/v1/internal/logs');

    expect(res.status).toBe(401);
  });

  it('GET /internal/logs returns 403 for operator role', async () => {
    const res = await request(app)
      .get('/api/v1/internal/logs')
      .set('Authorization', `Bearer ${operatorToken}`);

    expect(res.status).toBe(403);
  });

  it('GET /internal/logs returns 200 for admin role', async () => {
    const res = await request(app)
      .get('/api/v1/internal/logs')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
  });
});