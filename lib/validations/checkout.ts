import { z } from 'zod';
import { cartItemInputSchema } from '@/lib/validations/coupon-cart';

export const checkoutSchema = z.object({
  customerName: z.string().min(2, 'Full name must be at least 2 characters'),
  customerEmail: z.string().email('Please enter a valid email address'),
  phone: z.string().min(7, 'Phone number must be at least 7 digits'),
  address: z.string().min(5, 'Delivery address is required'),
  city: z.string().min(2, 'City is required'),
  province: z.string().min(2, 'Province/State is required'),
  postalCode: z.string().min(3, 'Postal code is required'),
  couponCode: z.string().optional().nullable(),
  items: z.array(cartItemInputSchema).min(1, 'Checkout cart cannot be empty'),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
