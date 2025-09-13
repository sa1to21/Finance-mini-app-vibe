'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  is_premium?: boolean
  photo_url?: string
}

interface TelegramContextType {
  user: TelegramUser | null
  webApp: any
  isReady: boolean
}

const TelegramContext = createContext<TelegramContextType>({
  user: null,
  webApp: null,
  isReady: false,
})

export const useTelegram = () => {
  const context = useContext(TelegramContext)
  if (!context) {
    throw new Error('useTelegram must be used within TelegramProvider')
  }
  return context
}

interface TelegramProviderProps {
  children: ReactNode
}

export function TelegramProvider({ children }: TelegramProviderProps) {
  const [user, setUser] = useState<TelegramUser | null>(null)
  const [webApp, setWebApp] = useState<any>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Проверяем доступность Telegram WebApp
      const tg = (window as any).Telegram?.WebApp
      
      if (tg) {
        setWebApp(tg)
        
        // Настраиваем WebApp
        tg.ready()
        tg.expand()
        
        // Получаем данные пользователя
        if (tg.initDataUnsafe?.user) {
          setUser(tg.initDataUnsafe.user)
        }
        
        // Применяем тему Telegram
        if (tg.colorScheme === 'dark') {
          document.documentElement.classList.add('dark')
        }
        
        setIsReady(true)
      } else {
        // Для разработки вне Telegram - создаем mock данные
        console.warn('Telegram WebApp не доступен. Используем mock данные для разработки.')
        const mockUser = {
          id: 123456789,
          first_name: 'Test',
          last_name: 'User',
          username: 'testuser',
        }
        console.log('Mock user created:', mockUser)
        setUser(mockUser)
        setIsReady(true)
      }
    }
  }, [])

  return (
    <TelegramContext.Provider value={{ user, webApp, isReady }}>
      {children}
    </TelegramContext.Provider>
  )
}