import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import env from '@fastify/env'
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox'

// Utils
import { initSupabase } from './utils/supabase'

// Routes
import authRoutes from './routes/auth'
import transactionRoutes from './routes/transactions'
import accountRoutes from './routes/accounts'
import categoryRoutes from './routes/categories'

// Environment validation schema
const envSchema = {
  type: 'object',
  required: [
    'SUPABASE_URL', 
    'SUPABASE_ANON_KEY', 
    'SUPABASE_SERVICE_ROLE_KEY',
    'TELEGRAM_BOT_TOKEN',
    'JWT_SECRET'
  ],
  properties: {
    PORT: { type: 'string', default: '3001' },
    HOST: { type: 'string', default: '0.0.0.0' },
    NODE_ENV: { type: 'string', default: 'development' },
    SUPABASE_URL: { type: 'string' },
    SUPABASE_ANON_KEY: { type: 'string' },
    SUPABASE_SERVICE_ROLE_KEY: { type: 'string' },
    TELEGRAM_BOT_TOKEN: { type: 'string' },
    JWT_SECRET: { type: 'string' },
    FRONTEND_URL: { type: 'string', default: 'http://localhost:3003' }
  }
}

async function buildServer() {
  const fastify = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
      transport: process.env.NODE_ENV === 'development' ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname'
        }
      } : undefined
    }
  }).withTypeProvider<TypeBoxTypeProvider>()

  // Register environment validation
  await fastify.register(env, {
    schema: envSchema,
    dotenv: true
  })

  // Initialize Supabase
  initSupabase({
    url: fastify.config.SUPABASE_URL as string,
    anonKey: fastify.config.SUPABASE_ANON_KEY as string,
    serviceRoleKey: fastify.config.SUPABASE_SERVICE_ROLE_KEY as string
  })

  // Register CORS
  await fastify.register(cors, {
    origin: [fastify.config.FRONTEND_URL, /localhost:\d{4}$/],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
  })

  // Register JWT
  await fastify.register(jwt, {
    secret: fastify.config.JWT_SECRET
  })

  // Add JWT verification decorator
  fastify.decorate('authenticate', async function(request: any, reply: any) {
    try {
      await request.jwtVerify()
    } catch (err) {
      reply.code(401).send({ 
        error: 'Unauthorized',
        message: 'Invalid or missing JWT token'
      })
    }
  })

  // Health check route
  fastify.get('/health', async () => {
    return { 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV
    }
  })

  // Register API routes
  await fastify.register(authRoutes, { prefix: '/api/auth' })
  await fastify.register(transactionRoutes, { prefix: '/api/transactions' })
  await fastify.register(accountRoutes, { prefix: '/api/accounts' })
  await fastify.register(categoryRoutes, { prefix: '/api/categories' })

  // Global error handler
  fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error(error)
    
    // Validation errors
    if (error.validation) {
      reply.code(400).send({
        error: 'Validation Error',
        message: 'Invalid request data',
        details: error.validation
      })
      return
    }

    // JWT errors
    if (error.code === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER') {
      reply.code(401).send({
        error: 'Unauthorized',
        message: 'Missing authorization header'
      })
      return
    }

    // Supabase errors
    if (error.message?.includes('supabase')) {
      reply.code(500).send({
        error: 'Database Error',
        message: 'Something went wrong with the database'
      })
      return
    }

    // Default error
    reply.code(error.statusCode || 500).send({
      error: error.name || 'Internal Server Error',
      message: process.env.NODE_ENV === 'production' 
        ? 'Something went wrong' 
        : error.message
    })
  })

  // 404 handler
  fastify.setNotFoundHandler((request, reply) => {
    reply.code(404).send({
      error: 'Not Found',
      message: `Route ${request.method} ${request.url} not found`
    })
  })

  return fastify
}

async function start() {
  try {
    const fastify = await buildServer()
    
    const port = parseInt(fastify.config.PORT as string)
    const host = fastify.config.HOST as string

    await fastify.listen({ port, host })
    
    fastify.log.info(`🚀 Finance Tracker API is running!`)
    fastify.log.info(`📡 Server: http://${host}:${port}`)
    fastify.log.info(`🏥 Health: http://${host}:${port}/health`)
    fastify.log.info(`🌍 Environment: ${process.env.NODE_ENV}`)
    
  } catch (err) {
    console.error('❌ Error starting server:', err)
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Gracefully shutting down...')
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('\n🛑 Gracefully shutting down...')
  process.exit(0)
})

if (require.main === module) {
  start()
}

export { buildServer }