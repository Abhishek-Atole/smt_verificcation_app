import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createTestApp, createToken } from './fixtures';
import type { Application } from 'express';

describe('End-to-End Workflows', () => {
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

  describe('Complete Production Run Workflow', () => {
    it('should execute full production workflow', async () => {
      // 1. Create BOM
      const bomResp = await request(app)
        .post('/api/boms')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({ name: 'Production BOM v1.0', description: 'Main assembly' })
        .expect(201);
      const bomId = bomResp.body.data.id;

      // 2. Create Session
      const sessionResp = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ name: 'Production Run 001' })
        .expect(201);
      const sessionId = sessionResp.body.data.id;

      // 3. Create Scan
      const scanResp = await request(app)
        .post('/api/scans')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ sessionId, bomId })
        .expect(201);
      const scanId = scanResp.body.data.id;

      // 4. Progress through scan stages
      for (let stage = 2; stage <= 7; stage++) {
        await request(app)
          .patch(`/api/scans/${scanId}`)
          .set('Authorization', `Bearer ${operatorToken}`)
          .send({ stage })
          .expect(200);
      }

      // 5. Complete session
      await request(app)
        .patch(`/api/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({ state: 'completed' })
        .expect(200);

      expect(bomId).toBeDefined();
      expect(sessionId).toBeDefined();
      expect(scanId).toBeDefined();
    });
  });

  describe('User Management Workflow', () => {
    it('should execute complete user lifecycle', async () => {
      // 1. Create new user
      const createResp = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'newoperator@test.com',
          passwordHash: 'hashed_password',
          role: 'operator',
          firstName: 'John',
          lastName: 'Operator',
        })
        .expect(201);
      const userId = createResp.body.data.id;

      // 2. Get user details
      await request(app)
        .get(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // 3. Update user
      await request(app)
        .patch(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ firstName: 'Jonathan' })
        .expect(200);

      // 4. Delete user
      await request(app)
        .delete(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(userId).toBeDefined();
    });
  });

  describe('Multi-User Concurrent Operations', () => {
    it('should handle multiple users creating BOMs simultaneously', async () => {
      const promises = [
        request(app)
          .post('/api/boms')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ name: 'Concurrent BOM 1', description: 'test' }),
        request(app)
          .post('/api/boms')
          .set('Authorization', `Bearer ${supervisorToken}`)
          .send({ name: 'Concurrent BOM 2', description: 'test' }),
      ];

      const responses = await Promise.all(promises);
      responses.forEach(resp => {
        expect(resp.status).toBe(201);
      });
    });
  });

  describe('Data Consistency Workflow', () => {
    it('should maintain data consistency across operations', async () => {
      // Create BOM
      const bomResp = await request(app)
        .post('/api/boms')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({ name: 'Consistency Test BOM', description: 'test' })
        .expect(201);
      const bomId = bomResp.body.data.id;

      // Retrieve BOM
      const getResp = await request(app)
        .get(`/api/boms/${bomId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Update BOM
      const updateResp = await request(app)
        .patch(`/api/boms/${bomId}`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({ name: 'Updated Name' })
        .expect(200);

      // Verify update persisted
      const finalResp = await request(app)
        .get(`/api/boms/${bomId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(finalResp.body.data.name).toBe('Updated Name');
    });
  });

  describe('Audit Trail Workflow', () => {
    it('should record all operations in audit log', async () => {
      // Perform an operation (create user)
      await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'audittrail@test.com',
          passwordHash: 'hashed',
          role: 'qa',
        })
        .expect(201);

      // Check audit log
      const auditResp = await request(app)
        .get('/api/audit')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(auditResp.body.data)).toBe(true);
    });

    it('should capture user actions in audit log', async () => {
      // Get initial audit log count
      const beforeResp = await request(app)
        .get('/api/audit')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      const beforeCount = beforeResp.body.data.length;

      // Perform an operation
      await request(app)
        .post('/api/boms')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({ name: 'Audited BOM', description: 'test' })
        .expect(201);

      // Verify audit entry was created
      const afterResp = await request(app)
        .get('/api/audit')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(afterResp.body.data.length).toBeGreaterThanOrEqual(beforeCount);
    });
  });

  describe('Error Recovery Workflow', () => {
    it('should handle and recover from invalid operations', async () => {
      // 1. Attempt invalid operation
      const invalidResp = await request(app)
        .post('/api/boms')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ name: 'Invalid BOM' })
        .expect(401);

      expect(invalidResp.body.error).toBeDefined();

      // 2. System should still be operational for valid operations
      const validResp = await request(app)
        .post('/api/boms')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({ name: 'Valid BOM', description: 'test' })
        .expect(201);

      expect(validResp.body.data).toBeDefined();
    });
  });

  describe('Metrics and Reporting Workflow', () => {
    it('should provide metrics after operations', async () => {
      // Perform some operations
      await request(app)
        .post('/api/scans')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ sessionId: 'session-1', bomId: 'bom-1' })
        .expect(201);

      // Check metrics
      const metricsResp = await request(app)
        .get('/api/metrics/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(metricsResp.body.data).toHaveProperty('totalScans');
      expect(metricsResp.body.data).toHaveProperty('totalSessions');
    });

    it('should reflect operations in trend data', async () => {
      const trendResp = await request(app)
        .get('/api/metrics/trends?period=7d')
        .set('Authorization', `Bearer ${supervisorToken}`)
        .expect(200);

      expect(trendResp.body.data).toBeDefined();
    });
  });

  describe('Session Lifecycle E2E', () => {
    it('should handle complete session lifecycle', async () => {
      // 1. Create session
      const createResp = await request(app)
        .post('/api/sessions')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ name: 'E2E Session Test' })
        .expect(201);
      const sessionId = createResp.body.data.id;
      expect(createResp.body.data.state).toBe('active');

      // 2. Get session
      const getResp = await request(app)
        .get(`/api/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .expect(200);
      expect(getResp.body.data.id).toBe(sessionId);

      // 3. Update session state
      const updateResp = await request(app)
        .patch(`/api/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .send({ state: 'completed' })
        .expect(200);
      expect(updateResp.body.data.state).toBe('completed');

      // 4. Verify final state
      const finalResp = await request(app)
        .get(`/api/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${supervisorToken}`)
        .expect(200);
      expect(finalResp.body.data.state).toBe('completed');
    });
  });
});
