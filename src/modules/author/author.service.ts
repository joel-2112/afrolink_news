import prisma from '../../config/database';
import { ArticleQueryInput } from '../articles/article.schema';

export const getAuthorDashboard = async (
  authorId: string,
  query: ArticleQueryInput
) => {
  const { page, size } = query;
  const skip = (page - 1) * size;

  
  const total = await prisma.article.count({
    where: {
      authorId,
      deletedAt: null,  
    },
  });

  
  
  const articles = await prisma.$queryRaw<{
    id: string;
    title: string;
    category: string;
    status: string;
    createdAt: Date;
    totalViews: bigint;
  }[]>`
    SELECT
      a."id",
      a."title",
      a."category",
      a."status",
      a."createdAt",
      COALESCE(SUM(da."viewCount"), 0)::bigint AS "totalViews"
    FROM "Articles" a
    LEFT JOIN "DailyAnalytics" da ON da."articleId" = a."id"
    WHERE
      a."authorId"  = ${authorId}::uuid
      AND a."deletedAt" IS NULL
    GROUP BY
      a."id", a."title", a."category", a."status", a."createdAt"
    ORDER BY a."createdAt" DESC
    LIMIT  ${size}
    OFFSET ${skip}
  `;

  // bigint → number for JSON serialization
  const formatted = articles.map((a) => ({
    ...a,
    totalViews: Number(a.totalViews),
  }));

  return { articles: formatted, total };
};