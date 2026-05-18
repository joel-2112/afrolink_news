import { Router } from 'express';
import { dashboard } from './author.controller';
import { authenticate } from '../../middlewares/auth';
import { requireRole } from '../../middlewares/rbac';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Author
 *   description: Author performance and engagement metrics
 */

/**
 * @swagger
 * /author/dashboard:
 *   get:
 *     summary: Get author engagement dashboard (Author only)
 *     tags: [Author]
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       Returns a paginated list of the author's articles
 *       (excluding soft-deleted), each with Title, CreatedAt,
 *       and TotalViews summed from DailyAnalytics.
 *     parameters:
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/sizeParam'
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *             example:
 *               Success: true
 *               Message: Dashboard retrieved successfully
 *               Object:
 *                 - id: uuid-here
 *                   title: My Article Title
 *                   category: Tech
 *                   status: Published
 *                   createdAt: "2024-01-01T00:00:00.000Z"
 *                   totalViews: 1024
 *               PageNumber: 1
 *               PageSize: 10
 *               TotalSize: 3
 *               Errors: null
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get(
  '/dashboard',
  authenticate,
  requireRole('author'),
  dashboard
);

export default router;