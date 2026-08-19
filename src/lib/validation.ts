import { z } from 'zod';

// Query validation for GET /api/auctions
export const getAuctionsQuerySchema = z.object({
  search: z.string().optional().nullable(),
  category: z.string().default('all'),
  status: z.enum(['live', 'ended', 'upcoming', 'all']).default('live'),
  sortBy: z
    .enum(['endingSoon', 'priceLow', 'priceHigh', 'mostBids', 'newest'])
    .default('endingSoon'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export type GetAuctionsQuery = z.infer<typeof getAuctionsQuerySchema>;

// Auction Creation Schema
export const createAuctionSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters long')
    .max(100, 'Title cannot exceed 100 characters'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters long')
    .max(2000, 'Description cannot exceed 2000 characters'),
  category: z.string().min(1, 'Category is required'),
  startingBid: z
    .number({ message: 'Starting bid must be a number' })
    .positive('Starting bid must be greater than 0'),
  minIncrement: z
    .number({ message: 'Minimum increment must be a number' })
    .positive('Minimum increment must be greater than 0')
    .default(1),
  images: z
    .array(z.string().url('Each image must be a valid URL'))
    .min(1, 'At least one image URL is required'),
  endTime: z
    .string()
    .or(z.date())
    .refine((val) => new Date(val) > new Date(), {
      message: 'End time must be in the future',
    }),
});

// Bid Placement Schema
export const placeBidSchema = z.object({
  auctionId: z.string().uuid('Invalid auction ID format').or(z.string().min(1)),
  amount: z
    .number({ message: 'Bid amount must be a number' })
    .positive('Bid amount must be greater than 0'),
});

// User Registration Schema
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters long'),
});
// Login Schema
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters long'),
});

export type LoginFormData = z.infer<typeof loginSchema>;