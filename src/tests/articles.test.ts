import request from 'supertest';
import app from '../server';
import prisma from '../config/database';
import jwt from 'jsonwebtoken';

const token = jwt.sign(
  { sub: 'author-uuid', role: 'author' },
  process.env.JWT_SECRET || 'super-secret-key'
);

jest.mock('../config/database', () => ({
  __esModule: true,
  default: {
    article: {
      count: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $queryRaw: jest.fn(),
  },
}));

jest.mock('../config/redis', () => ({
  __esModule: true,
  default: {
    on: jest.fn(),
    set: jest.fn().mockResolvedValue('OK'),
  },
}));

jest.mock('../config/queue', () => ({
  __esModule: true,
  analyticsQueue: {
    on: jest.fn(),
    add: jest.fn(),
  },
}));

jest.mock('../jobs', () => ({
  __esModule: true,
  initJobs: jest.fn(),
}));

describe('Articles Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /articles', () => {
    it('should return published articles feed', async () => {
      const mockArticles = [
        { id: '1', title: 'Article 1', category: 'Tech', status: 'Published' },
      ];

      (prisma.article.findMany as jest.Mock).mockResolvedValue(mockArticles);
      (prisma.article.count as jest.Mock).mockResolvedValue(1);

      const res = await request(app).get('/articles');

      expect(res.status).toBe(200);
      expect(res.body.Success).toBe(true);
      expect(res.body.Object).toEqual(mockArticles);
    });
  });

  describe('GET /articles/:id', () => {
    it('should retrieve a single article', async () => {
      const mockArticle = {
        id: 'article-uuid',
        title: 'Article 1',
        category: 'Tech',
        status: 'Published',
      };

      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ deletedAt: null }]);
      (prisma.article.findFirst as jest.Mock).mockResolvedValue(mockArticle);

      const res = await request(app).get('/articles/article-uuid');

      expect(res.status).toBe(200);
      expect(res.body.Success).toBe(true);
      expect(res.body.Object).toEqual(mockArticle);
    });

    it('should return 404 if article not found', async () => {
      (prisma.$queryRaw as jest.Mock).mockResolvedValue([]);

      const res = await request(app).get('/articles/nonexistent-uuid');

      expect(res.status).toBe(404);
      expect(res.body.Success).toBe(false);
    });
  });

  describe('POST /articles', () => {
    it('should create an article successfully for authors', async () => {
      const mockArticle = {
        id: 'new-article-uuid',
        title: 'New Article',
        content: 'This is a long content block that passes the fifty character check.',
        category: 'Tech',
        status: 'Draft',
        authorId: 'author-uuid',
      };

      (prisma.article.create as jest.Mock).mockResolvedValue(mockArticle);

      const res = await request(app)
        .post('/articles')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'New Article',
          content: 'This is a long content block that passes the fifty character check.',
          category: 'Tech',
          status: 'Draft',
        });

      expect(res.status).toBe(201);
      expect(res.body.Success).toBe(true);
      expect(res.body.Object).toEqual(mockArticle);
    });

    it('should return 403 if user is not author', async () => {
      const readerToken = jwt.sign(
        { sub: 'reader-uuid', role: 'reader' },
        process.env.JWT_SECRET || 'super-secret-key'
      );

      const res = await request(app)
        .post('/articles')
        .set('Authorization', `Bearer ${readerToken}`)
        .send({
          title: 'New Article',
          content: 'This is a long content block that passes the fifty character check.',
          category: 'Tech',
        });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /articles/:id', () => {
    it('should soft delete own article', async () => {
      const mockArticle = {
        id: 'article-uuid',
        authorId: 'author-uuid',
        deletedAt: null,
      };

      (prisma.article.findFirst as jest.Mock).mockResolvedValue(mockArticle);
      (prisma.article.update as jest.Mock).mockResolvedValue({
        ...mockArticle,
        deletedAt: new Date(),
      });

      const res = await request(app)
        .delete('/articles/article-uuid')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.Success).toBe(true);
    });
  });
});
