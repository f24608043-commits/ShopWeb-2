import { z } from 'zod';

export const cartItemInputSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  variationId: z.string().nullable().optional(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

export const cartVerifySchema = z.object({
  items: z.array(cartItemInputSchema).min(1, 'Cart cannot be empty'),
});

export const couponValidateSchema = z.object({
  code: z.string().min(1, 'Coupon code is required'),
  items: z.array(cartItemInputSchema).min(1, 'Cart cannot be empty'),
});

export const couponSchema = z.object({
  code: z.string().min(2, 'Code must be at least 2 characters').toUpperCase(),
  discountType: z.enum(['PERCENTAGE', 'FIXED']),
  discountValue: z.number().positive('Discount value must be greater than 0'),
  minOrderValue: z.number().min(0).optional().default(0),
  usageLimit: z.number().int().positive().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
  active: z.boolean().default(true),
});

export type CartVerifyInput = z.infer<typeof cartVerifySchema>;
export type CouponValidateInput = z.infer<typeof couponValidateSchema>;
export type CouponInput = z.infer<typeof couponSchema>;
