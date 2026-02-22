import { TxnType } from "@prisma/client";
import { z } from "zod";

export const ledgerInputSchema = z.object({
  txnType: z.nativeEnum(TxnType),
  itemId: z.string().min(1),
  fromLocationId: z.string().optional(),
  toLocationId: z.string().optional(),
  qty: z.number().positive(),
  unitCost: z.number().nonnegative().optional(),
  jobId: z.string().optional(),
  note: z.string().max(200).optional()
});

export const createJobSchema = z.object({
  code: z.string().min(3),
  name: z.string().min(3),
  type: z.string().min(2),
  siteLocationId: z.string().min(1),
  templateId: z.string().min(1)
});
