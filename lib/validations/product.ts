import { z } from 'zod';

export const productImageSchema = z.object({
  url: z.string().url('Image must be a valid URL'),
  altText: z.string().optional(),
  order: z.number().default(0),
});

export const productSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  basePrice: z.number().min(0, 'Base price cannot be negative'),
  originalPrice: z.number().optional().nullable(),
  brandId: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  featured: z.boolean().default(false),
  stock: z.number().int().min(0).optional().nullable(),
  productType: z.enum(['SIMPLE', 'VARIABLE']).default('SIMPLE'),
  globalFormId: z.string().optional().nullable(),
  images: z.array(productImageSchema).optional().default([]),
});

export type ProductInput = z.infer<typeof productSchema>;
