import { z } from 'zod';

export const categorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
  heroBannerImageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  parentCategoryId: z.string().nullable().optional(),
});

export const brandSchema = z.object({
  name: z.string().min(2, 'Brand name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  logoUrl: z.string().url().optional().nullable(),
});

export type CategoryInput = z.infer<typeof categorySchema>;
export type BrandInput = z.infer<typeof brandSchema>;
