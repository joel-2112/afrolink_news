import request from 'supertest';
import app from '../server';
import prisma from '../config/database';
import argon2 from 'argon2';

jest.mock('../config/database', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('../config/redis', () => ({
  __esModule: true,
  default: {
    on: jest.fn(),
    set: jest.fn(),
  },
}));

jest.mock('../jobs', () => ({
  __esModule: true,
  initJobs: jest.fn(),
}));

jest.mock('argon2', () => ({
  __esModule: true,
  default: {
    hash: jest.fn().mockResolvedValue('hashed-password'),
    verify: jest.fn().mockResolvedValue(true),
  },
  hash: jest.fn().mockResolvedValue('hashed-password'),
  verify: jest.fn().mockResolvedValue(true),
}));

describe('Auth Endpoints', () => {
  beforeEach(() => {
    (argon2.hash as jest.Mock).mockResolvedValue('hashed-password');
    (argon2.verify as jest.Mock).mockResolvedValue(true);
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const mockUser = {
        id: 'user-uuid',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'author',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'Password@123',
          role: 'author',
        });

      expect(res.status).toBe(201);
      expect(res.body.Success).toBe(true);
      expect(res.body.Object).toEqual(mockUser);
    });

    it('should return 409 if email already exists', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'existing-id' });

      const res = await request(app)
        .post('/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'Password@123',
          role: 'author',
        });

      expect(res.status).toBe(409);
      expect(res.body.Success).toBe(false);
    });

    it('should return 400 for validation errors', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({
          name: 'John',
          email: 'invalid-email',
          password: '123',
          role: 'invalid-role',
        });

      expect(res.status).toBe(400);
      expect(res.body.Success).toBe(false);
    });
  });

  describe('POST /auth/login', () => {
    it('should login successfully and return JWT', async () => {
      const mockUser = {
        id: 'user-uuid',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'author',
        password: 'hashed-password',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'john@example.com',
          password: 'Password@123',
        });

      expect(res.status).toBe(200);
      expect(res.body.Success).toBe(true);
      expect(res.body.Object.token).toBeDefined();
    });

    it('should return 401 for invalid credentials', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password@123',
        });

      expect(res.status).toBe(401);
      expect(res.body.Success).toBe(false);
    });
  });
});
