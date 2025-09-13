import { FastifyPluginAsync } from 'fastify'
import { getSupabaseWithAuth, getSupabaseAdmin } from '../utils/supabase'
import { 
  validateAndTransform, 
  CreateCategorySchema, 
  UpdateCategorySchema,
  GetCategoriesQuerySchema,
  UUIDSchema,
  CategoryEntitySchema
} from '../utils/validation'

const categoryRoutes: FastifyPluginAsync = async (fastify) => {
  
  // GET /api/categories - Get categories (user's + default)
  fastify.get('/', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const userId = (request.user as any).sub
      const query = validateAndTransform(GetCategoriesQuerySchema, request.query)
      
      const supabaseAdmin = getSupabaseAdmin()

      // Build query for user categories and default categories
      let dbQuery = supabaseAdmin
        .from('categories')
        .select('*', { count: 'exact' })

      // Filter by user's categories or default categories
      if (query.include_default) {
        dbQuery = dbQuery.or(`user_id.eq.${userId},is_default.eq.true`)
      } else {
        dbQuery = dbQuery.eq('user_id', userId)
      }

      // Apply filters
      if (query.type) {
        dbQuery = dbQuery.eq('type', query.type)
      }
      if (query.is_active !== undefined) {
        dbQuery = dbQuery.eq('is_active', query.is_active)
      }

      // Apply pagination
      const from = (query.page - 1) * query.limit
      const to = from + query.limit - 1

      dbQuery = dbQuery
        .order('is_default', { ascending: true })  // User categories first
        .order('name', { ascending: true })
        .range(from, to)

      const { data: categories, error, count } = await dbQuery

      if (error) {
        fastify.log.error('Error fetching categories:', error)
        return reply.code(500).send({
          error: 'Database Error',
          message: 'Failed to fetch categories'
        })
      }

      const total = count || 0
      const pages = Math.ceil(total / query.limit)

      return reply.send({
        data: categories,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          pages,
          has_more: query.page < pages
        }
      })

    } catch (error) {
      fastify.log.error('Get categories error:', error)
      
      if ((error as any).validation) {
        return reply.code(400).send({
          error: 'Validation Error',
          message: 'Invalid query parameters',
          details: (error as any).validation
        })
      }

      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to get categories'
      })
    }
  })

  // POST /api/categories - Create new category
  fastify.post('/', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const userId = (request.user as any).sub
      const categoryData = validateAndTransform(CreateCategorySchema, request.body)
      
      const userSupabase = getSupabaseWithAuth((request.user as any).token || '')

      // Check if category name already exists for user (including default categories)
      const { data: existingCategory } = await userSupabase
        .from('categories')
        .select('id')
        .eq('name', categoryData.name)
        .eq('type', categoryData.type)
        .or(`user_id.eq.${userId},is_default.eq.true`)
        .eq('is_active', true)
        .single()

      if (existingCategory) {
        return reply.code(409).send({
          error: 'Category Exists',
          message: 'Category with this name and type already exists'
        })
      }

      // Create category (always user category, never default)
      const { data: category, error: createError } = await userSupabase
        .from('categories')
        .insert([{
          user_id: userId,
          ...categoryData,
          is_default: false  // User categories are never default
        }])
        .select('*')
        .single()

      if (createError || !category) {
        fastify.log.error('Error creating category:', createError)
        return reply.code(500).send({
          error: 'Database Error',
          message: 'Failed to create category'
        })
      }

      return reply.code(201).send({
        success: true,
        data: validateAndTransform(CategoryEntitySchema, category)
      })

    } catch (error) {
      fastify.log.error('Create category error:', error)
      
      if ((error as any).validation) {
        return reply.code(400).send({
          error: 'Validation Error',
          message: 'Invalid category data',
          details: (error as any).validation
        })
      }

      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to create category'
      })
    }
  })

  // GET /api/categories/:id - Get specific category
  fastify.get('/:id', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const userId = (request.user as any).sub
      const categoryId = validateAndTransform(UUIDSchema, (request.params as any).id)
      
      const userSupabase = getSupabaseWithAuth((request.user as any).token || '')

      const { data: category, error } = await userSupabase
        .from('categories')
        .select('*')
        .eq('id', categoryId)
        .or(`user_id.eq.${userId},is_default.eq.true`)
        .single()

      if (error || !category) {
        return reply.code(404).send({
          error: 'Category Not Found',
          message: 'Category not found or not accessible'
        })
      }

      return reply.send({
        success: true,
        data: validateAndTransform(CategoryEntitySchema, category)
      })

    } catch (error) {
      fastify.log.error('Get category error:', error)
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to get category'
      })
    }
  })

  // PUT /api/categories/:id - Update category (only user categories)
  fastify.put('/:id', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const userId = (request.user as any).sub
      const categoryId = validateAndTransform(UUIDSchema, (request.params as any).id)
      const updateData = validateAndTransform(UpdateCategorySchema, request.body)
      
      if (Object.keys(updateData).length === 0) {
        return reply.code(400).send({
          error: 'No Data',
          message: 'No update data provided'
        })
      }

      const userSupabase = getSupabaseWithAuth((request.user as any).token || '')

      // Check if category exists and belongs to user (not default)
      const { data: existingCategory, error: findError } = await userSupabase
        .from('categories')
        .select('*')
        .eq('id', categoryId)
        .eq('user_id', userId)
        .eq('is_default', false)  // Only user categories can be updated
        .single()

      if (findError || !existingCategory) {
        return reply.code(404).send({
          error: 'Category Not Found',
          message: 'Category not found, does not belong to user, or is a default category'
        })
      }

      // Check for name conflicts (if name or type is being updated)
      if ((updateData.name && updateData.name !== existingCategory.name) || 
          (updateData.type && updateData.type !== existingCategory.type)) {
        
        const newName = updateData.name || existingCategory.name
        const newType = updateData.type || existingCategory.type
        
        const { data: conflictCategory } = await userSupabase
          .from('categories')
          .select('id')
          .eq('name', newName)
          .eq('type', newType)
          .or(`user_id.eq.${userId},is_default.eq.true`)
          .neq('id', categoryId)
          .eq('is_active', true)
          .single()

        if (conflictCategory) {
          return reply.code(409).send({
            error: 'Name Conflict',
            message: 'A category with this name and type already exists'
          })
        }
      }

      // Update category
      const { data: category, error: updateError } = await userSupabase
        .from('categories')
        .update(updateData)
        .eq('id', categoryId)
        .eq('user_id', userId)
        .select('*')
        .single()

      if (updateError || !category) {
        fastify.log.error('Error updating category:', updateError)
        return reply.code(500).send({
          error: 'Database Error',
          message: 'Failed to update category'
        })
      }

      return reply.send({
        success: true,
        data: validateAndTransform(CategoryEntitySchema, category)
      })

    } catch (error) {
      fastify.log.error('Update category error:', error)
      
      if ((error as any).validation) {
        return reply.code(400).send({
          error: 'Validation Error',
          message: 'Invalid update data',
          details: (error as any).validation
        })
      }

      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to update category'
      })
    }
  })

  // DELETE /api/categories/:id - Deactivate category (soft delete, only user categories)
  fastify.delete('/:id', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const userId = (request.user as any).sub
      const categoryId = validateAndTransform(UUIDSchema, (request.params as any).id)
      
      const userSupabase = getSupabaseWithAuth((request.user as any).token || '')

      // Check if category exists and belongs to user (not default)
      const { data: category, error: findError } = await userSupabase
        .from('categories')
        .select('id')
        .eq('id', categoryId)
        .eq('user_id', userId)
        .eq('is_default', false)
        .single()

      if (findError || !category) {
        return reply.code(404).send({
          error: 'Category Not Found',
          message: 'Category not found, does not belong to user, or is a default category'
        })
      }

      // Check if category has transactions
      const { count: transactionCount } = await userSupabase
        .from('transactions')
        .select('id', { count: 'exact', head: true })
        .eq('category_id', categoryId)

      if (transactionCount && transactionCount > 0) {
        // Soft delete - just deactivate
        const { error: deactivateError } = await userSupabase
          .from('categories')
          .update({ is_active: false })
          .eq('id', categoryId)
          .eq('user_id', userId)

        if (deactivateError) {
          fastify.log.error('Error deactivating category:', deactivateError)
          return reply.code(500).send({
            error: 'Database Error',
            message: 'Failed to deactivate category'
          })
        }

        return reply.send({
          success: true,
          message: 'Category deactivated successfully (has transactions)'
        })
      } else {
        // Hard delete - no transactions
        const { error: deleteError } = await userSupabase
          .from('categories')
          .delete()
          .eq('id', categoryId)
          .eq('user_id', userId)

        if (deleteError) {
          fastify.log.error('Error deleting category:', deleteError)
          return reply.code(500).send({
            error: 'Database Error',
            message: 'Failed to delete category'
          })
        }

        return reply.send({
          success: true,
          message: 'Category deleted successfully'
        })
      }

    } catch (error) {
      fastify.log.error('Delete category error:', error)
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to delete category'
      })
    }
  })

  // GET /api/categories/by-type/:type - Get categories by type
  fastify.get('/by-type/:type', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const userId = (request.user as any).sub
      const type = (request.params as any).type
      
      if (!['income', 'expense'].includes(type)) {
        return reply.code(400).send({
          error: 'Invalid Type',
          message: 'Type must be either "income" or "expense"'
        })
      }

      const userSupabase = getSupabaseWithAuth((request.user as any).token || '')

      const { data: categories, error } = await userSupabase
        .from('categories')
        .select('*')
        .eq('type', type)
        .eq('is_active', true)
        .or(`user_id.eq.${userId},is_default.eq.true`)
        .order('is_default', { ascending: true })  // User categories first
        .order('name', { ascending: true })

      if (error) {
        fastify.log.error('Error fetching categories by type:', error)
        return reply.code(500).send({
          error: 'Database Error',
          message: 'Failed to fetch categories'
        })
      }

      return reply.send({
        success: true,
        data: categories || []
      })

    } catch (error) {
      fastify.log.error('Get categories by type error:', error)
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to get categories by type'
      })
    }
  })

  // Admin route: POST /api/categories/seed-defaults - Seed default categories (development only)
  if (process.env.NODE_ENV === 'development') {
    fastify.post('/seed-defaults', async (request, reply) => {
      try {
        const supabaseAdmin = getSupabaseAdmin()

        // Check if default categories already exist
        const { count } = await supabaseAdmin
          .from('categories')
          .select('id', { count: 'exact', head: true })
          .eq('is_default', true)

        if (count && count > 0) {
          return reply.send({
            success: true,
            message: 'Default categories already exist',
            count
          })
        }

        // The default categories are already seeded by the SQL schema
        // This endpoint is just for re-seeding if needed
        return reply.send({
          success: true,
          message: 'Default categories should be seeded via SQL schema'
        })

      } catch (error) {
        fastify.log.error('Seed defaults error:', error)
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'Failed to seed default categories'
        })
      }
    })
  }
}

export default categoryRoutes