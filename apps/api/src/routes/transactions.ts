import { FastifyPluginAsync } from 'fastify'
import { getSupabaseWithAuth, getSupabaseAdmin } from '../utils/supabase'
import { 
  validateAndTransform, 
  CreateTransactionSchema, 
  UpdateTransactionSchema,
  GetTransactionsQuerySchema,
  UUIDSchema,
  TransactionEntitySchema,
  PaginatedResponseSchema
} from '../utils/validation'

const transactionRoutes: FastifyPluginAsync = async (fastify) => {
  
  // GET /api/transactions - Get user transactions with filtering and pagination
  fastify.get('/', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const userId = (request.user as any).sub
      const query = validateAndTransform(GetTransactionsQuerySchema, request.query)
      
      // Get admin Supabase client
      const supabaseAdmin = getSupabaseAdmin()

      // Build query
      let dbQuery = supabaseAdmin
        .from('transactions')
        .select(`
          *,
          account:accounts(id, name, type, currency, icon, color),
          category:categories(id, name, type, icon, color)
        `, { count: 'exact' })
        .eq('user_id', userId)

      // Apply filters
      if (query.account_id) {
        dbQuery = dbQuery.eq('account_id', query.account_id)
      }
      if (query.category_id) {
        dbQuery = dbQuery.eq('category_id', query.category_id)
      }
      if (query.type) {
        dbQuery = dbQuery.eq('type', query.type)
      }
      if (query.date_from) {
        dbQuery = dbQuery.gte('date', query.date_from)
      }
      if (query.date_to) {
        dbQuery = dbQuery.lte('date', query.date_to)
      }
      if (query.min_amount) {
        dbQuery = dbQuery.gte('amount', query.min_amount)
      }
      if (query.max_amount) {
        dbQuery = dbQuery.lte('amount', query.max_amount)
      }
      if (query.search) {
        dbQuery = dbQuery.ilike('description', `%${query.search}%`)
      }

      // Apply pagination
      const from = (query.page - 1) * query.limit
      const to = from + query.limit - 1

      dbQuery = dbQuery
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .range(from, to)

      const { data: transactions, error, count } = await dbQuery

      if (error) {
        fastify.log.error('Error fetching transactions:', error)
        fastify.log.error('Error details:', JSON.stringify(error, null, 2))
        return reply.code(500).send({
          error: 'Database Error',
          message: 'Failed to fetch transactions'
        })
      }

      const total = count || 0
      const pages = Math.ceil(total / query.limit)

      return reply.send({
        data: transactions,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          pages,
          has_more: query.page < pages
        }
      })

    } catch (error) {
      fastify.log.error('Get transactions error:', error)
      
      if ((error as any).validation) {
        return reply.code(400).send({
          error: 'Validation Error',
          message: 'Invalid query parameters',
          details: (error as any).validation
        })
      }

      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to get transactions'
      })
    }
  })

  // POST /api/transactions - Create new transaction
  fastify.post('/', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const userId = (request.user as any).sub
      const transactionData = validateAndTransform(CreateTransactionSchema, request.body)
      
      const userSupabase = getSupabaseWithAuth((request.user as any).token || '')

      // Verify account belongs to user
      const { data: account, error: accountError } = await userSupabase
        .from('accounts')
        .select('id, balance, is_active')
        .eq('id', transactionData.account_id)
        .eq('user_id', userId)
        .single()

      if (accountError || !account) {
        return reply.code(404).send({
          error: 'Account Not Found',
          message: 'Account not found or does not belong to user'
        })
      }

      if (!account.is_active) {
        return reply.code(400).send({
          error: 'Account Inactive',
          message: 'Cannot create transaction for inactive account'
        })
      }

      // For expenses, check if account has sufficient balance
      if (transactionData.type === 'expense' && account.balance < transactionData.amount) {
        return reply.code(400).send({
          error: 'Insufficient Balance',
          message: 'Account does not have sufficient balance for this transaction'
        })
      }

      // Verify category exists and is accessible to user
      const { data: category, error: categoryError } = await userSupabase
        .from('categories')
        .select('id, type, is_active')
        .eq('id', transactionData.category_id)
        .or(`user_id.eq.${userId},is_default.eq.true`)
        .single()

      if (categoryError || !category) {
        return reply.code(404).send({
          error: 'Category Not Found',
          message: 'Category not found or not accessible'
        })
      }

      if (!category.is_active) {
        return reply.code(400).send({
          error: 'Category Inactive',
          message: 'Cannot use inactive category'
        })
      }

      if (category.type !== transactionData.type) {
        return reply.code(400).send({
          error: 'Category Type Mismatch',
          message: `Category type (${category.type}) does not match transaction type (${transactionData.type})`
        })
      }

      // Create transaction
      const { data: transaction, error: createError } = await userSupabase
        .from('transactions')
        .insert([{
          user_id: userId,
          ...transactionData,
          date: transactionData.date || new Date().toISOString()
        }])
        .select(`
          *,
          account:accounts(id, name, type, currency, icon, color),
          category:categories(id, name, type, icon, color)
        `)
        .single()

      if (createError || !transaction) {
        fastify.log.error('Error creating transaction:', createError)
        return reply.code(500).send({
          error: 'Database Error',
          message: 'Failed to create transaction'
        })
      }

      return reply.code(201).send({
        success: true,
        data: transaction
      })

    } catch (error) {
      fastify.log.error('Create transaction error:', error)
      
      if ((error as any).validation) {
        return reply.code(400).send({
          error: 'Validation Error',
          message: 'Invalid transaction data',
          details: (error as any).validation
        })
      }

      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to create transaction'
      })
    }
  })

  // GET /api/transactions/:id - Get specific transaction
  fastify.get('/:id', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const userId = (request.user as any).sub
      const transactionId = validateAndTransform(UUIDSchema, (request.params as any).id)
      
      const userSupabase = getSupabaseWithAuth((request.user as any).token || '')

      const { data: transaction, error } = await userSupabase
        .from('transactions')
        .select(`
          *,
          account:accounts(id, name, type, currency, icon, color),
          category:categories(id, name, type, icon, color)
        `)
        .eq('id', transactionId)
        .eq('user_id', userId)
        .single()

      if (error || !transaction) {
        return reply.code(404).send({
          error: 'Transaction Not Found',
          message: 'Transaction not found or does not belong to user'
        })
      }

      return reply.send({
        success: true,
        data: transaction
      })

    } catch (error) {
      fastify.log.error('Get transaction error:', error)
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to get transaction'
      })
    }
  })

  // PUT /api/transactions/:id - Update transaction
  fastify.put('/:id', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const userId = (request.user as any).sub
      const transactionId = validateAndTransform(UUIDSchema, (request.params as any).id)
      const updateData = validateAndTransform(UpdateTransactionSchema, request.body)
      
      if (Object.keys(updateData).length === 0) {
        return reply.code(400).send({
          error: 'No Data',
          message: 'No update data provided'
        })
      }

      const userSupabase = getSupabaseWithAuth((request.user as any).token || '')

      // Check if transaction exists and belongs to user
      const { data: existingTransaction, error: findError } = await userSupabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .eq('user_id', userId)
        .single()

      if (findError || !existingTransaction) {
        return reply.code(404).send({
          error: 'Transaction Not Found',
          message: 'Transaction not found or does not belong to user'
        })
      }

      // Validate account if being updated
      if (updateData.account_id) {
        const { data: account, error: accountError } = await userSupabase
          .from('accounts')
          .select('id, is_active')
          .eq('id', updateData.account_id)
          .eq('user_id', userId)
          .single()

        if (accountError || !account || !account.is_active) {
          return reply.code(400).send({
            error: 'Invalid Account',
            message: 'Account not found, does not belong to user, or is inactive'
          })
        }
      }

      // Validate category if being updated
      if (updateData.category_id) {
        const { data: category, error: categoryError } = await userSupabase
          .from('categories')
          .select('id, type, is_active')
          .eq('id', updateData.category_id)
          .or(`user_id.eq.${userId},is_default.eq.true`)
          .single()

        if (categoryError || !category || !category.is_active) {
          return reply.code(400).send({
            error: 'Invalid Category',
            message: 'Category not found, not accessible, or is inactive'
          })
        }

        const transactionType = updateData.type || existingTransaction.type
        if (category.type !== transactionType) {
          return reply.code(400).send({
            error: 'Category Type Mismatch',
            message: `Category type (${category.type}) does not match transaction type (${transactionType})`
          })
        }
      }

      // Update transaction
      const { data: transaction, error: updateError } = await userSupabase
        .from('transactions')
        .update(updateData)
        .eq('id', transactionId)
        .eq('user_id', userId)
        .select(`
          *,
          account:accounts(id, name, type, currency, icon, color),
          category:categories(id, name, type, icon, color)
        `)
        .single()

      if (updateError || !transaction) {
        fastify.log.error('Error updating transaction:', updateError)
        return reply.code(500).send({
          error: 'Database Error',
          message: 'Failed to update transaction'
        })
      }

      return reply.send({
        success: true,
        data: transaction
      })

    } catch (error) {
      fastify.log.error('Update transaction error:', error)
      
      if ((error as any).validation) {
        return reply.code(400).send({
          error: 'Validation Error',
          message: 'Invalid update data',
          details: (error as any).validation
        })
      }

      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to update transaction'
      })
    }
  })

  // DELETE /api/transactions/:id - Delete transaction (soft delete)
  fastify.delete('/:id', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const userId = (request.user as any).sub
      const transactionId = validateAndTransform(UUIDSchema, (request.params as any).id)
      
      const userSupabase = getSupabaseWithAuth((request.user as any).token || '')

      // Check if transaction exists
      const { data: transaction, error: findError } = await userSupabase
        .from('transactions')
        .select('id')
        .eq('id', transactionId)
        .eq('user_id', userId)
        .single()

      if (findError || !transaction) {
        return reply.code(404).send({
          error: 'Transaction Not Found',
          message: 'Transaction not found or does not belong to user'
        })
      }

      // Delete transaction (this will trigger the balance update automatically)
      const { error: deleteError } = await userSupabase
        .from('transactions')
        .delete()
        .eq('id', transactionId)
        .eq('user_id', userId)

      if (deleteError) {
        fastify.log.error('Error deleting transaction:', deleteError)
        return reply.code(500).send({
          error: 'Database Error',
          message: 'Failed to delete transaction'
        })
      }

      return reply.send({
        success: true,
        message: 'Transaction deleted successfully'
      })

    } catch (error) {
      fastify.log.error('Delete transaction error:', error)
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to delete transaction'
      })
    }
  })
}

export default transactionRoutes