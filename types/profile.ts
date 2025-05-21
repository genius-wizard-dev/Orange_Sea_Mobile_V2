import { z } from 'zod';

/** Profile type definition */
export const ProfileSchema = z.object({
  id: z.string(),
  name: z.string().default(''),
  avatar: z.string().default(''),
  bio: z.string().default(''),
  phone: z.string().default(''),
  birthday: z.string().nullable().default(null),
  email: z.string().default(''),
  username: z.string().default(''),
  isSetup: z.boolean().default(false),
  accountID: z.string().default(''),
});

export type Profile = z.infer<typeof ProfileSchema>;

/** Update profile schema (all fields optional except id) */
export const UpdateProfileSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  avatar: z.string().optional(),
  bio: z.string().optional(),
  phone: z.string().optional(),
  birthday: z.string().nullable().optional(),
  email: z.string().optional(),
  username: z.string().optional(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

/** API success response schema */
export const ProfileResponseSchema = z.object({
  statusCode: z.number(),
  message: z.string(),
  data: ProfileSchema,
});

export type ProfileResponse = z.infer<typeof ProfileResponseSchema>;

/** API error response schema */
export const ErrorResponseSchema = z.object({
  status: z.number(),
  message: z.string(),
  data: z.object({
    error: z.string(),
    message: z.string(),
    statusCode: z.number(),
  }),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

/** Union schema to handle both success and error cases */
export const ApiResponseSchema = z.union([ProfileResponseSchema, ErrorResponseSchema]);

export type ApiResponse = z.infer<typeof ApiResponseSchema>;

/** Validate profile */
export const validateProfile = (profile: unknown): Profile => {
  return ProfileSchema.parse(profile);
};

/** Validate update profile input */
export const validateUpdateProfileInput = (input: unknown): UpdateProfileInput => {
  return UpdateProfileSchema.parse(input);
};

/** Validate API response (success only) */
export const validateProfileResponse = (response: unknown): ProfileResponse => {
  return ProfileResponseSchema.parse(response);
};

/** Validate API response (both success and error) */
export const validateApiResponse = (response: unknown): ApiResponse => {
  return ApiResponseSchema.parse(response);
};
