import { FastifyPluginAsync } from 'fastify'
import { validateTelegramInitData, formatTelegramUserForDB } from '../utils/telegram'
import { getSupabaseAdmin } from '../utils/supabase'
import { validateAndTransform, TelegramAuthSchema, UserEntitySchema } from '../utils/validation'

const authRoutes: FastifyPluginAsync = async (fastify) => {
  // POST /api/auth/telegram - Telegram WebApp authentication
  fastify.post('/telegram', async (request, reply) => {
    try {
      // Validate request body
      const { initData } = validateAndTransform(TelegramAuthSchema, request.body)

      // Validate Telegram initData
      const validation = validateTelegramInitData(
        initData,
        fastify.config.TELEGRAM_BOT_TOKEN as string
      )

      if (!validation.isValid || !validation.data?.user) {
        return reply.code(401).send({
          error: 'Invalid Telegram Auth',
          message: validation.error || 'Invalid initData'
        })
      }

      const telegramUser = validation.data.user
      const supabaseAdmin = getSupabaseAdmin()

      // Try to find existing user by telegram_id
      const { data: existingUser, error: findError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('telegram_id', telegramUser.id)
        .single()

      let user

      if (findError && findError.code === 'PGRST116') {
        // User doesn't exist, create new user in Supabase Auth
        const userFormatted = formatTelegramUserForDB(telegramUser)
        if (!userFormatted) {
          return reply.code(400).send({
            error: 'Invalid User Data',
            message: 'Failed to format user data'
          })
        }

        // Create unique email using timestamp to avoid conflicts
        const email = `${telegramUser.id}-${Date.now()}@telegram.local`
        
        // Create Supabase Auth user
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email,
          user_metadata: {
            telegram_id: telegramUser.id,
            first_name: telegramUser.first_name,
            last_name: telegramUser.last_name,
            username: telegramUser.username,
            language_code: telegramUser.language_code
          },
          email_confirm: true
        })

        if (authError || !authUser.user) {
          // If user already exists by telegram_id logic, try to handle that
          if (authError?.code === 'email_exists') {
            fastify.log.info(`Email exists for telegram_id: ${telegramUser.id}, trying alternative approach`)
            
            // For now, return an error - we'll handle existing users later
            return reply.code(409).send({
              error: 'User Exists',
              message: 'User already exists with this Telegram ID'
            })
          }
          
          fastify.log.error('Failed to create Supabase Auth user:')
          fastify.log.error('Auth error details:', JSON.stringify(authError, null, 2))
          console.error('Full authError object:', authError)
          return reply.code(500).send({
            error: 'Auth Error',
            message: `Failed to create user account: ${authError?.message || 'Unknown error'}`
          })
        }

        // Create user profile in public.users table
        const { data: profileData, error: profileError } = await supabaseAdmin
          .from('users')
          .insert([{
            id: authUser.user.id,
            telegram_id: telegramUser.id,
            username: telegramUser.username,
            first_name: telegramUser.first_name,
            last_name: telegramUser.last_name
          }])
          .select()
          .single()

        if (profileError) {
          fastify.log.error('Failed to create user profile:', profileError)
          console.error('Full profile error:', JSON.stringify(profileError, null, 2))
          // Try to cleanup auth user
          await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
          return reply.code(500).send({
            error: 'Profile Error',
            message: `Failed to create user profile: ${profileError.message}`
          })
        }

        if (!profileData) {
          fastify.log.error('No user data returned from insert')
          return reply.code(500).send({
            error: 'User Error',
            message: 'Failed to retrieve user data'
          })
        }

        user = profileData
        fastify.log.info(`Created new user for Telegram ID: ${telegramUser.id}`)

      } else if (findError) {
        fastify.log.error('Database error finding user:', findError)
        return reply.code(500).send({
          error: 'Database Error',
          message: 'Failed to find user'
        })
      } else {
        user = existingUser
        fastify.log.info(`Found existing user for Telegram ID: ${telegramUser.id}`)
      }

      // Generate JWT token
      const token = fastify.jwt.sign({
        sub: user.id,
        telegram_id: user.telegram_id,
        iat: Math.floor(Date.now() / 1000)
      }, {
        expiresIn: '24h'
      })

      // Return success response
      return reply.send({
        success: true,
        data: {
          token,
          user: user, // Temporarily skip validation 
          expires_in: 24 * 60 * 60 // 24 hours in seconds
        }
      })

    } catch (error) {
      fastify.log.error('Auth error:', error)
      
      if ((error as any).validation) {
        return reply.code(400).send({
          error: 'Validation Error',
          message: 'Invalid request data',
          details: (error as any).validation
        })
      }

      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Authentication failed'
      })
    }
  })

  // GET /api/auth/me - Get current user info
  fastify.get('/me', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const userId = (request.user as any).sub
      const supabaseAdmin = getSupabaseAdmin()

      // Get user from database
      const { data: user, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error || !user) {
        return reply.code(404).send({
          error: 'User Not Found',
          message: 'User not found in database'
        })
      }

      // Get user's total balance
      const { data: totalBalance, error: balanceError } = await supabaseAdmin
        .rpc('get_total_balance', { user_uuid: userId })

      if (balanceError) {
        fastify.log.warn('Failed to get total balance:', balanceError)
      }

      return reply.send({
        success: true,
        data: {
          user: user, // Temporarily skip validation
          total_balance: totalBalance || 0
        }
      })

    } catch (error) {
      fastify.log.error('Get user error:', error)
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to get user data'
      })
    }
  })

  // POST /api/auth/refresh - Refresh JWT token (for future use)
  fastify.post('/refresh', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const currentUser = request.user as any
      
      // Generate new token
      const token = fastify.jwt.sign({
        sub: currentUser.sub,
        telegram_id: currentUser.telegram_id,
        iat: Math.floor(Date.now() / 1000)
      }, {
        expiresIn: '24h'
      })

      return reply.send({
        success: true,
        data: {
          token,
          expires_in: 24 * 60 * 60
        }
      })

    } catch (error) {
      fastify.log.error('Token refresh error:', error)
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to refresh token'
      })
    }
  })

  // Development only: Create mock auth (DO NOT USE IN PRODUCTION)
  if (process.env.NODE_ENV === 'development') {
    fastify.post('/mock', async (request, reply) => {
      const { createMockTelegramInitData } = await import('../utils/telegram')
      
      const mockUser = {
        id: 123456789,
        first_name: 'Test User',
        username: 'testuser'
      }

      try {
        const mockInitData = createMockTelegramInitData(
          mockUser, 
          fastify.config.TELEGRAM_BOT_TOKEN as string
        )

        // Use the same logic as telegram auth
        const validation = validateTelegramInitData(
          mockInitData,
          fastify.config.TELEGRAM_BOT_TOKEN as string
        )

        if (!validation.isValid || !validation.data?.user) {
          return reply.code(500).send({
            error: 'Mock Auth Failed',
            message: 'Failed to create mock authentication'
          })
        }

        return reply.send({
          success: true,
          data: {
            initData: mockInitData,
            user: validation.data.user,
            note: 'This is mock data for development only'
          }
        })

      } catch (error) {
        return reply.code(500).send({
          error: 'Mock Error',
          message: 'Cannot create mock auth in production'
        })
      }
    })
  }
}

export default authRoutes