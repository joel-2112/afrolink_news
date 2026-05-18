import { Router } from 'express';
import { dashboard } from './author.controller';
import { authenticate } from '../../middlewares/auth';
import { requireRole } from '../../middlewares/rbac';

const router = Router();

// GET /author/dashboard — author only + paginated
router.get(
  '/dashboard',
  authenticate,
  requireRole('author'),
  dashboard
);

export default router;