import { Request, Response, NextFunction } from 'express';
import { getAuthorDashboard } from './author.service';
import { articleQuerySchema } from '../articles/article.schema';
import { paginated, fail } from '../../utils/response';

export const dashboard = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsed = articleQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return fail(
        res,
        400,
        'Invalid query',
        parsed.error.issues.map((e) => e.message)
      );
    }

    const { articles, total } = await getAuthorDashboard(
      req.user!.sub,
      parsed.data
    );

    return paginated(
      res,
      'Dashboard retrieved successfully',
      articles,
      parsed.data.page,
      parsed.data.size,
      total
    );
  } catch (err) {
    next(err);
  }
};