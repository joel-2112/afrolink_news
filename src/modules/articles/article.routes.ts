import { Router } from 'express';
import {
  create, update, remove,
  getMe, getAll, getOne,
} from './article.controller';
import { authenticate, optionalAuth } from '../../middlewares/auth';
import { requireRole } from '../../middlewares/rbac';
import { validate } from '../../middlewares/validate';
import { createArticleSchema, updateArticleSchema } from './article.schema';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Articles
 *   description: Article management and public news feed
 */

/**
 * @swagger
 * /articles:
 *   get:
 *     summary: Get published articles (public feed)
 *     tags: [Articles]
 *     parameters:
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/sizeParam'
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Exact category match (e.g. Tech, Sports)
 *       - in: query
 *         name: author
 *         schema:
 *           type: string
 *         description: Partial author name match
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Keyword search in article title
 *     responses:
 *       200:
 *         description: Paginated list of published articles
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get('/', getAll);

/**
 * @swagger
 * /articles/me:
 *   get:
 *     summary: Get my articles — drafts and published (Author only)
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/pageParam'
 *       - $ref: '#/components/parameters/sizeParam'
 *       - in: query
 *         name: includeDeleted
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include soft-deleted articles marked as deleted
 *     responses:
 *       200:
 *         description: Paginated list of author articles
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/me', authenticate, requireRole('author'), getMe);

/**
 * @swagger
 * /articles/{id}:
 *   get:
 *     summary: Read a single article and log the view
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       Auth is optional. If a valid JWT is provided, the ReadLog
 *       records the ReaderId. Otherwise it is recorded as a guest read.
 *       Every successful call creates a ReadLog entry (non-blocking).
 *     parameters:
 *       - $ref: '#/components/parameters/articleIdParam'
 *     responses:
 *       200:
 *         description: Article retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BaseResponse'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       410:
 *         description: Article was soft-deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               Success: false
 *               Message: News article no longer available
 *               Object: null
 *               Errors: null
 */
router.get('/:id', optionalAuth, getOne);

/**
 * @swagger
 * /articles:
 *   post:
 *     summary: Create a new article (Author only)
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateArticleInput'
 *     responses:
 *       201:
 *         description: Article created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BaseResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.post(
  '/',
  authenticate,
  requireRole('author'),
  validate(createArticleSchema),
  create
);

/**
 * @swagger
 * /articles/{id}:
 *   put:
 *     summary: Update own article (Author only)
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/articleIdParam'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateArticleInput'
 *     responses:
 *       200:
 *         description: Article updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BaseResponse'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Forbidden — not your article
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               Success: false
 *               Message: Forbidden
 *               Object: null
 *               Errors: null
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put(
  '/:id',
  authenticate,
  requireRole('author'),
  validate(updateArticleSchema),
  update
);

/**
 * @swagger
 * /articles/{id}:
 *   delete:
 *     summary: Soft delete own article (Author only)
 *     tags: [Articles]
 *     security:
 *       - bearerAuth: []
 *     description: >
 *       Does NOT remove the row. Sets DeletedAt to current timestamp.
 *       The article becomes invisible on all public endpoints.
 *     parameters:
 *       - $ref: '#/components/parameters/articleIdParam'
 *     responses:
 *       200:
 *         description: Article soft-deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BaseResponse'
 *             example:
 *               Success: true
 *               Message: Article deleted successfully
 *               Object: null
 *               Errors: null
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete(
  '/:id',
  authenticate,
  requireRole('author'),
  remove
);

export default router;