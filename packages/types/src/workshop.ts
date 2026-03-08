import { z } from 'zod';

export const WorkshopSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  imageUrls: z.array(z.string()),
  startDate: z.date(),
  endDate: z.date(),
  capacity: z.number().int().min(0),
  isPublished: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type Workshop = z.infer<typeof WorkshopSchema>;

export const CreateWorkshopRequestSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(10000),
  imageUrls: z.array(z.string()).default([]),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  capacity: z.number().int().min(0).default(0),
  isPublished: z.boolean().default(false),
  products: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().min(1),
  })).default([]),
}).refine((data) => data.endDate > data.startDate, {
  message: 'End date must be after start date',
  path: ['endDate'],
});
export type CreateWorkshopRequest = z.infer<typeof CreateWorkshopRequestSchema>;

export const UpdateWorkshopRequestSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(10000).optional(),
  imageUrls: z.array(z.string()).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  capacity: z.number().int().min(0).optional(),
  isPublished: z.boolean().optional(),
  products: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().min(1),
  })).optional(),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return data.endDate > data.startDate;
  }
  return true;
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
});
export type UpdateWorkshopRequest = z.infer<typeof UpdateWorkshopRequestSchema>;

export const WorkshopRegistrationRequestSchema = z.object({
  seats: z.number().int().min(1).default(1),
});
export type WorkshopRegistrationRequest = z.infer<typeof WorkshopRegistrationRequestSchema>;
