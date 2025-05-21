import { z } from "zod";

// Login Request Schema
export const LoginRequestSchema = z.object({
  username: z.string().min(5).max(50),
  password: z.string().min(5).max(50),
});

// Login Response Schema
export const LoginResponseSchema = z.object({
  statusCode: z.number(),
  message: z.string(),
  data: z
    .object({
      access_token: z.string(),
      refresh_token: z.string(),
      account: z.object({
        id: z.string(),
        email: z.string(),
        username: z.string(),
        role: z.string(),
      }),
      error: z.string(),
      profile: z.object({
        id: z.string(),
        name: z.string(),
        avatar: z.string(),
      }),
    })
    .optional(),
});

// Types
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
