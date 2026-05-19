import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createTestApp, createToken } from './fixtures';
import type { Application } from 'express';

describe('BOM Routes', () => {
  let app: Application;
  let adminToken: string;
  let supervisorToken: string;
  let operatorToken: string;

  beforeAll(() => {
    app = createTestApp();
    adminToken = createToken('admin-1', 'admin@test.com', 'admin');
    supervisorToken = createToken('supervisor-1', 'supervisor@test.com', 'supervisor');
    operatorToken = createToken('operator-1', 'operator@test.com', 'operator');
  });

  describe('POST /api/boms - Create BOM', () => {
    it('should create new BOM with valid data', async () => {
      const response = await request(app)
        .post('/api/boms')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({ name: 'PCB Assembly v1.0', description: 'Main control board' })
        .expect(201);
      expect(response.body.data).toBeDefined();
    });

    it('should return 400 with missing required fields', async () => {
      const response = await request(app)
        .post('/api/boms')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({ description: 'Missing name' })
        .expect(400);
      expect(response.body.error).toBeDefined();
    });

    it('should return 401 for unauthorized operator', async () => {
      await request(app)
        .post('/api/boms')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ name: 'Test BOM' })
        .expect(401);
    });

    it('should include createdAt timestamp', async () => {
      const response = await request(app)
        .post('/api/boms')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Timestamped BOM', description: 'Check timestamp' })
        .expect(201);
      expect(response.body.data.createdAt).toBeDefined();
    });
  });

  describe('GET /api/boms - List BOMs', () => {
    it('should return all BOMs', async () => {
      const response = await request(app)
        .get('/api/boms')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/boms?limit=2&offset=0')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(response.body.limit).toBe(2);
    });

    it('should enforce maximum limit of 100', async () => {
      const response = await request(app)
        .get('/api/boms?limit=500')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(response.body.limit).toBeLessThanOrEqual(100);
    });

    it('should return 401 without auth token', async () => {
      await request(app).get('/api/boms').expect(401);
    });

    it('should allow operator to list BOMs', async () => {
      const response = await request(app)
        .get('/api/boms')
        .set('Authorization', `Bearer ${operatorToken}`)
        .expect(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/boms/:bomId - Get BOM Details', () => {
    it('should return BOM with items', async () => {
      const createResp = await request(app)
        .post('/api/boms')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'BOM with items', description: 'Test' })
        .expect(201);

      const bomId = createResp.body.data.id;
      const response = await request(app)
        .get(`/api/boms/${bomId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(response.body.data.id).toBe(bomId);
    });

    it('should return 404 for non-existent BOM', async () => {
      await request(app)
        .get('/api/boms/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should return 401 without auth token', async () => {
      await request(app).get('/api/boms/some-id').expect(401);
    });
  });

  describe('PATCH /api/boms/:bomId - Update BOM', () => {
    it('should update BOM with valid data', async () => {
      const createResp = await request(app)
        .post('/api/boms')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Original Name', description: 'Original desc' })
        .expect(201);

      const bomId = createResp.body.data.id;
      const response = await request(app)
        .patch(`/api/boms/${bomId}`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({ name: 'Updated Name' })
        .expect(200);
      expect(response.body.data.name).toBe('Updated Name');
    });

    it('should return 404 for non-existent BOM', async () => {
      await request(app)
        .patch('/api/boms/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'New name' })
        .expect(404);
    });

    it('should return 401 without auth token', async () => {
      await request(app)
        .patch('/api/boms/some-id')
        .send({ name: 'New name' })
        .expect(401);
    });
  });

  describe('DELETE /api/boms/:bomId - Delete BOM', () => {
    it('should soft-delete BOM', async () => {
      const createResp = await request(app)
        .post('/api/boms')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'To Delete', description: 'Will be deleted' })
        .expect(201);

      const bomId = createResp.body.data.id;
      const response = await request(app)
        .delete(`/api/boms/${bomId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(response.body.data.isDeleted).toBe(true);
    });

    it('should return 404 for non-existent BOM', async () => {
      await request(app)
        .delete('/api/boms/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should return 401 without auth token', async () => {
      await request(app).delete('/api/boms/some-id').expect(401);
    });
  });

  describe('Role-Based BOM Access', () => {
    it('should allow admin to manage BOMs', async () => {
      const response = await request(app)
        .post('/api/boms')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Admin BOM', description: 'test' })
        .expect(201);
      expect(response.body.data).toBeDefined();
    });

    it('should allow supervisor to create BOMs', async () => {
      const response = await request(app)
        .post('/api/boms')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({ name: 'Supervisor BOM', description: 'test' })
        .expect(201);
      expect(response.body.data).toBeDefined();
    });

    it('should deny operator from creating BOMs', async () => {
      await request(app)
        .post('/api/boms')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ name: 'Operator BOM', description: 'test' })
        .expect(401);
    });
  });
});
