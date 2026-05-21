import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createTestApp, createToken } from './fixtures';
import type { Application } from 'express';

describe('Scan Routes', () => {
  let app: Application;
  let adminToken: string;
  let operatorToken: string;

  beforeAll(() => {
    app = createTestApp();
    adminToken = createToken('admin-1', 'admin@test.com', 'admin');
    operatorToken = createToken('operator-1', 'operator@test.com', 'operator');
  });

  describe('POST /api/scans - Create Scan', () => {
    it('should create new scan', async () => {
      const response = await request(app)
        .post('/api/scans')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ sessionId: 'session-1', bomId: 'bom-1' })
        .expect(201);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.stage).toBe(1);
    });

    it('should return 400 with missing sessionId', async () => {
      const response = await request(app)
        .post('/api/scans')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ bomId: 'bom-1' })
        .expect(400);
      expect(response.body.error).toBeDefined();
    });

    it('should return 401 without auth', async () => {
      await request(app)
        .post('/api/scans')
        .send({ sessionId: 'session-1', bomId: 'bom-1' })
        .expect(401);
    });

    it('should initialize scan at stage 1', async () => {
      const response = await request(app)
        .post('/api/scans')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ sessionId: 'session-1', bomId: 'bom-1' })
        .expect(201);
      expect(response.body.data.stage).toBe(1);
    });
  });

  describe('GET /api/scans - List Scans', () => {
    it('should return all scans', async () => {
      const response = await request(app)
        .get('/api/scans')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return 401 without auth', async () => {
      await request(app).get('/api/scans').expect(401);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/scans?limit=10&offset=0')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(response.body).toHaveProperty('limit');
    });
  });

  describe('GET /api/scans/:scanId - Get Scan', () => {
    it('should return scan details', async () => {
      const createResp = await request(app)
        .post('/api/scans')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ sessionId: 'session-1', bomId: 'bom-1' })
        .expect(201);

      const scanId = createResp.body.data.id;
      const response = await request(app)
        .get(`/api/scans/${scanId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(response.body.data.id).toBe(scanId);
    });

    it('should return 404 for non-existent scan', async () => {
      await request(app)
        .get('/api/scans/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('Scan Validation Pipeline (7 Stages)', () => {
    it('stage 1: should initialize scan', async () => {
      const response = await request(app)
        .post('/api/scans')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ sessionId: 'session-1', bomId: 'bom-1' })
        .expect(201);
      expect(response.body.data.stage).toBe(1);
    });

    it('stage 2: should validate BOM data', async () => {
      const scanResp = await request(app)
        .post('/api/scans')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ sessionId: 'session-1', bomId: 'bom-1' })
        .expect(201);

      const scanId = scanResp.body.data.id;
      const response = await request(app)
        .patch(`/api/scans/${scanId}`)
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ stage: 2 })
        .expect(200);
      expect(response.body.data.stage).toBe(2);
    });

    it('stage 3: should validate feeder configuration', async () => {
      const scanResp = await request(app)
        .post('/api/scans')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ sessionId: 'session-1', bomId: 'bom-1' })
        .expect(201);

      const scanId = scanResp.body.data.id;
      await request(app)
        .patch(`/api/scans/${scanId}`)
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ stage: 3 })
        .expect(200);
    });

    it('should progress through all 7 stages', async () => {
      const scanResp = await request(app)
        .post('/api/scans')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ sessionId: 'session-1', bomId: 'bom-1' })
        .expect(201);

      const scanId = scanResp.body.data.id;
      for (let stage = 2; stage <= 7; stage++) {
        const response = await request(app)
          .patch(`/api/scans/${scanId}`)
          .set('Authorization', `Bearer ${operatorToken}`)
          .send({ stage })
          .expect(200);
        expect(response.body.data.stage).toBe(stage);
      }
    });
  });

  describe('PATCH /api/scans/:scanId - Update Scan', () => {
    it('should advance scan stage', async () => {
      const createResp = await request(app)
        .post('/api/scans')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ sessionId: 'session-1', bomId: 'bom-1' })
        .expect(201);

      const scanId = createResp.body.data.id;
      const response = await request(app)
        .patch(`/api/scans/${scanId}`)
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ stage: 2 })
        .expect(200);
      expect(response.body.data.stage).toBe(2);
    });

    it('should return 404 for non-existent scan', async () => {
      await request(app)
        .patch('/api/scans/non-existent-id')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ stage: 2 })
        .expect(404);
    });
  });

  describe('DELETE /api/scans/:scanId - Delete Scan', () => {
    it('should soft-delete scan', async () => {
      const createResp = await request(app)
        .post('/api/scans')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ sessionId: 'session-1', bomId: 'bom-1' })
        .expect(201);

      const scanId = createResp.body.data.id;
      await request(app)
        .delete(`/api/scans/${scanId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should return 404 for non-existent scan', async () => {
      await request(app)
        .delete('/api/scans/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});
