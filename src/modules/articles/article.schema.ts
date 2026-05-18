import { z } from 'zod';

export const createArticleSchema = z.object({
  title: z
    .string({ message: 'Title is required' })
    .min(1, 'Title cannot be empty')
    .max(150, 'Title cannot exceed 150 characters'),

  content: z
    .string({ message: 'Content is required' })
    .min(50, 'Content must be at least 50 characters'),

  category: z
    .string({ message: 'Category is required' })
    .min(1, 'Category cannot be empty'),

  status: z
    .enum(['Draft', 'Published'], {
      message: 'Status must be Draft or Published',
    })
    .optional()
    .default('Draft'),
});

export const updateArticleSchema = z.object({
  title: z
    .string()
    .min(1, 'Title cannot be empty')
    .max(150, 'Title cannot exceed 150 characters')
    .optional(),

  content: z
    .string()
    .min(50, 'Content must be at least 50 characters')
    .optional(),

  category: z
    .string()
    .min(1, 'Category cannot be empty')
    .optional(),

  status: z
    .enum(['Draft', 'Published'], {
      message: 'Status must be Draft or Published',
    })
    .optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);

export const articleQuerySchema = z.object({
  category: z.string().optional(),
  author: z.string().optional(),    // partial name match
  q: z.string().optional(),         // keyword in title
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(100).default(10),
});

export type CreateArticleInput = z.infer<typeof createArticleSchema>;
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;
export type ArticleQueryInput = z.infer<typeof articleQuerySchema>;