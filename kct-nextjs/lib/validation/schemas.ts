import { z } from 'zod'

// Common validation patterns
const emailSchema = z.string().email('Invalid email format')
const phoneSchema = z.string().regex(/^\+?[\d\s\-()]+$/, 'Invalid phone number format').optional()
const priceSchema = z.number().positive('Price must be positive')
const stockSchema = z.number().int().min(0, 'Stock cannot be negative')

// Product schemas
export const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  price: priceSchema,
  category: z.string().min(1, 'Category is required').max(50, 'Category too long'),
  image: z.string().url('Invalid image URL').optional(),
  variants: z.array(z.object({
    name: z.string().min(1, 'Variant name is required'),
    price: priceSchema,
    stock: stockSchema,
    sku: z.string().max(50, 'SKU too long').optional(),
    attributes: z.record(z.string()).optional()
  })).optional()
})

export const updateProductSchema = createProductSchema.partial()

export const productFiltersSchema = z.object({
  category: z.string().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  inStock: z.coerce.boolean().optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['name', 'price', 'createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

// Customer schemas
export const createCustomerSchema = z.object({
  email: emailSchema,
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  phone: phoneSchema,
  dateOfBirth: z.string().datetime().optional(),
  addresses: z.array(z.object({
    type: z.enum(['shipping', 'billing']),
    street: z.string().min(1, 'Street is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
    country: z.string().min(1, 'Country is required'),
    isDefault: z.boolean().default(false)
  })).optional()
})

export const updateCustomerSchema = createCustomerSchema.partial()

// Order schemas
export const createOrderSchema = z.object({
  customerId: z.string().cuid('Invalid customer ID'),
  items: z.array(z.object({
    productId: z.string().cuid('Invalid product ID'),
    variantId: z.string().cuid('Invalid variant ID'),
    quantity: z.number().int().min(1, 'Quantity must be at least 1'),
    price: priceSchema
  })).min(1, 'Order must have at least one item'),
  shippingAddress: z.object({
    street: z.string().min(1, 'Street is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
    country: z.string().min(1, 'Country is required')
  }),
  billingAddress: z.object({
    street: z.string().min(1, 'Street is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    postalCode: z.string().min(1, 'Postal code is required'),
    country: z.string().min(1, 'Country is required')
  }).optional(),
  shippingMethod: z.string().min(1, 'Shipping method is required'),
  shippingCost: z.number().min(0, 'Shipping cost cannot be negative'),
  notes: z.string().max(500, 'Notes too long').optional()
})

// Lead schemas
export const createLeadSchema = z.object({
  customerId: z.string().cuid('Invalid customer ID').optional(),
  source: z.enum(['WEBSITE', 'REFERRAL', 'SOCIAL_MEDIA', 'ADVERTISING', 'WALK_IN', 'OTHER']),
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST']).default('NEW'),
  value: z.number().positive().optional(),
  notes: z.string().max(1000, 'Notes too long').optional()
})

export const updateLeadSchema = createLeadSchema.partial()

// Appointment schemas
export const createAppointmentSchema = z.object({
  customerId: z.string().cuid('Invalid customer ID'),
  date: z.string().datetime('Invalid date format'),
  startTime: z.string().datetime('Invalid start time format').optional(),
  endTime: z.string().datetime('Invalid end time format').optional(),
  type: z.enum(['CONSULTATION', 'FITTING', 'MEASUREMENT', 'DELIVERY', 'FOLLOW_UP']),
  status: z.enum(['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).default('SCHEDULED'),
  notes: z.string().max(500, 'Notes too long').optional()
})

export const updateAppointmentSchema = createAppointmentSchema.partial()

// Auth schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required')
})

export const registerSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  role: z.enum(['ADMIN', 'STAFF', 'CUSTOMER']).default('CUSTOMER')
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Password confirmation is required')
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
})

// Query parameter schemas
export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
}).refine(data => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate)
  }
  return true
}, {
  message: 'Start date must be before end date'
})

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
})

// Validation helper function
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data)
  
  if (!result.success) {
    const error = new Error('Validation failed')
    ;(error as any).statusCode = 400
    ;(error as any).details = result.error.issues
    throw error
  }
  
  return result.data
}

// Middleware for validating request bodies
export function withValidation<T>(
  schema: z.ZodSchema<T>,
  handler: (data: T, req: any, context?: any) => Promise<any>
) {
  return async (req: any, context?: any) => {
    try {
      const body = await req.json()
      const validatedData = validateRequest(schema, body)
      return await handler(validatedData, req, context)
    } catch (error) {
      if ((error as any).statusCode === 400) {
        // Re-throw validation errors
        throw error
      }
      // Handle JSON parsing errors
      const validationError = new Error('Invalid JSON in request body')
      ;(validationError as any).statusCode = 400
      throw validationError
    }
  }
}