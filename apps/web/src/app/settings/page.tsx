'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings, User, Palette, Bell, Shield, HelpCircle, LogOut } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTelegram } from '@/providers/telegram-provider'
import { useUIStore } from '@/stores/useUIStore'

export default function SettingsPage() {
  const { user, webApp } = useTelegram()
  const { showBalance, toggleShowBalance, theme, setTheme } = useUIStore()

  const handleToggleBalance = () => {
    if (webApp?.HapticFeedback) {
      webApp.HapticFeedback.impactOccurred('light')
    }
    toggleShowBalance()
  }

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'auto') => {
    if (webApp?.HapticFeedback) {
      webApp.HapticFeedback.impactOccurred('light')
    }
    setTheme(newTheme)
  }

  const settingsGroups = [
    {
      title: "Профиль",
      items: [
        {
          icon: User,
          label: "Информация о профиле",
          value: user ? `${user.first_name} ${user.last_name || ''}`.trim() : "Загрузка...",
          action: () => {}
        },
      ]
    },
    {
      title: "Отображение",
      items: [
        {
          icon: Palette,
          label: "Показывать суммы",
          value: showBalance ? "Включено" : "Скрыто",
          action: handleToggleBalance
        },
      ]
    },
    {
      title: "Безопасность",
      items: [
        {
          icon: Shield,
          label: "Приватность данных",
          value: "Настроить",
          action: () => {}
        },
      ]
    },
    {
      title: "Поддержка",
      items: [
        {
          icon: HelpCircle,
          label: "Помощь и поддержка",
          value: "Открыть",
          action: () => {}
        },
      ]
    },
  ]

  return (
    <div className="min-h-screen bg-background pb-24">
      <motion.div 
        className="p-4 max-w-md mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <motion.div 
          className="text-center mb-6 mt-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mb-4 shadow-lg">
            <Settings className="w-8 h-8 text-slate-600" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-600 to-slate-800 bg-clip-text text-transparent">
            Настройки
          </h1>
          <p className="text-muted-foreground mt-2">
            Персонализируйте приложение
          </p>
        </motion.div>

        <div className="space-y-6">
          {settingsGroups.map((group, groupIndex) => (
            <motion.div
              key={group.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 + groupIndex * 0.1 }}
            >
              <h2 className="text-lg font-semibold mb-3 text-foreground">
                {group.title}
              </h2>
              <Card className="border-slate-200 bg-gradient-to-br from-white to-slate-50/30">
                <CardContent className="p-0">
                  {group.items.map((item, itemIndex) => {
                    const Icon = item.icon
                    return (
                      <motion.div
                        key={item.label}
                        className={`p-4 hover:bg-slate-50/50 transition-colors duration-200 cursor-pointer ${
                          itemIndex !== group.items.length - 1 ? 'border-b border-slate-100' : ''
                        }`}
                        onClick={item.action}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center shadow-sm">
                              <Icon className="w-5 h-5 text-slate-600" />
                            </div>
                            <span className="font-medium text-foreground">
                              {item.label}
                            </span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {item.value}
                          </span>
                        </div>
                      </motion.div>
                    )
                  })}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.7 }}
        >
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="p-6 text-center">
              <Settings className="w-12 h-12 mx-auto text-blue-600 mb-3" />
              <h3 className="font-semibold text-lg mb-2">О приложении</h3>
              <p className="text-sm text-muted-foreground mb-4">
                FinanceTracker v1.0.0<br />
                Telegram Mini App для управления финансами
              </p>
              <p className="text-xs text-muted-foreground">
                Разработано с ❤️ для Telegram
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}