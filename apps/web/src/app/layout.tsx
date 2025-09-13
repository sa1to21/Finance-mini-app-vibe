import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { TelegramProvider } from '@/providers/telegram-provider'
import { QueryProvider } from '@/providers/query-provider'
import { Toaster } from 'sonner'
import { LayoutContent } from '@/components/layout-content'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  title: 'FinanceTracker | Telegram Mini App',
  description: 'Отслеживайте свои доходы и расходы легко и просто',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <head>
        <script 
          src="https://telegram.org/js/telegram-web-app.js"
          async
        />
      </head>
      <body className={inter.className}>
        <TelegramProvider>
          <QueryProvider>
            <div className="tg-viewport">
              <LayoutContent>
                {children}
              </LayoutContent>
            </div>
            <Toaster />
          </QueryProvider>
        </TelegramProvider>
      </body>
    </html>
  )
}