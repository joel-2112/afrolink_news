import { Router } from 'express';
import {
  create,
  update,
  remove,
  getMe,
  getAll,
  getOne,
} from './article.controller';
import { authenticate, optionalAuth } from '../../middlewares/auth';
import { requireRole } from '../../middlewares/rbac';
import { validate } from '../../middlewares/validate';
import {
  createArticleSchema,
  updateArticleSchema,
} from './article.schema';

const router = Router();

// ── Public routes ─────────────────────────────────────────────

// GET /articles — public feed, no auth required
router.get('/', getAll);

// GET /articles/:id — optionalAuth captures readerId if logged in
// IMPORTANT: /me must be registered BEFORE /:id
// otherwise Express matches "me" as an id param
router.get('/me', authenticate, requireRole('author'), getMe);

router.get('/:id', optionalAuth, getOne);

// ── Author only routes ────────────────────────────────────────

router.post(
  '/',
  authenticate,
  requireRole('author'),
  validate(createArticleSchema),
  create
);

router.put(
  '/:id',
  authenticate,
  requireRole('author'),
  validate(updateArticleSchema),
  update
);

router.delete(
  '/:id',
  authenticate,
  requireRole('author'),
  remove
);

export default router;