import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createTestApp, createToken } from './fixtures';
import type { Application } from 'express';

describe('Session Routes', () => {
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

  describe('POST /api/sessions - Create Session', () => {
    it('should create new session', async () => {
      const response = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ name: 'Production Run 001' })
        .expect(201);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.state).toBe('active');
    });

    it('should return 400 with missing name', async () => {
      const response = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({})
        .expect(400);
      expect(response.body.error).toBeDefined();
    });

    it('should return 401 without auth', async () => {
      await request(app)
        .post('/api/sessions')
        .send({ name: 'Test Session' })
        .expect(401);
    });

    it('should include createdAt timestamp', async () => {
      const response = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({ name: 'Session with timestamp' })
        .expect(201);
      expect(response.body.data.createdAt).toBeDefined();
    });
  });

  describe('GET /api/sessions - List Sessions', () => {
    it('should return all sessions', async () => {
      const response = await request(app)
        .get('/api/sessions')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should support filtering by status', async () => {
      await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ name: 'Session for filtering' })
        .expect(201);

      const response = await request(app)
        .get('/api/sessions?status=active')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return 401 without auth', async () => {
      await request(app).get('/api/sessions').expect(401);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/sessions?limit=5&offset=0')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(response.body).toHaveProperty('limit');
      expect(response.body).toHaveProperty('offset');
    });
  });

  describe('GET /api/sessions/:sessionId - Get Session', () => {
    it('should return session with scans', async () => {
      const createResp = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ name: 'Session with scans' })
        .expect(201);

      const sessionId = createResp.body.data.id;
      const response = await request(app)
        .get(`/api/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(response.body.data).toBeDefined();
    });

    it('should return 404 for non-existent session', async () => {
      await request(app)
        .get('/api/sessions/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should return 401 without auth', async () => {
      await request(app).get('/api/sessions/some-id').expect(401);
    });
  });

  describe('PATCH /api/sessions/:sessionId - Update Session', () => {
    it('should transition session state', async () => {
      const createResp = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ name: 'Session to transition' })
        .expect(201);

      const sessionId = createResp.body.data.id;
      const response = await request(app)
        .patch(`/api/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({ state: 'completed' })
        .expect(200);
      expect(response.body.data.state).toBe('completed');
    });

    it('should return 404 for non-existent session', async () => {
      await request(app)
        .patch('/api/sessions/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ state: 'completed' })
        .expect(404);
    });

    it('should return 401 without auth', async () => {
      await request(app)
        .patch('/api/sessions/some-id')
        .send({ state: 'completed' })
        .expect(401);
    });
  });

  describe('DELETE /api/sessions/:sessionId - Delete Session', () => {
    it('should soft-delete session', async () => {
      const createResp = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ name: 'Session to delete' })
        .expect(201);

      const sessionId = createResp.body.data.id;
      await request(app)
        .delete(`/api/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .expect(200);
    });

    it('should return 404 for non-existent session', async () => {
      await request(app)
        .delete('/api/sessions/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should return 401 without auth', async () => {
      await request(app).delete('/api/sessions/some-id').expect(401);
    });
  });

  describe('Session State Transitions', () => {
    it('session should start in active state', async () => {
      const response = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ name: 'Active state test' })
        .expect(201);
      expect(response.body.data.state).toBe('active');
    });

    it('should support completed state transition', async () => {
      const createResp = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ name: 'Completion test' })
        .expect(201);

      const sessionId = createResp.body.data.id;
      const response = await request(app)
        .patch(`/api/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({ state: 'completed' })
        .expect(200);
      expect(response.body.data.state).toBe('completed');
    });
  });
});
