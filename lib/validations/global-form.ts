import { z } from 'zod';

export const optionValueSchema = z.object({
  value: z.string().min(1, 'Value is required'),
  priceAdjustment: z.number().default(0),
});

export const optionSchema = z.object({
  name: z.string().min(1, 'Option name is required (e.g. Size, Color)'),
  inputType: z.enum(['DROPDOWN', 'RADIO', 'CHECKBOX', 'COLOR_PICKER', 'BUTTON_GROUP']).default('DROPDOWN'),
  values: z.array(optionValueSchema).min(1, 'At least one option value is required'),
});

export const globalFormSchema = z.object({
  name: z.string().min(2, 'Form name must be at least 2 characters'),
  description: z.string().optional(),
  active: z.boolean().default(true),
  options: z.array(optionSchema).min(1, 'At least one option group is required'),
});

export const updateVariationSchema = z.object({
  sku: z.string().optional(),
  price: z.number().min(0, 'Price must be greater than or equal to 0'),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
});

export type GlobalFormInput = z.infer<typeof globalFormSchema>;
export type UpdateVariationInput = z.infer<typeof updateVariationSchema>;
