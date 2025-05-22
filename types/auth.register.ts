import { z } from "zod";

export const RegisterRequestSchema = z.object({
  username: z.string().min(5).max(50),
  email: z.string().email().min(5).max(50),
  password: z.string().min(5).max(50),
});

export const RegisterResponseSchema = z.object({
  status: z.string(),
  message: z.string(),
  data: z.object({
    email: z.string().email(),
    isPending: z.boolean(),
    key: z.string().optional(),
  }),
  statusCode: z.number(),
});

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type RegisterRespone = z.infer<typeof RegisterResponseSchema>;
