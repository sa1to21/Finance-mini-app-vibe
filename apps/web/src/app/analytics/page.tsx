'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, PieChart, TrendingUp, Calendar } from 'lucide-react'
import { motion } from 'framer-motion'

export default function AnalyticsPage() {
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
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center mb-4 shadow-lg">
            <BarChart3 className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Аналитика
          </h1>
          <p className="text-muted-foreground mt-2">
            Анализ ваших финансов и трендов
          </p>
        </motion.div>

        <div className="space-y-4">
          {[
            {
              title: "Статистика по категориям",
              description: "Круговая диаграмма расходов",
              icon: PieChart,
              color: "from-emerald-100 to-green-200"
            },
            {
              title: "Тренды по времени",
              description: "График доходов и расходов",
              icon: TrendingUp,
              color: "from-blue-100 to-indigo-200"
            },
            {
              title: "Анализ по периодам",
              description: "Сравнение месяцев и недель",
              icon: Calendar,
              color: "from-purple-100 to-pink-200"
            },
          ].map((item, index) => {
            const Icon = item.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                whileHover={{ scale: 1.02, y: -2 }}
              >
                <Card className="border-blue-200 bg-gradient-to-br from-white to-blue-50/30 hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 bg-gradient-to-br ${item.color} rounded-full flex items-center justify-center shadow-sm`}>
                        <Icon className="w-6 h-6 text-slate-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{item.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-slate-100 rounded-lg h-32 flex items-center justify-center">
                      <p className="text-slate-500 text-sm">Скоро появится</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}