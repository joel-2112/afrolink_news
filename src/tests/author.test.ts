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
    },
    $queryRaw: jest.fn(),
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

describe('Author Dashboard Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /author/dashboard', () => {
    it('should retrieve author dashboard analytics', async () => {
      const mockDashboardArticles = [
        {
          id: 'article-uuid',
          title: 'Author Article',
          category: 'Tech',
          status: 'Published',
          createdAt: new Date().toISOString(),
          totalViews: 42n,
        },
      ];

      (prisma.article.count as jest.Mock).mockResolvedValue(1);
      (prisma.$queryRaw as jest.Mock).mockResolvedValue(mockDashboardArticles);

      const res = await request(app)
        .get('/author/dashboard')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.Success).toBe(true);
      expect(res.body.Object).toEqual([
        {
          ...mockDashboardArticles[0],
          totalViews: 42,
        },
      ]);
    });

    it('should return 403 for readers trying to access dashboard', async () => {
      const readerToken = jwt.sign(
        { sub: 'reader-uuid', role: 'reader' },
        process.env.JWT_SECRET || 'super-secret-key'
      );

      const res = await request(app)
        .get('/author/dashboard')
        .set('Authorization', `Bearer ${readerToken}`);

      expect(res.status).toBe(403);
    });

    it('should return 401 if unauthorized', async () => {
      const res = await request(app).get('/author/dashboard');

      expect(res.status).toBe(401);
    });
  });
});
