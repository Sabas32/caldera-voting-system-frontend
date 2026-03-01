import { z } from "zod";

export const systemLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const orgLoginSchema = systemLoginSchema;

export const organizationSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export const tokenBatchSchema = z.object({
  label: z.string().min(2),
  quantity: z.number().min(1).max(10000),
});
