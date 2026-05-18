import { Request, Response, NextFunction } from 'express';
import {
  createArticle,
  updateArticle,
  softDeleteArticle,
  getMyArticles,
  getPublishedArticles,
  getArticleById,
} from './article.service';
import { articleQuerySchema } from './article.schema';
import { ok, created, paginated, fail } from '../../utils/response';

// ─── POST /articles ───────────────────────────────────────────

export const create = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const article = await createArticle(req.user!.sub, req.body);
    return created(res, 'Article created successfully', article);
  } catch (err) {
    next(err);
  }
};

// ─── PUT /articles/:id ────────────────────────────────────────

export const update = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const article = await updateArticle(
      req.params.id as string,
      req.user!.sub,
      req.body
    );
    return ok(res, 'Article updated successfully', article);
  } catch (err: any) {
    if (err.code === 'NOT_FOUND') return fail(res, 404, err.message);
    // spec: forbidden must return Success: false + "Forbidden" message
    if (err.code === 'FORBIDDEN') return fail(res, 403, 'Forbidden');
    next(err);
  }
};

// ─── DELETE /articles/:id ─────────────────────────────────────

export const remove = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await softDeleteArticle(req.params.id as string, req.user!.sub);
    return ok(res, 'Article deleted successfully', null);
  } catch (err: any) {
    if (err.code === 'NOT_FOUND') return fail(res, 404, err.message);
    if (err.code === 'FORBIDDEN') return fail(res, 403, 'Forbidden');
    next(err);
  }
};

// ─── GET /articles/me ─────────────────────────────────────────

export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // parse query — includeDeleted optional param
    const parsed = articleQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return fail(res, 400, 'Invalid query', parsed.error.issues.map(e => e.message));
    }

    const includeDeleted = req.query.includeDeleted === 'true';
    const { articles, total } = await getMyArticles(
      req.user!.sub,
      parsed.data,
      includeDeleted
    );

    return paginated(
      res,
      'Articles retrieved successfully',
      articles,
      parsed.data.page,
      parsed.data.size,
      total
    );
  } catch (err) {
    next(err);
  }
};

// ─── GET /articles ────────────────────────────────────────────

export const getAll = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsed = articleQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return fail(res, 400, 'Invalid query', parsed.error.issues.map(e => e.message));
    }

    const { articles, total } = await getPublishedArticles(parsed.data);

    return paginated(
      res,
      'Articles retrieved successfully',
      articles,
      parsed.data.page,
      parsed.data.size,
      total
    );
  } catch (err) {
    next(err);
  }
};

// ─── GET /articles/:id ────────────────────────────────────────

export const getOne = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // req.user is optional here — optionalAuth middleware
    const readerId = req.user?.sub ?? null;
    const article = await getArticleById(req.params.id as string, readerId);
    return ok(res, 'Article retrieved successfully', article);
  } catch (err: any) {
    // spec exact message must be preserved
    if (err.code === 'DELETED') {
      return fail(res, 410, 'News article no longer available');
    }
    if (err.code === 'NOT_FOUND') return fail(res, 404, err.message);
    next(err);
  }
};