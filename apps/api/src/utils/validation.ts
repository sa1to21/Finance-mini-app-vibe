import { z } from 'zod'

// Common validation schemas
export const UUIDSchema = z.string().uuid('Invalid UUID format')
export const PaginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20)
})

// User schemas
export const TelegramUserSchema = z.object({
  id: z.number().int().positive(),
  first_name: z.string().min(1).max(100),
  last_name: z.string().max(100).optional(),
  username: z.string().max(100).optional(),
  language_code: z.string().max(10).optional()
})

// Auth schemas
export const TelegramAuthSchema = z.object({
  initData: z.string().min(1, 'initData is required')
})

export const JWTPayloadSchema = z.object({
  sub: UUIDSchema,
  telegram_id: z.number().int().positive(),
  iat: z.number(),
  exp: z.number()
})

// Account schemas
export const AccountTypeSchema = z.enum(['cash', 'card', 'bank', 'crypto', 'investment'])
export const CurrencySchema = z.enum(['RUB', 'USD', 'EUR', 'BTC', 'ETH'])

export const CreateAccountSchema = z.object({
  name: z.string().min(1, 'Account name is required').max(50, 'Account name too long'),
  type: AccountTypeSchema.default('cash'),
  currency: CurrencySchema.default('RUB'),
  balance: z.number().min(0, 'Balance cannot be negative').default(0),
  icon: z.string().max(10).default('💳'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').default('#3b82f6')
})

export const UpdateAccountSchema = CreateAccountSchema.partial().extend({
  is_active: z.boolean().optional()
})

export const GetAccountsQuerySchema = z.object({
  is_active: z.coerce.boolean().optional(),
  type: AccountTypeSchema.optional(),
  currency: CurrencySchema.optional()
}).merge(PaginationSchema)

// Category schemas
export const TransactionTypeSchema = z.enum(['income', 'expense'])

export const CreateCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(50, 'Category name too long'),
  type: TransactionTypeSchema,
  icon: z.string().max(10).default('📋'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').default('#6b7280')
})

export const UpdateCategorySchema = CreateCategorySchema.partial().extend({
  is_active: z.boolean().optional()
})

export const GetCategoriesQuerySchema = z.object({
  type: TransactionTypeSchema.optional(),
  is_active: z.coerce.boolean().optional(),
  include_default: z.coerce.boolean().default(true)
}).merge(PaginationSchema)

// Transaction schemas
export const CreateTransactionSchema = z.object({
  account_id: UUIDSchema,
  category_id: UUIDSchema,
  amount: z.number().positive('Amount must be positive'),
  type: TransactionTypeSchema,
  description: z.string().max(500, 'Description too long').optional(),
  date: z.string().datetime().optional()
})

export const UpdateTransactionSchema = CreateTransactionSchema.partial()

export const GetTransactionsQuerySchema = z.object({
  account_id: UUIDSchema.optional(),
  category_id: UUIDSchema.optional(),
  type: TransactionTypeSchema.optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  min_amount: z.coerce.number().min(0).optional(),
  max_amount: z.coerce.number().min(0).optional(),
  search: z.string().max(100).optional()
}).merge(PaginationSchema)

// Transfer schemas
export const CreateTransferSchema = z.object({
  from_account_id: UUIDSchema,
  to_account_id: UUIDSchema,
  amount: z.number().positive('Amount must be positive'),
  description: z.string().max(500, 'Description too long').optional(),
  date: z.string().datetime().optional()
}).refine(
  (data) => data.from_account_id !== data.to_account_id,
  {
    message: 'Source and destination accounts must be different',
    path: ['to_account_id']
  }
)

// Analytics schemas
export const AnalyticsPeriodSchema = z.enum(['week', 'month', 'quarter', 'year'])

export const GetAnalyticsQuerySchema = z.object({
  period: AnalyticsPeriodSchema.default('month'),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  account_id: UUIDSchema.optional(),
  currency: CurrencySchema.optional()
})

export const GetSpendingByCategorySchema = z.object({
  type: TransactionTypeSchema.default('expense'),
  period: AnalyticsPeriodSchema.default('month'),
  limit: z.coerce.number().min(1).max(50).default(10)
}).merge(GetAnalyticsQuerySchema.pick({ date_from: true, date_to: true }))

// Response schemas
export const SuccessResponseSchema = z.object({
  success: z.literal(true),
  data: z.any()
})

export const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  details: z.any().optional()
})

export const PaginatedResponseSchema = z.object({
  data: z.array(z.any()),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    pages: z.number(),
    has_more: z.boolean()
  })
})

// Database entity schemas (for response validation)
export const UserEntitySchema = z.object({
  id: UUIDSchema,
  telegram_id: z.number(),
  username: z.string().nullable().optional(),
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
  language_code: z.string().nullable().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
})

export const AccountEntitySchema = z.object({
  id: UUIDSchema,
  user_id: UUIDSchema,
  name: z.string(),
  balance: z.number(),
  currency: CurrencySchema,
  type: AccountTypeSchema,
  icon: z.string(),
  color: z.string(),
  is_active: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
})

export const CategoryEntitySchema = z.object({
  id: UUIDSchema,
  user_id: UUIDSchema.nullable(),
  name: z.string(),
  type: TransactionTypeSchema,
  icon: z.string(),
  color: z.string(),
  is_default: z.boolean(),
  is_active: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
})

export const TransactionEntitySchema = z.object({
  id: UUIDSchema,
  user_id: UUIDSchema,
  account_id: UUIDSchema,
  category_id: UUIDSchema,
  amount: z.number(),
  type: TransactionTypeSchema,
  description: z.string().nullable(),
  date: z.string().datetime(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
})

export const TransferEntitySchema = z.object({
  id: UUIDSchema,
  user_id: UUIDSchema,
  from_account_id: UUIDSchema,
  to_account_id: UUIDSchema,
  amount: z.number(),
  description: z.string().nullable(),
  date: z.string().datetime(),
  created_at: z.string().datetime()
})

// Utility function to validate and transform data
export function validateAndTransform<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data)
  
  if (!result.success) {
    const error = new Error('Validation failed')
    ;(error as any).validation = result.error.format()
    ;(error as any).statusCode = 400
    throw error
  }
  
  return result.data
}

// Types for TypeScript inference
export type TelegramUser = z.infer<typeof TelegramUserSchema>
export type CreateAccount = z.infer<typeof CreateAccountSchema>
export type UpdateAccount = z.infer<typeof UpdateAccountSchema>
export type CreateCategory = z.infer<typeof CreateCategorySchema>
export type UpdateCategory = z.infer<typeof UpdateCategorySchema>
export type CreateTransaction = z.infer<typeof CreateTransactionSchema>
export type UpdateTransaction = z.infer<typeof UpdateTransactionSchema>
export type CreateTransfer = z.infer<typeof CreateTransferSchema>
export type GetTransactionsQuery = z.infer<typeof GetTransactionsQuerySchema>
export type GetAccountsQuery = z.infer<typeof GetAccountsQuerySchema>
export type GetCategoriesQuery = z.infer<typeof GetCategoriesQuerySchema>
export type AnalyticsQuery = z.infer<typeof GetAnalyticsQuerySchema>
export type UserEntity = z.infer<typeof UserEntitySchema>
export type AccountEntity = z.infer<typeof AccountEntitySchema>
export type CategoryEntity = z.infer<typeof CategoryEntitySchema>
export type TransactionEntity = z.infer<typeof TransactionEntitySchema>
export type TransferEntity = z.infer<typeof TransferEntitySchema>