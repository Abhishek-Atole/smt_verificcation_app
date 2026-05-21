import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createTestApp } from './fixtures';
import type { Application } from 'express';

/**
 * Health Routes Tests
 * Validates basic health checks and connectivity
 */
describe('Health Routes', () => {
  let app: Application;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('GET /api/health - Server Status', () => {
    it('should return health status without authentication', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body.status).toBe('healthy');
    });

    it('should return valid response structure', async () => {
      const response = await request(app)
        .get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should include valid timestamp', async () => {
      const response = await request(app)
        .get('/api/health');

      expect(response.body.timestamp).toBeDefined();
      const timestamp = new Date(response.body.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).toBeGreaterThan(0);
    });

    it('should be accessible without Bearer token', async () => {
      // Verify no Authorization header is required
      const response = await request(app)
        .get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
    });
  });
});
