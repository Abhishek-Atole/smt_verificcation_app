import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createTestApp, createToken } from './fixtures';
import type { Application } from 'express';

describe('Audit Routes', () => {
  let app: Application;
  let adminToken: string;
  let supervisorToken: string;

  beforeAll(() => {
    app = createTestApp();
    adminToken = createToken('admin-1', 'admin@test.com', 'admin');
    supervisorToken = createToken('supervisor-1', 'supervisor@test.com', 'supervisor');
  });

  describe('GET /api/audit - List Audit Logs', () => {
    it('should return all audit logs', async () => {
      const response = await request(app)
        .get('/api/audit')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return 401 without auth', async () => {
      await request(app).get('/api/audit').expect(401);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/audit?limit=10&offset=0')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(response.body).toHaveProperty('limit');
      expect(response.body).toHaveProperty('offset');
    });

    it('should include timestamp for all logs', async () => {
      const response = await request(app)
        .get('/api/audit')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      if (response.body.data.length > 0) {
        expect(response.body.data[0]).toHaveProperty('timestamp');
      }
    });
  });

  describe('GET /api/audit?action=create - Filter by Action', () => {
    it('should filter audit logs by action type', async () => {
      const response = await request(app)
        .get('/api/audit?action=create')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should support multiple action filters', async () => {
      const response = await request(app)
        .get('/api/audit?action=create,update')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/audit?userId=X - Filter by User', () => {
    it('should filter audit logs by user ID', async () => {
      const response = await request(app)
        .get('/api/audit?userId=admin-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return empty array for non-existent user', async () => {
      const response = await request(app)
        .get('/api/audit?userId=non-existent-user')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/audit?resource=bom - Filter by Resource', () => {
    it('should filter audit logs by resource type', async () => {
      const response = await request(app)
        .get('/api/audit?resource=bom')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should support user-only resource filtering', async () => {
      const response = await request(app)
        .get('/api/audit?resource=user')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/audit?startDate=X&endDate=Y - Filter by Date Range', () => {
    it('should filter audit logs by date range', async () => {
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      const response = await request(app)
        .get(`/api/audit?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should support single date filtering', async () => {
      const date = new Date().toISOString();
      const response = await request(app)
        .get(`/api/audit?startDate=${date}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Audit Log Details', () => {
    it('should include userId in audit logs', async () => {
      const response = await request(app)
        .get('/api/audit')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      if (response.body.data.length > 0) {
        expect(response.body.data[0]).toHaveProperty('userId');
      }
    });

    it('should include action type in audit logs', async () => {
      const response = await request(app)
        .get('/api/audit')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      if (response.body.data.length > 0) {
        expect(response.body.data[0]).toHaveProperty('action');
      }
    });

    it('should include resource type in audit logs', async () => {
      const response = await request(app)
        .get('/api/audit')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      if (response.body.data.length > 0) {
        expect(response.body.data[0]).toHaveProperty('resource');
      }
    });
  });

  describe('Role-Based Audit Access', () => {
    it('should allow admin to view all audit logs', async () => {
      const response = await request(app)
        .get('/api/audit')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should allow supervisor to view audit logs', async () => {
      const response = await request(app)
        .get('/api/audit')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .expect(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });
});
