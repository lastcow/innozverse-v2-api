import { z } from 'zod';

export const ProductTypeSchema = z.enum(['SURFACE', 'LAPTOP', 'XBOX']);
export type ProductType = z.infer<typeof ProductTypeSchema>;

export const ProductPropertiesSchema = z.record(z.unknown());
export type ProductProperties = z.infer<typeof ProductPropertiesSchema>;

export const ProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  type: ProductTypeSchema,
  basePrice: z.number().positive(),
  stock: z.number().int().min(0),
  active: z.boolean(),
  properties: ProductPropertiesSchema,
  imageUrls: z.array(z.string().url()),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Product = z.infer<typeof ProductSchema>;

export const CreateProductRequestSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  type: ProductTypeSchema,
  basePrice: z.number().positive(),
  stock: z.number().int().min(0),
  properties: ProductPropertiesSchema,
  imageUrls: z.array(z.string().url()),
});
export type CreateProductRequest = z.infer<typeof CreateProductRequestSchema>;

export const UpdateProductRequestSchema = CreateProductRequestSchema.partial();
export type UpdateProductRequest = z.infer<typeof UpdateProductRequestSchema>;

export const ProductListQuerySchema = z.object({
  type: ProductTypeSchema.optional(),
  search: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().min(1).max(100).default(20),
});
export type ProductListQuery = z.infer<typeof ProductListQuerySchema>;
