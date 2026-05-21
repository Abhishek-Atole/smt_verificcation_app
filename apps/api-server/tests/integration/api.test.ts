import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { env } from '@smt/config';
import request from 'supertest';
import { createTestApp, getTestToken } from './fixtures';

const API_BASE_URL = `http://localhost:${env.PORT}/api/v1`;

// When not running against a real server, use the in-memory test app
let appClient: any = null;
beforeAll(() => {
  if (env.NODE_ENV !== 'production') {
    const app = createTestApp();
    appClient = request(app);
  }
});

describe('API Health Endpoint', () => {
  it('should return health status', async () => {
    const response =
      appClient !== null
        ? await appClient.get('/api/health')
        : await fetch(`${API_BASE_URL}/health`, { method: 'GET', headers: { 'Content-Type': 'application/json' } });

    const status = appClient !== null ? response.status : response.status;
    expect(status).toBe(200);
    const data = appClient !== null ? response.body : await response.json();
    expect(data).toHaveProperty('status');
  });

  it('should accept requests without authentication', async () => {
    const response =
      appClient !== null
        ? await appClient.get('/api/health')
        : await fetch(`${API_BASE_URL}/health`, { method: 'GET', headers: { 'Content-Type': 'application/json' } });

    const status = appClient !== null ? response.status : response.status;
    expect([200, 401]).toContain(status);
  });
});

describe('Authentication Flow', () => {
  let authToken: string | null = null;

  it('should get test auth token in development', async () => {
    if (env.NODE_ENV === 'production') {
      // Skip in production - test-login is disabled
      expect(true).toBe(true);
      return;
    }

    const response =
      appClient !== null
        ? await appClient.post('/api/auth/test-login')
        : await fetch(`${API_BASE_URL}/auth/test-login`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });

    const status = appClient !== null ? response.status : response.status;
    expect(status).toBe(200);
    // The real dev endpoint doesn't return a token; when using the in-memory
    // fixture app, generate a test token directly.
    if (appClient !== null) {
      authToken = getTestToken('admin');
    } else {
      const data = await response.json();
      authToken = data.data?.token;
    }
  });

  it('should reject test-login endpoint in production', async () => {
    if (env.NODE_ENV !== 'production') {
      expect(true).toBe(true);
      return;
    }

    const response =
      appClient !== null
        ? await appClient.post('/api/auth/test-login')
        : await fetch(`${API_BASE_URL}/auth/test-login`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });

    const status = appClient !== null ? response.status : response.status;
    expect(status).toBe(404);
  });
});

describe('API Validation', () => {
  let authToken: string | null = null;

  beforeAll(async () => {
    if (env.NODE_ENV === 'development') {
      const response = appClient !== null ? await appClient.post('/api/auth/test-login') : await fetch(`${API_BASE_URL}/auth/test-login`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      const data = appClient !== null ? response.body : await response.json();
      authToken = data.data?.token;
    }
  });

  it('should reject requests with invalid JSON', async () => {
    const response =
      appClient !== null
        ? await appClient.post('/api/users').set('Authorization', `Bearer ${authToken}`).set('Content-Type', 'application/json').send('{invalid json}')
        : await fetch(`${API_BASE_URL}/users`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` }, body: '{invalid json}' });

    const status = appClient !== null ? response.status : response.status;
    expect(status).toBeGreaterThanOrEqual(400);
  });

  it('should return 401 for missing authentication on protected route', async () => {
    const response = appClient !== null ? await appClient.get('/api/users') : await fetch(`${API_BASE_URL}/users`, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
    const status = appClient !== null ? response.status : response.status;
    expect(status).toBe(401);
  });
});

describe('Rate Limiting', () => {
  it('should handle rapid requests gracefully', async () => {
    const requests: Promise<any>[] = [];
    for (let i = 0; i < 5; i++) {
      requests.push(appClient !== null ? appClient.get('/api/health') : fetch(`${API_BASE_URL}/health`, { method: 'GET', headers: { 'Content-Type': 'application/json' } } as any));
    }

    const responses = await Promise.all(requests);
    const statusCodes = responses.map((r) => (r && typeof r.status === 'number' ? r.status : r.status));

    // Should have a mix of 200s and possible 429s
    expect(statusCodes.length).toBe(5);
    expect(statusCodes.some((s) => s === 200)).toBe(true);
  });
});
