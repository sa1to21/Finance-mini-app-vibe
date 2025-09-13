'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Plus, Minus, Home, Car, ShoppingBag, Coffee, Zap, Heart, Wallet, CreditCard, PiggyBank, DollarSign, Briefcase, TrendingUp, Gift } from 'lucide-react'
// import { toast } from 'sonner'
const toast = { success: console.log, error: console.error }
import { motion } from 'framer-motion'
import { useTelegram } from '@/providers/telegram-provider'
import { useUserStore } from '@/stores/useUserStore'
import { useTransactionStore } from '@/stores/useTransactionStore'

// Validation schema
const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number().positive('Сумма должна быть положительной'),
  categoryId: z.string().min(1, 'Выберите категорию'),
  accountId: z.string().min(1, 'Выберите счёт'),
  description: z.string().optional(),
})

type TransactionFormData = z.infer<typeof transactionSchema>

const expenseCategories = [
  { id: "food", name: "Еда", icon: Coffee, color: "bg-gradient-to-br from-orange-100 to-orange-200 text-orange-700" },
  { id: "transport", name: "Транспорт", icon: Car, color: "bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700" },
  { id: "shopping", name: "Покупки", icon: ShoppingBag, color: "bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-700" },
  { id: "home", name: "Дом", icon: Home, color: "bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700" },
  { id: "utilities", name: "Коммуналка", icon: Zap, color: "bg-gradient-to-br from-yellow-100 to-yellow-200 text-yellow-700" },
  { id: "health", name: "Здоровье", icon: Heart, color: "bg-gradient-to-br from-red-100 to-red-200 text-red-700" },
]

const incomeCategories = [
  { id: "salary", name: "Зарплата", icon: DollarSign, color: "bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700" },
  { id: "freelance", name: "Фриланс", icon: Briefcase, color: "bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-700" },
  { id: "business", name: "Бизнес", icon: TrendingUp, color: "bg-gradient-to-br from-purple-100 to-purple-200 text-purple-700" },
  { id: "investment", name: "Инвестиции", icon: TrendingUp, color: "bg-gradient-to-br from-indigo-100 to-indigo-200 text-indigo-700" },
  { id: "gift", name: "Подарок", icon: Gift, color: "bg-gradient-to-br from-pink-100 to-pink-200 text-pink-700" },
  { id: "other", name: "Другое", icon: Plus, color: "bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700" },
]

export default function AddTransactionPage() {
  const router = useRouter()
  const { webApp } = useTelegram()
  const { accounts } = useUserStore()
  const { createTransaction } = useTransactionStore()
  
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense')
  const [selectedCategory, setSelectedCategory] = useState('')

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'expense',
      amount: 0,
      categoryId: '',
      accountId: '',
      description: '',
    }
  })

  const handleBack = () => {
    if (webApp?.HapticFeedback) {
      webApp.HapticFeedback.impactOccurred('light')
    }
    router.push('/dashboard')
  }

  const handleTypeChange = (type: 'income' | 'expense') => {
    if (webApp?.HapticFeedback) {
      webApp.HapticFeedback.impactOccurred('light')
    }
    setTransactionType(type)
    setSelectedCategory('')
    form.setValue('type', type)
    form.setValue('categoryId', '')
  }

  const handleCategorySelect = (categoryId: string) => {
    if (webApp?.HapticFeedback) {
      webApp.HapticFeedback.impactOccurred('light')
    }
    setSelectedCategory(categoryId)
    form.setValue('categoryId', categoryId)
  }

  const onSubmit = async (data: TransactionFormData) => {
    try {
      // Конвертируем form data в API формат
      const apiData = {
        account_id: data.accountId,
        category_id: data.categoryId,
        amount: data.amount,
        type: data.type,
        description: data.description || undefined
      }

      // Отправляем в API через store
      await createTransaction(apiData)

      // Показываем уведомление
      toast.success(`${data.type === 'income' ? 'Доход' : 'Расход'} добавлен!`)
      
      // Haptic feedback
      if (webApp?.HapticFeedback) {
        webApp.HapticFeedback.notificationOccurred('success')
      }
      
      // Возвращаемся на дашборд
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
      
    } catch (error) {
      toast.error('Ошибка при добавлении транзакции')
      if (webApp?.HapticFeedback) {
        webApp.HapticFeedback.notificationOccurred('error')
      }
    }
  }

  const currentCategories = transactionType === 'expense' ? expenseCategories : incomeCategories

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <motion.div 
        className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-4 pb-6 relative overflow-hidden"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Background decorations */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-y-12"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        
        <motion.div 
          className="flex items-center justify-between relative z-10"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBack}
              className="text-white hover:bg-white/20 backdrop-blur-sm transition-all duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </motion.div>
          <h1 className="text-lg font-medium text-white">Новая операция</h1>
          <div className="w-8" />
        </motion.div>
      </motion.div>

      <motion.div 
        className="p-4 -mt-2"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <Card className="border-none shadow-xl bg-gradient-to-br from-white to-blue-50/30 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <CardTitle className="text-center bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Добавить операцию
              </CardTitle>
            </motion.div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Type Selection */}
            <motion.div 
              className="flex gap-2"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.25 }}
            >
              <motion.div
                className="flex-1"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  type="button"
                  variant={transactionType === 'expense' ? 'default' : 'outline'}
                  className={`w-full transition-all duration-300 ${transactionType === 'expense' 
                    ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg' 
                    : 'border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400'
                  }`}
                  onClick={() => handleTypeChange('expense')}
                >
                  <Minus className="w-4 h-4 mr-2" />
                  Расход
                </Button>
              </motion.div>
              <motion.div
                className="flex-1"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  type="button"
                  variant={transactionType === 'income' ? 'default' : 'outline'}
                  className={`w-full transition-all duration-300 ${transactionType === 'income' 
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg' 
                    : 'border-emerald-300 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-400'
                  }`}
                  onClick={() => handleTypeChange('income')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Доход
                </Button>
              </motion.div>
            </motion.div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Amount */}
              <motion.div 
                className="space-y-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <Label htmlFor="amount" className="text-slate-700">Сумма *</Label>
                <div className="relative">
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0"
                    className="text-2xl font-medium text-center py-6 border-blue-200 focus:border-blue-400 focus:ring-blue-400/20 bg-gradient-to-br from-white to-blue-50/30"
                    step="0.01"
                    min="0"
                    {...form.register('amount', { valueAsNumber: true })}
                  />
                  <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-blue-600 font-medium">
                    ₽
                  </span>
                </div>
                {form.formState.errors.amount && (
                  <p className="text-red-500 text-sm">{form.formState.errors.amount.message}</p>
                )}
              </motion.div>

              {/* Category */}
              <motion.div 
                className="space-y-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.35 }}
              >
                <Label className="text-slate-700">
                  {transactionType === 'expense' ? 'Категория *' : 'Источник дохода *'}
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {currentCategories.map((category, index) => {
                    const Icon = category.icon
                    return (
                      <motion.button
                        key={category.id}
                        type="button"
                        className={`p-3 rounded-lg border text-center transition-all duration-250 ${
                          selectedCategory === category.id
                            ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-md'
                            : 'border-blue-200 hover:border-blue-400 hover:bg-blue-50/30'
                        }`}
                        onClick={() => handleCategorySelect(category.id)}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.5 + index * 0.03 }}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <motion.div 
                          className="w-8 h-8 mx-auto rounded-full flex items-center justify-center mb-1 bg-gradient-to-br from-blue-100 to-indigo-200 shadow-sm"
                          whileHover={{ rotate: 5 }}
                        >
                          <Icon className={`w-4 h-4 ${
                            transactionType === 'expense' ? 'text-red-600' : 'text-emerald-600'
                          }`} />
                        </motion.div>
                        <span className="text-xs text-slate-700">{category.name}</span>
                      </motion.button>
                    )
                  })}
                </div>
                {form.formState.errors.categoryId && (
                  <p className="text-red-500 text-sm">{form.formState.errors.categoryId.message}</p>
                )}
              </motion.div>

              {/* Account Selection */}
              <motion.div 
                className="space-y-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.6 }}
              >
                <Label className="text-slate-700">Счёт *</Label>
                <Select onValueChange={(value) => form.setValue('accountId', value)}>
                  <SelectTrigger className="border-blue-200 focus:border-blue-400 focus:ring-blue-400/20 bg-gradient-to-br from-white to-blue-50/30">
                    <SelectValue placeholder="Выберите счёт" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        <div className="flex items-center gap-2">
                          <Wallet className="w-4 h-4 text-blue-600" />
                          <span>{account.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.accountId && (
                  <p className="text-red-500 text-sm">{form.formState.errors.accountId.message}</p>
                )}
              </motion.div>

              {/* Description */}
              <motion.div 
                className="space-y-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.65 }}
              >
                <Label className="text-slate-700">Описание</Label>
                <Textarea
                  placeholder="Добавьте описание..."
                  rows={3}
                  className="border-blue-200 focus:border-blue-400 focus:ring-blue-400/20 bg-gradient-to-br from-white to-blue-50/30"
                  {...form.register('description')}
                />
              </motion.div>

              {/* Submit Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.7 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
                  disabled={form.formState.isSubmitting}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full"
                    transition={{ duration: 800 }}
                  />
                  <span className="relative z-10 font-medium">
                    {form.formState.isSubmitting 
                      ? 'Добавление...' 
                      : `Добавить ${transactionType === 'income' ? 'доход' : 'расход'}`
                    }
                  </span>
                </Button>
              </motion.div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}