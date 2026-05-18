import { Prisma } from '@prisma/client';
import prisma from '../../config/database';
import { analyticsQueue } from '../../config/queue';
import {
  CreateArticleInput,
  UpdateArticleInput,
  ArticleQueryInput,
} from './article.schema';
import { shouldRecordRead } from '../../utils/readRateLimit';

// ─── Author: Create Article ───────────────────────────────────

export const createArticle = async (
  authorId: string,
  body: CreateArticleInput
) => {
  const article = await prisma.article.create({
    data: {
      title: body.title,
      content: body.content,
      category: body.category,
      status: body.status,
      authorId,
    },
    include: {
      author: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return article;
};

// ─── Author: Update Article ───────────────────────────────────

export const updateArticle = async (
  articleId: string,
  authorId: string,
  body: UpdateArticleInput
) => {
  // find article — global middleware already filters deletedAt: null
  const article = await prisma.article.findFirst({
    where: { id: articleId },
  });

  if (!article) {
    const err = new Error('Article not found') as any;
    err.code = 'NOT_FOUND';
    throw err;
  }

  // ownership check — spec: authors can only edit their own articles
  if (article.authorId !== authorId) {
    const err = new Error('Forbidden') as any;
    err.code = 'FORBIDDEN';
    throw err;
  }

  const updated = await prisma.article.update({
    where: { id: articleId },
    data: { ...body },
    include: {
      author: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return updated;
};

// ─── Author: Soft Delete ──────────────────────────────────────

export const softDeleteArticle = async (
  articleId: string,
  authorId: string
) => {
  // bypass global soft delete filter to find the article by id first
  const article = await prisma.article.findFirst({
    where: { id: articleId },
  });

  if (!article) {
    const err = new Error('Article not found') as any;
    err.code = 'NOT_FOUND';
    throw err;
  }

  // ownership check
  if (article.authorId !== authorId) {
    const err = new Error('Forbidden') as any;
    err.code = 'FORBIDDEN';
    throw err;
  }

  // already soft deleted
  if (article.deletedAt !== null) {
    const err = new Error('Article not found') as any;
    err.code = 'NOT_FOUND';
    throw err;
  }

  // SOFT DELETE — set deletedAt, never remove the row
  await prisma.article.update({
    where: { id: articleId },
    data: { deletedAt: new Date() },
  });

  return true;
};

// ─── Author: My Articles (Story 8) ───────────────────────────

export const getMyArticles = async (
  authorId: string,
  query: ArticleQueryInput,
  includeDeleted?: boolean
) => {
  const { page, size } = query;
  const skip = (page - 1) * size;

  // build where — bypass global middleware by being explicit
  // we use $queryRaw alternative: override deletedAt filter
  const where: Prisma.ArticleWhereInput = {
    authorId,
    // if includeDeleted is false/undefined, only show non-deleted
    // if true, show everything including soft-deleted
    ...(includeDeleted ? {} : { deletedAt: null }),
  };

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      skip,
      take: size,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    }),
    prisma.article.count({ where }),
  ]);

  // optionally mark soft-deleted articles
  const formatted = articles.map((a) => ({
    ...a,
    isDeleted: a.deletedAt !== null,
  }));

  return { articles: formatted, total };
};

// ─── Public: News Feed (Story 4) ─────────────────────────────

export const getPublishedArticles = async (query: ArticleQueryInput) => {
  const { page, size, category, author, q } = query;
  const skip = (page - 1) * size;

  // global middleware handles deletedAt: null automatically
  // we only need to add our extra filters
  const where: Prisma.ArticleWhereInput = {
    status: 'Published',

    // category: exact match
    ...(category ? { category } : {}),

    // q: keyword search in title
    ...(q ? { title: { contains: q, mode: 'insensitive' } } : {}),

    // author: partial name match on the related User
    ...(author
      ? {
          author: {
            name: { contains: author, mode: 'insensitive' },
          },
        }
      : {}),
  };

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      skip,
      take: size,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { id: true, name: true },
        },
      },
    }),
    prisma.article.count({ where }),
  ]);

  return { articles, total };
};

// ─── Public: Read Single Article (Story 5) ───────────────────

export const getArticleById = async (
  articleId: string,
  readerId: string | null  // null = guest
) => {
  // global middleware handles deletedAt: null
  // but we need to distinguish "not found" vs "deleted"
  // so we check raw first
  const raw = await prisma.$queryRaw<{ deletedAt: Date | null }[]>`
    SELECT "deletedAt" FROM "Articles" WHERE id = ${articleId}::uuid LIMIT 1
  `;

  if (raw.length === 0) {
    const err = new Error('Article not found') as any;
    err.code = 'NOT_FOUND';
    throw err;
  }

  // spec exact message: "News article no longer available"
  if (raw[0].deletedAt !== null) {
    const err = new Error('News article no longer available') as any;
    err.code = 'DELETED';
    throw err;
  }

  const article = await prisma.article.findFirst({
    where: { id: articleId, status: 'Published' },
    include: {
      author: {
        select: { id: true, name: true },
      },
    },
  });

  if (!article) {
    const err = new Error('Article not found') as any;
    err.code = 'NOT_FOUND';
    throw err;
  }
// inside setImmediate in getArticleById — replace the readLog.create block
setImmediate(async () => {
  try {
    // bonus: rate limit check before creating ReadLog
    const allowed = await shouldRecordRead(articleId, readerId);
    if (!allowed) return; // skip — too many reads in window

    await prisma.readLog.create({
      data: { articleId, readerId },
    });

    await analyticsQueue.add(
      'aggregate',
      { articleId },
      {
        jobId: `aggregate-${articleId}-${new Date().toISOString().split('T')[0]}`,
      }
    );
  } catch (err) {
    console.error('ReadLog creation failed:', err);
  }
});
  return article;
};