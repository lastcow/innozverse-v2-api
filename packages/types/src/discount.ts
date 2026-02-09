import { z } from 'zod';

export const EventDiscountSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  percentage: z.number().min(0).max(100),
  startDate: z.date(),
  endDate: z.date(),
  active: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type EventDiscount = z.infer<typeof EventDiscountSchema>;

export const CreateEventDiscountRequestSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  percentage: z.number().min(0).max(100),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  active: z.boolean().default(true),
}).refine((data) => data.endDate > data.startDate, {
  message: 'End date must be after start date',
  path: ['endDate'],
});
export type CreateEventDiscountRequest = z.infer<typeof CreateEventDiscountRequestSchema>;

export const UpdateEventDiscountRequestSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional().nullable(),
  percentage: z.number().min(0).max(100).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  active: z.boolean().optional(),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return data.endDate > data.startDate;
  }
  return true;
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
});
export type UpdateEventDiscountRequest = z.infer<typeof UpdateEventDiscountRequestSchema>;

export const EventDiscountListQuerySchema = z.object({
  active: z.boolean().optional(),
  search: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().min(1).max(100).default(20),
});
export type EventDiscountListQuery = z.infer<typeof EventDiscountListQuerySchema>;
