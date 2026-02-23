import { z } from 'zod';

export const itemSchema = z.object({
  sku: z.string().min(2),
  name: z.string().min(2),
  unit: z.string().min(1),
  minStockLevel: z.number().int().nonnegative().default(0),
  reorderMultiple: z.number().int().positive().default(1),
  leadTimeDays: z.number().int().positive().default(7)
});

export const locationSchema = z.object({
  code: z.string().min(2),
  name: z.string().min(2),
  type: z.enum(['WAREHOUSE', 'TRUCK', 'JOB_SITE'])
});

export const transactionSchema = z
  .object({
    type: z.enum(['RECEIVE', 'TRANSFER', 'ISSUE', 'RETURN', 'ADJUST']),
    itemId: z.string().min(1),
    fromLocationId: z.string().optional(),
    toLocationId: z.string().optional(),
    quantity: z.number().int().positive(),
    createdById: z.string().min(1),
    notes: z.string().max(500).optional(),
    jobId: z.string().optional()
  })
  .superRefine((data, ctx) => {
    if (data.type === 'TRANSFER' && (!data.fromLocationId || !data.toLocationId)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'TRANSFER requires both locations' });
    }
    if (data.type === 'RECEIVE' && !data.toLocationId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'RECEIVE requires destination location' });
    }
    if ((data.type === 'ISSUE' || data.type === 'RETURN') && !data.fromLocationId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: `${data.type} requires source location` });
    }
  });
