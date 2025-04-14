import { z } from 'zod';

export const stateStatusSchema = z.enum(['idle', 'loading', 'succeeded', 'failed']);

export const baseStateSchema = z.object({
  status: stateStatusSchema,
  error: z.string().nullable(),
});

export const asyncStateSchema = <T extends z.ZodType>(dataSchema: T) =>
  baseStateSchema.extend({
    data: dataSchema.nullable(),
  });

export type StateStatus = z.infer<typeof stateStatusSchema>;
export type BaseState = z.infer<typeof baseStateSchema>;
export type AsyncState<T> = {
  status: StateStatus;
  error: string | null;
  data: T | null;
};
