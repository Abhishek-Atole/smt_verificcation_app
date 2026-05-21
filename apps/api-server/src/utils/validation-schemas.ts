import { z } from 'zod';

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// User schemas
export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['admin', 'supervisor', 'qa', 'operator']),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export const updateUserSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  role: z.enum(['admin', 'supervisor', 'qa', 'operator']).optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

// BOM schemas
export const createBOMSchema = z.object({
  partNumber: z.string().min(1, 'Part number is required'),
  revision: z.string().min(1, 'Revision is required'),
  description: z.string().optional(),
});

export const updateBOMSchema = z.object({
  partNumber: z.string().min(1).optional(),
  revision: z.string().min(1).optional(),
  description: z.string().optional(),
});

// Scan schemas
export const createScanSchema = z.object({
  bomId: z.string().min(1, 'BOM ID is required'),
  scanParameters: z.object({
    timeout: z.number().positive().optional(),
    retryCount: z.number().positive().optional(),
  }).optional(),
});

// Validation helper
export function validateRequest(schema: z.ZodSchema, data: any) {
  try {
    return { success: true, data: schema.parse(data) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      };
    }
    return { success: false, errors: [{ path: '', message: 'Validation failed' }] };
  }
}
