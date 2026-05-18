import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

const basePrisma = new PrismaClient({ adapter });

const prisma = basePrisma.$extends({
  query: {
    article: {
      async findMany({ args, query }) {
        args.where = {
          deletedAt: null,
          ...args.where,
        };
        return query(args);
      },
      async findFirst({ args, query }) {
        args.where = {
          deletedAt: null,
          ...args.where,
        };
        return query(args);
      },
      async findUnique({ args, query }) {
        const { where, ...rest } = args;
        return basePrisma.article.findFirst({
          ...rest,
          where: {
            deletedAt: null,
            ...where,
          },
        });
      },
    },
  },
});

export default prisma;
