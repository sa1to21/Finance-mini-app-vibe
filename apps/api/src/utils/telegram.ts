import crypto from 'crypto'

// Telegram WebApp InitData interface
export interface TelegramInitData {
  query_id?: string
  user?: {
    id: number
    first_name: string
    last_name?: string
    username?: string
    language_code?: string
    is_premium?: boolean
    allows_write_to_pm?: boolean
  }
  auth_date: number
  hash: string
  [key: string]: any
}

// Parse Telegram WebApp initData
export function parseTelegramInitData(initData: string): TelegramInitData | null {
  try {
    const urlParams = new URLSearchParams(initData)
    const data: any = {}

    for (const [key, value] of urlParams) {
      if (key === 'user') {
        data.user = JSON.parse(decodeURIComponent(value))
      } else if (key === 'auth_date') {
        data.auth_date = parseInt(value)
      } else {
        data[key] = value
      }
    }

    return data as TelegramInitData
  } catch (error) {
    console.error('Error parsing Telegram initData:', error)
    return null
  }
}

// Validate Telegram WebApp initData signature
export function validateTelegramInitData(
  initData: string, 
  botToken: string, 
  maxAge: number = 86400 // 24 hours
): { isValid: boolean; data?: TelegramInitData; error?: string } {
  try {
    // In development mode, allow mock data with mock_hash
    const urlParams = new URLSearchParams(initData)
    const hash = urlParams.get('hash')

    if (!hash) {
      return { isValid: false, error: 'Missing hash parameter' }
    }

    // Skip signature validation for mock data in development
    if (process.env.NODE_ENV === 'development' && hash === 'mock_hash') {
      console.log('🔧 Development mode: skipping signature validation for mock data')
      const parsedData = parseTelegramInitData(initData)
      if (!parsedData) {
        return { isValid: false, error: 'Failed to parse mock initData' }
      }
      return { isValid: true, data: parsedData }
    }

    // Remove hash from params for validation
    urlParams.delete('hash')
    
    // Sort parameters and create data-check-string
    const sortedParams = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')

    // Create secret key from bot token
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest()

    // Calculate expected hash
    const expectedHash = crypto
      .createHmac('sha256', secretKey)
      .update(sortedParams)
      .digest('hex')

    if (hash !== expectedHash) {
      return { isValid: false, error: 'Invalid hash signature' }
    }

    // Parse the data
    const parsedData = parseTelegramInitData(initData)
    if (!parsedData) {
      return { isValid: false, error: 'Failed to parse initData' }
    }

    // Check auth_date (timestamp validation)
    const authDate = parsedData.auth_date
    const currentTime = Math.floor(Date.now() / 1000)
    
    if (currentTime - authDate > maxAge) {
      return { isValid: false, error: 'initData is too old' }
    }

    return { isValid: true, data: parsedData }

  } catch (error) {
    console.error('Error validating Telegram initData:', error)
    return { isValid: false, error: 'Validation failed' }
  }
}

// Format user data for database
export function formatTelegramUserForDB(user: TelegramInitData['user']) {
  if (!user) return null

  return {
    telegram_id: user.id,
    username: user.username || null,
    first_name: user.first_name,
    last_name: user.last_name || null,
    language_code: user.language_code || 'ru'
  }
}

// Create mock initData for development (DO NOT USE IN PRODUCTION)
export function createMockTelegramInitData(
  user: { id: number; first_name: string; username?: string },
  botToken: string
): string {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Mock initData is not allowed in production')
  }

  const authDate = Math.floor(Date.now() / 1000)
  const userData = JSON.stringify(user)
  
  const params = new URLSearchParams({
    user: userData,
    auth_date: authDate.toString(),
    query_id: 'mock_query_id'
  })

  const sortedParams = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')

  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest()

  const hash = crypto
    .createHmac('sha256', secretKey)
    .update(sortedParams)
    .digest('hex')

  params.set('hash', hash)
  
  return params.toString()
}

// Telegram Bot API types
export interface TelegramWebhookUpdate {
  update_id: number
  message?: {
    message_id: number
    from: {
      id: number
      is_bot: boolean
      first_name: string
      username?: string
    }
    chat: {
      id: number
      type: string
    }
    date: number
    text?: string
  }
  // Add more webhook types as needed
}

// Helper to send message via Telegram Bot API
export async function sendTelegramMessage(
  botToken: string,
  chatId: number,
  text: string,
  options?: {
    parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2'
    disable_notification?: boolean
    reply_markup?: any
  }
): Promise<boolean> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        ...options
      })
    })

    const result = await response.json()
    return result.ok === true

  } catch (error) {
    console.error('Error sending Telegram message:', error)
    return false
  }
}