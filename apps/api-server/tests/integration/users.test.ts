import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createTestApp, createToken } from './fixtures';
import type { Application } from 'express';

describe('User Routes', () => {
  let app: Application;
  let adminToken: string;
  let operatorToken: string;

  beforeAll(() => {
    app = createTestApp();
    adminToken = createToken('admin-user-1', 'admin@test.com', 'admin');
    operatorToken = createToken('operator-user-1', 'operator@test.com', 'operator');
  });

  describe('POST /api/users - Create User', () => {
    it('should create new user with valid data (admin)', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'newuser@test.com',
          passwordHash: 'hashed_password_123',
          role: 'qa',
          firstName: 'John',
          lastName: 'Doe',
        })
        .expect(201);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.email).toBe('newuser@test.com');
      expect(response.body.data.role).toBe('qa');
    });

    it('should reject user creation without admin role', async () => {
      await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({
          email: 'another@test.com',
          passwordHash: 'hashed_password',
          role: 'supervisor',
        })
        .expect(401);
    });

    it('should return 400 with missing required fields', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'incomplete@test.com',
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should return 409 on duplicate email', async () => {
      await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'duplicate@test.com',
          passwordHash: 'hashed_password',
          role: 'qa',
        })
        .expect(201);

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'duplicate@test.com',
          passwordHash: 'different_hash',
          role: 'supervisor',
        })
        .expect(409);

      expect(response.body.error).toBeDefined();
    });

    it('should return 401 without auth token', async () => {
      await request(app)
        .post('/api/users')
        .send({
          email: 'noauth@test.com',
          passwordHash: 'hashed_password',
          role: 'qa',
        })
        .expect(401);
    });
  });

  describe('GET /api/users - List Users', () => {
    it('should return all users (admin)', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body).toHaveProperty('limit');
      expect(response.body).toHaveProperty('offset');
      expect(response.body).toHaveProperty('total');
    });

    it('should support pagination with limit parameter', async () => {
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            email: `user${i}@test.com`,
            passwordHash: 'hashed_password',
            role: 'qa',
          });
      }

      const response = await request(app)
        .get('/api/users?limit=2&offset=0')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.limit).toBe(2);
      expect(response.body.offset).toBe(0);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
    });

    it('should enforce maximum limit of 100', async () => {
      const response = await request(app)
        .get('/api/users?limit=500')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.limit).toBeLessThanOrEqual(100);
    });

    it('should return 401 without auth token', async () => {
      await request(app)
        .get('/api/users')
        .expect(401);
    });
  });

  describe('GET /api/users/:userId - Get User', () => {
    it('should return user by ID', async () => {
      const createResponse = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'getuser@test.com',
          passwordHash: 'hashed_password',
          role: 'supervisor',
          firstName: 'Jane',
          lastName: 'Smith',
        })
        .expect(201);

      const userId = createResponse.body.data.id;

      const response = await request(app)
        .get(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(userId);
      expect(response.body.data.email).toBe('getuser@test.com');
    });

    it('should return 404 for non-existent user', async () => {
      await request(app)
        .get('/api/users/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should not include sensitive fields', async () => {
      const createResponse = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'sensitive@test.com',
          passwordHash: 'super_secret_hash_12345',
          role: 'qa',
        })
        .expect(201);

      const userId = createResponse.body.data.id;

      const response = await request(app)
        .get(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.passwordHash).toBeUndefined();
    });

    it('should return 401 without auth token', async () => {
      await request(app)
        .get('/api/users/some-id')
        .expect(401);
    });
  });

  describe('PATCH /api/users/:userId - Update User', () => {
    it('should update user with valid data', async () => {
      const createResponse = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'updateme@test.com',
          passwordHash: 'hashed_password',
          role: 'qa',
          firstName: 'Original',
        })
        .expect(201);

      const userId = createResponse.body.data.id;

      const response = await request(app)
        .patch(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Updated',
          lastName: 'NewName',
        })
        .expect(200);

      expect(response.body.data.firstName).toBe('Updated');
      expect(response.body.data.lastName).toBe('NewName');
    });

    it('should return 404 for non-existent user', async () => {
      await request(app)
        .patch('/api/users/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ firstName: 'NewName' })
        .expect(404);
    });

    it('should include updatedAt timestamp', async () => {
      const createResponse = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'timestamp@test.com',
          passwordHash: 'hashed_password',
          role: 'qa',
        })
        .expect(201);

      const userId = createResponse.body.data.id;

      const response = await request(app)
        .patch(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ firstName: 'Updated' })
        .expect(200);

      expect(response.body.data.updatedAt).toBeDefined();
    });

    it('should return 401 without auth token', async () => {
      await request(app)
        .patch('/api/users/some-id')
        .send({ firstName: 'NewName' })
        .expect(401);
    });
  });

  describe('DELETE /api/users/:userId - Delete User', () => {
    it('should soft-delete user (sets isDeleted and deletedAt)', async () => {
      const createResponse = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'deleme@test.com',
          passwordHash: 'hashed_password',
          role: 'qa',
        })
        .expect(201);

      const userId = createResponse.body.data.id;

      const response = await request(app)
        .delete(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.isDeleted).toBe(true);
      expect(response.body.data.deletedAt).toBeDefined();
      expect(response.body.message).toBe('User deleted successfully');
    });

    it('should return 404 for non-existent user', async () => {
      await request(app)
        .delete('/api/users/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should return 401 without auth token', async () => {
      await request(app)
        .delete('/api/users/some-id')
        .expect(401);
    });
  });

  describe('Role-Based Access Control', () => {
    it('should allow admin to create users', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'rbac1@test.com',
          passwordHash: 'hashed_password',
          role: 'qa',
        })
        .expect(201);

      expect(response.body.data).toBeDefined();
    });

    it('should deny operator to create users', async () => {
      await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({
          email: 'rbac2@test.com',
          passwordHash: 'hashed_password',
          role: 'qa',
        })
        .expect(401);
    });

    it('should deny operator to list users', async () => {
      await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${operatorToken}`)
        .expect(401);
    });

    it('should allow any authenticated user to get a user profile', async () => {
      // Create a user first
      const createResponse = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'profiletest@test.com',
          passwordHash: 'hashed_password',
          role: 'qa',
        })
        .expect(201);

      const userId = createResponse.body.data.id;

      // Operator can still read individual user profiles
      const response = await request(app)
        .get(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${operatorToken}`)
        .expect(200);

      expect(response.body.data).toBeDefined();
    });
  });
});
