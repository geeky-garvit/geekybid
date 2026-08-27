// src/lib/validation.ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string({ message: 'Email is required' })
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .transform((val) => val.toLowerCase().trim()),
  password: z
    .string({ message: 'Password is required' })
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters long'),
});

export type LoginFormData = z.infer<typeof loginSchema>;