import { z } from 'zod';

export const reviewSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  rating: z.number().int().min(1).max(5, 'Rating must be between 1 and 5 stars'),
  comment: z.string().min(3, 'Review comment must be at least 3 characters'),
});

export const dealSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  description: z.string().optional(),
  dealPrice: z.number().positive('Deal price must be greater than 0'),
  active: z.boolean().default(true),
  expiresAt: z.string().optional().nullable(),
  productIds: z.array(z.string()).min(1, 'Select at least one product for the deal'),
});

export const blogSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  slug: z.string().min(2, 'Slug is required').regex(/^[a-z0-9-]+$/),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  excerpt: z.string().optional(),
  coverImage: z.string().url().optional().or(z.literal('')),
  published: z.boolean().default(true),
});

export const subscribeSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  name: z.string().optional(),
});

export const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  subject: z.string().min(3, 'Subject must be at least 3 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

export type ReviewInput = z.infer<typeof reviewSchema>;
export type DealInput = z.infer<typeof dealSchema>;
export type BlogInput = z.infer<typeof blogSchema>;
export type SubscribeInput = z.infer<typeof subscribeSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
