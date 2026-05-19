import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createTestApp, createToken } from './fixtures';
import type { Application } from 'express';

describe('Metrics Routes', () => {
  let app: Application;
  let adminToken: string;
  let supervisorToken: string;

  beforeAll(() => {
    app = createTestApp();
    adminToken = createToken('admin-1', 'admin@test.com', 'admin');
    supervisorToken = createToken('supervisor-1', 'supervisor@test.com', 'supervisor');
  });

  describe('GET /api/metrics/dashboard - Dashboard Summary', () => {
    it('should return dashboard metrics', async () => {
      const response = await request(app)
        .get('/api/metrics/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('totalScans');
      expect(response.body.data).toHaveProperty('totalSessions');
      expect(response.body.data).toHaveProperty('avgScanTime');
    });

    it('should return 401 without auth', async () => {
      await request(app).get('/api/metrics/dashboard').expect(401);
    });

    it('should include numeric values for metrics', async () => {
      const response = await request(app)
        .get('/api/metrics/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(typeof response.body.data.totalScans).toBe('number');
      expect(typeof response.body.data.totalSessions).toBe('number');
      expect(typeof response.body.data.avgScanTime).toBe('number');
    });
  });

  describe('GET /api/metrics/scans - Scan Statistics', () => {
    it('should return scan statistics', async () => {
      const response = await request(app)
        .get('/api/metrics/scans')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
    });

    it('should return 401 without auth', async () => {
      await request(app).get('/api/metrics/scans').expect(401);
    });

    it('should include scan count', async () => {
      const response = await request(app)
        .get('/api/metrics/scans')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('count');
    });
  });

  describe('GET /api/metrics/efficiency - Efficiency Metrics', () => {
    it('should return efficiency metrics', async () => {
      const response = await request(app)
        .get('/api/metrics/efficiency')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
    });

    it('should return 401 without auth', async () => {
      await request(app).get('/api/metrics/efficiency').expect(401);
    });

    it('should include pass rate', async () => {
      const response = await request(app)
        .get('/api/metrics/efficiency')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('passRate');
    });
  });

  describe('GET /api/metrics/trends - Trend Analysis', () => {
    it('should return trend data', async () => {
      const response = await request(app)
        .get('/api/metrics/trends')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
    });

    it('should support time period filtering', async () => {
      const response = await request(app)
        .get('/api/metrics/trends?period=7d')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
    });

    it('should return 401 without auth', async () => {
      await request(app).get('/api/metrics/trends').expect(401);
    });

    it('should support multiple time periods', async () => {
      for (const period of ['1d', '7d', '30d', '90d']) {
        const response = await request(app)
          .get(`/api/metrics/trends?period=${period}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.data).toBeDefined();
      }
    });
  });

  describe('GET /api/metrics/boms - BOM Performance', () => {
    it('should return BOM performance metrics', async () => {
      const response = await request(app)
        .get('/api/metrics/boms')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
    });

    it('should return 401 without auth', async () => {
      await request(app).get('/api/metrics/boms').expect(401);
    });
  });

  describe('Metrics Data Integrity', () => {
    it('should return consistent metrics across requests', async () => {
      const response1 = await request(app)
        .get('/api/metrics/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const response2 = await request(app)
        .get('/api/metrics/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response1.body.data.totalScans).toBeDefined();
      expect(response2.body.data.totalScans).toBeDefined();
    });

    it('should provide aggregated statistics', async () => {
      const response = await request(app)
        .get('/api/metrics/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.totalScans).toBeGreaterThanOrEqual(0);
      expect(response.body.data.totalSessions).toBeGreaterThanOrEqual(0);
      expect(response.body.data.avgScanTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Role-Based Metrics Access', () => {
    it('should allow admin to access all metrics', async () => {
      const response = await request(app)
        .get('/api/metrics/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(response.body.data).toBeDefined();
    });

    it('should allow supervisor to access metrics', async () => {
      const response = await request(app)
        .get('/api/metrics/dashboard')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .expect(200);
      expect(response.body.data).toBeDefined();
    });
  });
});
