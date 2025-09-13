'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Wallet, TrendingUp, PieChart, Sparkles, Shield, Target } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTelegram } from '@/providers/telegram-provider'

export default function WelcomePage() {
  const router = useRouter()
  const { user, webApp, isReady } = useTelegram()

  // Если пользователь уже авторизован в Telegram, перенаправляем на дашборд
  useEffect(() => {
    if (isReady && user) {
      // В настоящем приложении здесь будет проверка существования пользователя в БД
      // и создание нового пользователя при необходимости
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000) // Даем время увидеть welcome screen
    }
  }, [isReady, user, router])

  const handleGetStarted = () => {
    // Добавляем haptic feedback если доступен
    if (webApp?.HapticFeedback) {
      webApp.HapticFeedback.impactOccurred('light')
    }
    
    router.push('/dashboard')
  }

  if (!isReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 flex flex-col justify-center relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-blue-200/30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 right-10 w-24 h-24 bg-indigo-200/30 rounded-full blur-2xl"></div>
      <div className="absolute top-1/2 left-0 w-16 h-16 bg-purple-200/20 rounded-full blur-xl"></div>
      
      <motion.div 
        className="max-w-md mx-auto space-y-8 relative z-10"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <motion.div 
          className="text-center space-y-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <motion.div 
            className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-full flex items-center justify-center shadow-xl relative"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-600 rounded-full blur-lg opacity-70"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.7, 0.4, 0.7]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <Wallet className="w-12 h-12 text-white relative z-10" />
            <motion.div
              className="absolute -top-1 -right-1"
              animate={{ 
                rotate: [0, 360],
                scale: [1, 1.2, 1]
              }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              <Sparkles className="w-6 h-6 text-yellow-400" />
            </motion.div>
          </motion.div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            FinanceTracker
          </h1>
          <p className="text-slate-600">
            {user ? `Добро пожаловать, ${user.first_name}!` : 'Отслеживайте свои доходы и расходы легко и просто'}
          </p>
        </motion.div>

        {/* Features */}
        <motion.div 
          className="space-y-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {[
            {
              icon: TrendingUp,
              title: "Отслеживание трендов",
              description: "Видите динамику ваших финансов",
              gradient: "from-emerald-500 to-green-600",
              bgGradient: "from-emerald-50 to-green-50",
              borderColor: "border-emerald-200"
            },
            {
              icon: PieChart,
              title: "Категории расходов",
              description: "Анализируйте структуру трат",
              gradient: "from-blue-500 to-indigo-600",
              bgGradient: "from-blue-50 to-indigo-50",
              borderColor: "border-blue-200"
            },
            {
              icon: Target,
              title: "Достижение целей",
              description: "Планируйте и контролируйте бюджет",
              gradient: "from-purple-500 to-pink-600",
              bgGradient: "from-purple-50 to-pink-50",
              borderColor: "border-purple-200"
            }
          ].map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + index * 0.08 }}
                whileHover={{ scale: 1.02, y: -2 }}
              >
                <Card className={`${feature.borderColor} bg-gradient-to-br ${feature.bgGradient} hover:shadow-lg transition-all duration-300`}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <motion.div 
                        className={`w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-full flex items-center justify-center shadow-sm`}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </motion.div>
                      <div>
                        <h3 className="font-medium text-slate-800">{feature.title}</h3>
                        <p className="text-sm text-slate-600">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* CTA Button */}
        <motion.div 
          className="pt-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              onClick={handleGetStarted}
              className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full"
                transition={{ duration: 800 }}
              />
              <span className="relative z-10 font-medium">
                {user ? 'Перейти к дашборду' : 'Начать отслеживание'}
              </span>
            </Button>
          </motion.div>
        </motion.div>

        {/* Footer */}
        <motion.div 
          className="text-center text-sm text-slate-500 flex items-center justify-center space-x-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          <Shield className="w-4 h-4" />
          <span>Безопасно и просто в использовании</span>
        </motion.div>
      </motion.div>
    </div>
  )
}