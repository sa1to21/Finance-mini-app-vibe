import { FastifyPluginAsync } from 'fastify'
import { getSupabaseWithAuth, getSupabaseAdmin } from '../utils/supabase'
import { 
  validateAndTransform, 
  CreateAccountSchema, 
  UpdateAccountSchema,
  GetAccountsQuerySchema,
  UUIDSchema,
  AccountEntitySchema
} from '../utils/validation'

const accountRoutes: FastifyPluginAsync = async (fastify) => {
  
  // GET /api/accounts - Get user accounts with filtering
  fastify.get('/', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const userId = (request.user as any).sub
      const query = validateAndTransform(GetAccountsQuerySchema, request.query)
      
      const supabaseAdmin = getSupabaseAdmin()

      // Build query
      let dbQuery = supabaseAdmin
        .from('accounts')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)

      // Apply filters
      if (query.is_active !== undefined) {
        dbQuery = dbQuery.eq('is_active', query.is_active)
      }
      if (query.type) {
        dbQuery = dbQuery.eq('type', query.type)
      }
      if (query.currency) {
        dbQuery = dbQuery.eq('currency', query.currency)
      }

      // Apply pagination
      const from = (query.page - 1) * query.limit
      const to = from + query.limit - 1

      dbQuery = dbQuery
        .order('created_at', { ascending: false })
        .range(from, to)

      const { data: accounts, error, count } = await dbQuery

      if (error) {
        fastify.log.error('Error fetching accounts:', error)
        return reply.code(500).send({
          error: 'Database Error',
          message: 'Failed to fetch accounts'
        })
      }

      const total = count || 0
      const pages = Math.ceil(total / query.limit)

      return reply.send({
        data: accounts,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          pages,
          has_more: query.page < pages
        }
      })

    } catch (error) {
      fastify.log.error('Get accounts error:', error)
      
      if ((error as any).validation) {
        return reply.code(400).send({
          error: 'Validation Error',
          message: 'Invalid query parameters',
          details: (error as any).validation
        })
      }

      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to get accounts'
      })
    }
  })

  // POST /api/accounts - Create new account
  fastify.post('/', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const userId = (request.user as any).sub
      const accountData = validateAndTransform(CreateAccountSchema, request.body)
      
      const userSupabase = getSupabaseWithAuth((request.user as any).token || '')

      // Check if account name already exists for user
      const { data: existingAccount } = await userSupabase
        .from('accounts')
        .select('id')
        .eq('user_id', userId)
        .eq('name', accountData.name)
        .eq('is_active', true)
        .single()

      if (existingAccount) {
        return reply.code(409).send({
          error: 'Account Exists',
          message: 'Account with this name already exists'
        })
      }

      // Create account
      const { data: account, error: createError } = await userSupabase
        .from('accounts')
        .insert([{
          user_id: userId,
          ...accountData
        }])
        .select('*')
        .single()

      if (createError || !account) {
        fastify.log.error('Error creating account:', createError)
        return reply.code(500).send({
          error: 'Database Error',
          message: 'Failed to create account'
        })
      }

      return reply.code(201).send({
        success: true,
        data: validateAndTransform(AccountEntitySchema, account)
      })

    } catch (error) {
      fastify.log.error('Create account error:', error)
      
      if ((error as any).validation) {
        return reply.code(400).send({
          error: 'Validation Error',
          message: 'Invalid account data',
          details: (error as any).validation
        })
      }

      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to create account'
      })
    }
  })

  // GET /api/accounts/:id - Get specific account
  fastify.get('/:id', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const userId = (request.user as any).sub
      const accountId = validateAndTransform(UUIDSchema, (request.params as any).id)
      
      const userSupabase = getSupabaseWithAuth((request.user as any).token || '')

      const { data: account, error } = await userSupabase
        .from('accounts')
        .select('*')
        .eq('id', accountId)
        .eq('user_id', userId)
        .single()

      if (error || !account) {
        return reply.code(404).send({
          error: 'Account Not Found',
          message: 'Account not found or does not belong to user'
        })
      }

      return reply.send({
        success: true,
        data: validateAndTransform(AccountEntitySchema, account)
      })

    } catch (error) {
      fastify.log.error('Get account error:', error)
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to get account'
      })
    }
  })

  // PUT /api/accounts/:id - Update account
  fastify.put('/:id', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const userId = (request.user as any).sub
      const accountId = validateAndTransform(UUIDSchema, (request.params as any).id)
      const updateData = validateAndTransform(UpdateAccountSchema, request.body)
      
      if (Object.keys(updateData).length === 0) {
        return reply.code(400).send({
          error: 'No Data',
          message: 'No update data provided'
        })
      }

      const userSupabase = getSupabaseWithAuth((request.user as any).token || '')

      // Check if account exists and belongs to user
      const { data: existingAccount, error: findError } = await userSupabase
        .from('accounts')
        .select('*')
        .eq('id', accountId)
        .eq('user_id', userId)
        .single()

      if (findError || !existingAccount) {
        return reply.code(404).send({
          error: 'Account Not Found',
          message: 'Account not found or does not belong to user'
        })
      }

      // Check for name conflicts (if name is being updated)
      if (updateData.name && updateData.name !== existingAccount.name) {
        const { data: conflictAccount } = await userSupabase
          .from('accounts')
          .select('id')
          .eq('user_id', userId)
          .eq('name', updateData.name)
          .eq('is_active', true)
          .neq('id', accountId)
          .single()

        if (conflictAccount) {
          return reply.code(409).send({
            error: 'Name Conflict',
            message: 'Another account with this name already exists'
          })
        }
      }

      // Don't allow direct balance updates (should be done through transactions)
      const { balance, ...safeUpdateData } = updateData as any

      // Update account
      const { data: account, error: updateError } = await userSupabase
        .from('accounts')
        .update(safeUpdateData)
        .eq('id', accountId)
        .eq('user_id', userId)
        .select('*')
        .single()

      if (updateError || !account) {
        fastify.log.error('Error updating account:', updateError)
        return reply.code(500).send({
          error: 'Database Error',
          message: 'Failed to update account'
        })
      }

      return reply.send({
        success: true,
        data: validateAndTransform(AccountEntitySchema, account)
      })

    } catch (error) {
      fastify.log.error('Update account error:', error)
      
      if ((error as any).validation) {
        return reply.code(400).send({
          error: 'Validation Error',
          message: 'Invalid update data',
          details: (error as any).validation
        })
      }

      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to update account'
      })
    }
  })

  // DELETE /api/accounts/:id - Deactivate account (soft delete)
  fastify.delete('/:id', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const userId = (request.user as any).sub
      const accountId = validateAndTransform(UUIDSchema, (request.params as any).id)
      
      const userSupabase = getSupabaseWithAuth((request.user as any).token || '')

      // Check if account exists
      const { data: account, error: findError } = await userSupabase
        .from('accounts')
        .select('id, balance')
        .eq('id', accountId)
        .eq('user_id', userId)
        .single()

      if (findError || !account) {
        return reply.code(404).send({
          error: 'Account Not Found',
          message: 'Account not found or does not belong to user'
        })
      }

      // Check if account has transactions
      const { count: transactionCount } = await userSupabase
        .from('transactions')
        .select('id', { count: 'exact', head: true })
        .eq('account_id', accountId)

      if (transactionCount && transactionCount > 0) {
        // Soft delete - just deactivate
        const { error: deactivateError } = await userSupabase
          .from('accounts')
          .update({ is_active: false })
          .eq('id', accountId)
          .eq('user_id', userId)

        if (deactivateError) {
          fastify.log.error('Error deactivating account:', deactivateError)
          return reply.code(500).send({
            error: 'Database Error',
            message: 'Failed to deactivate account'
          })
        }

        return reply.send({
          success: true,
          message: 'Account deactivated successfully (has transactions)'
        })
      } else {
        // Hard delete - no transactions
        const { error: deleteError } = await userSupabase
          .from('accounts')
          .delete()
          .eq('id', accountId)
          .eq('user_id', userId)

        if (deleteError) {
          fastify.log.error('Error deleting account:', deleteError)
          return reply.code(500).send({
            error: 'Database Error',
            message: 'Failed to delete account'
          })
        }

        return reply.send({
          success: true,
          message: 'Account deleted successfully'
        })
      }

    } catch (error) {
      fastify.log.error('Delete account error:', error)
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to delete account'
      })
    }
  })

  // GET /api/accounts/summary - Get accounts summary
  fastify.get('/summary', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const userId = (request.user as any).sub
      const userSupabase = getSupabaseWithAuth((request.user as any).token || '')

      // Get all active accounts
      const { data: accounts, error } = await userSupabase
        .from('accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) {
        fastify.log.error('Error fetching accounts summary:', error)
        return reply.code(500).send({
          error: 'Database Error',
          message: 'Failed to fetch accounts summary'
        })
      }

      // Calculate totals by currency
      const totals = accounts?.reduce((acc, account) => {
        if (!acc[account.currency]) {
          acc[account.currency] = 0
        }
        acc[account.currency] += parseFloat(account.balance.toString())
        return acc
      }, {} as Record<string, number>) || {}

      return reply.send({
        success: true,
        data: {
          accounts: accounts || [],
          totals,
          count: accounts?.length || 0
        }
      })

    } catch (error) {
      fastify.log.error('Get accounts summary error:', error)
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to get accounts summary'
      })
    }
  })
}

export default accountRoutes