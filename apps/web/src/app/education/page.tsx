'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Target, TrendingUp, Shield } from 'lucide-react'
import { motion } from 'framer-motion'

export default function EducationPage() {
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
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-emerald-100 to-green-200 rounded-full flex items-center justify-center mb-4 shadow-lg">
            <BookOpen className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
            Обучение
          </h1>
          <p className="text-muted-foreground mt-2">
            Курсы финансовой грамотности
          </p>
        </motion.div>

        <div className="space-y-4">
          {[
            {
              title: "Основы бюджетирования",
              description: "Научитесь планировать свои расходы",
              icon: Target,
              color: "from-blue-100 to-indigo-200",
              progress: "Скоро"
            },
            {
              title: "Инвестиции для начинающих",
              description: "Как заставить деньги работать",
              icon: TrendingUp,
              color: "from-emerald-100 to-green-200",
              progress: "Скоро"
            },
            {
              title: "Финансовая безопасность",
              description: "Защитите свои сбережения",
              icon: Shield,
              color: "from-purple-100 to-pink-200",
              progress: "Скоро"
            },
          ].map((course, index) => {
            const Icon = course.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                whileHover={{ scale: 1.02, y: -2 }}
              >
                <Card className="border-emerald-200 bg-gradient-to-br from-white to-emerald-50/30 hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 bg-gradient-to-br ${course.color} rounded-full flex items-center justify-center shadow-sm`}>
                          <Icon className="w-6 h-6 text-slate-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{course.title}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {course.description}
                          </p>
                        </div>
                      </div>
                      <div className="bg-emerald-100 text-emerald-600 px-2 py-1 rounded-full text-xs font-medium">
                        {course.progress}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-slate-100 rounded-lg h-20 flex items-center justify-center">
                      <p className="text-slate-500 text-sm">Курс в разработке</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="p-6">
              <BookOpen className="w-12 h-12 mx-auto text-blue-600 mb-3" />
              <h3 className="font-semibold text-lg mb-2">Планы развития</h3>
              <p className="text-sm text-muted-foreground">
                Мы работаем над созданием комплексной образовательной платформы по финансовой грамотности. 
                Следите за обновлениями!
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}