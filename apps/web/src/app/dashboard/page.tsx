'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Wallet, CreditCard, PiggyBank, Eye, EyeOff, TrendingUp, TrendingDown, Calendar, Filter, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTelegram } from '@/providers/telegram-provider'
import { useUserStore } from '@/stores/useUserStore'
import { useTransactionStore } from '@/stores/useTransactionStore'
import { useUIStore } from '@/stores/useUIStore'

// All data now comes from real API - no more mock data

export default function DashboardPage() {
  const router = useRouter()
  const { user, webApp } = useTelegram()
  
  // Stores
  const { accounts, totalBalance, loadAccounts, loadUserData, isAuthenticated, loginWithTelegram } = useUserStore()
  const { recentTransactions, monthlyIncome, monthlyExpenses, loadTransactions, loadCategories, isLoading } = useTransactionStore()
  const { showBalance, toggleShowBalance } = useUIStore()

  // Auth with real Telegram data
  useEffect(() => {
    const initAuth = async () => {
      if (!isAuthenticated && user) {
        try {
          // If in Telegram, use webApp.initData
          let initData: string;
          
          if (webApp?.initData) {
            // Real Telegram data
            initData = webApp.initData;
            console.log('Using real Telegram initData for user:', user.id);
          } else {
            // Mock data for development (browser)
            const mockUser = {
              id: user.id,
              first_name: user.first_name,
              last_name: user.last_name,
              username: user.username
            };
            initData = `user=${encodeURIComponent(JSON.stringify(mockUser))}&auth_date=${Math.floor(Date.now() / 1000)}&query_id=mock_query_id&hash=mock_hash`;
            console.log('Using mock initData for user:', user.id, 'mockUser:', mockUser);
          }
          
          await loginWithTelegram(initData);
        } catch (error) {
          console.error('Auth failed:', error);
        }
      }
    }
    initAuth()
  }, [isAuthenticated, loginWithTelegram, user, webApp])

  // Load real data from API
  useEffect(() => {
    if (isAuthenticated) {
      loadUserData()
      loadAccounts()
      loadTransactions()
      loadCategories()
    }
  }, [isAuthenticated, loadUserData, loadAccounts, loadTransactions, loadCategories])

  const monthlyChange = monthlyIncome - monthlyExpenses

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const handleAddTransaction = () => {
    if (webApp?.HapticFeedback) {
      webApp.HapticFeedback.impactOccurred('medium')
    }
    router.push('/add-transaction')
  }

  const handleToggleBalance = () => {
    if (webApp?.HapticFeedback) {
      webApp.HapticFeedback.impactOccurred('light')
    }
    toggleShowBalance()
  }

  const getAccountIcon = (iconName: string) => {
    switch (iconName) {
      case 'wallet': return Wallet
      case 'piggy-bank': return PiggyBank
      case 'credit-card': return CreditCard
      default: return Wallet
    }
  }

  // Show loading while fetching data
  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Загружаем данные...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <motion.div 
        className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 px-4 py-6 relative overflow-hidden"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Background decorations */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-y-12 translate-y-8"></div>
        <div className="absolute top-4 right-8 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
        <div className="absolute bottom-4 left-8 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
        
        <div className="max-w-md mx-auto relative">
          <motion.div 
            className="flex items-center justify-between mb-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-yellow-300" />
              <h1 className="text-white font-medium">FinanceTracker</h1>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleBalance}
                className="text-white hover:bg-white/20 transition-all duration-200 backdrop-blur-sm"
              >
                {showBalance ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </Button>
            </motion.div>
          </motion.div>

          {/* Total Balance */}
          <motion.div 
            className="text-center mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <p className="text-white/80 text-sm mb-1">Общий баланс</p>
            <motion.p 
              className="text-white text-3xl font-medium mb-2"
              key={showBalance ? totalBalance : 'hidden'}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {showBalance ? formatCurrency(totalBalance) : "• • •"}
            </motion.p>
            <div className="flex items-center justify-center gap-2">
              <motion.div 
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs backdrop-blur-sm ${
                  monthlyChange >= 0 
                    ? 'bg-emerald-500/30 text-emerald-100 border border-emerald-400/30' 
                    : 'bg-red-500/30 text-red-100 border border-red-400/30'
                }`}
                whileHover={{ scale: 1.05 }}
              >
                {monthlyChange >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                <span>
                  {showBalance ? formatCurrency(Math.abs(monthlyChange)) : "• • •"}
                </span>
              </motion.div>
              <span className="text-white/60 text-xs">за месяц</span>
            </div>
          </motion.div>

          {/* Accounts */}
          <motion.div 
            className="grid grid-cols-2 gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            {accounts.map((account, index) => {
              const Icon = getAccountIcon(account.icon)
              return (
                <motion.div
                  key={account.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
                  whileHover={{ 
                    scale: 1.02,
                    y: -2,
                    transition: { duration: 0.2 }
                  }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card className="bg-white/15 border-white/30 backdrop-blur-md hover:bg-white/20 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shadow-sm bg-gradient-to-br from-${account.color}-100 to-${account.color}-200`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-white/90 text-sm font-medium truncate">
                          {account.name}
                        </span>
                      </div>
                      <motion.p 
                        className="text-white font-medium"
                        key={showBalance ? account.balance : 'hidden'}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        {showBalance ? formatCurrency(account.balance) : "• • •"}
                      </motion.p>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </motion.div>

      {/* Content */}
      <motion.div 
        className="px-4 py-6 max-w-md mx-auto"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
      >
        {/* Quick Stats */}
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium text-foreground">Этот месяц</h2>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200">
                <Calendar className="w-4 h-4 mr-1" />
                Январь
              </Button>
            </motion.div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 hover:shadow-md transition-all duration-300">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-full flex items-center justify-center shadow-sm">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs text-emerald-600/70">Доходы</p>
                      <motion.p 
                        className="font-medium text-sm text-emerald-700"
                        key={showBalance ? monthlyIncome : 'hidden'}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        {showBalance ? formatCurrency(monthlyIncome) : "• • •"}
                      </motion.p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="border-red-200 bg-gradient-to-br from-red-50 to-rose-50 hover:shadow-md transition-all duration-300">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center shadow-sm">
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <p className="text-xs text-red-600/70">Расходы</p>
                      <motion.p 
                        className="font-medium text-sm text-red-700"
                        key={showBalance ? monthlyExpenses : 'hidden'}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        {showBalance ? formatCurrency(monthlyExpenses) : "• • •"}
                      </motion.p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.45 }}
        >
          <h2 className="font-medium mb-3 text-foreground">Быстрые действия</h2>
          <div className="grid grid-cols-2 gap-3">
            <motion.div
              whileHover={{ scale: 1.03, y: -3 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                onClick={handleAddTransaction}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white p-4 h-auto flex-col gap-2 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                <Plus className="w-5 h-5 relative z-10" />
                <span className="text-sm relative z-10">Добавить операцию</span>
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.03, y: -3 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                variant="outline"
                className="border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400 p-4 h-auto flex-col gap-2 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <Wallet className="w-5 h-5" />
                <span className="text-sm">Управление счетами</span>
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium text-foreground">Последние операции</h2>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200">
                <Filter className="w-4 h-4 mr-1" />
                Все
              </Button>
            </motion.div>
          </div>
          
          {recentTransactions.length > 0 ? (
            <Card className="border-blue-200 bg-gradient-to-br from-white to-blue-50/30 shadow-sm hover:shadow-md transition-all duration-300">
              <CardContent className="p-0">
                {recentTransactions.map((transaction, index) => (
                  <motion.div
                    key={transaction.id}
                    className={`p-4 hover:bg-blue-50/50 transition-colors duration-200 cursor-pointer ${
                      index !== recentTransactions.length - 1 ? 'border-b border-blue-100' : ''
                    }`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.55 + index * 0.05 }}
                    whileHover={{ x: 4 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <motion.div 
                          className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${
                            transaction.type === 'income' 
                              ? 'bg-gradient-to-br from-emerald-100 to-emerald-200' 
                              : 'bg-gradient-to-br from-red-100 to-red-200'
                          }`}
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          transition={{ duration: 0.2 }}
                        >
                          {transaction.type === 'income' ? (
                            <TrendingUp className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <TrendingDown className="w-5 h-5 text-red-600" />
                          )}
                        </motion.div>
                        <div>
                          <h3 className="font-medium text-sm">{transaction.category?.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {transaction.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(transaction.date).toLocaleDateString('ru-RU')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <motion.p 
                          className={`font-medium ${
                            transaction.type === 'income' ? 'text-emerald-600' : 'text-red-600'
                          }`}
                          key={showBalance ? transaction.amount : 'hidden'}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          {transaction.type === 'income' ? '+' : '-'}
                          {showBalance ? formatCurrency(transaction.amount) : "• • •"}
                        </motion.p>
                        <Badge variant="outline" className="text-xs border-blue-300 text-blue-700">
                          {accounts.find(acc => acc.id === transaction.account_id)?.name || 'Неизвестно'}
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-blue-200 bg-gradient-to-br from-white to-blue-50/30">
              <CardContent className="p-4">
                <motion.div 
                  className="text-center py-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <motion.div 
                    className="w-12 h-12 mx-auto bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mb-3 shadow-sm"
                    whileHover={{ scale: 1.1, rotate: 10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Wallet className="w-6 h-6 text-blue-600" />
                  </motion.div>
                  <p className="text-muted-foreground text-sm mb-3">
                    Операций пока нет
                  </p>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button 
                      onClick={handleAddTransaction}
                      variant="outline" 
                      size="sm"
                      className="border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-all duration-300"
                    >
                      Добавить первую операцию
                    </Button>
                  </motion.div>
                </motion.div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </motion.div>
    </div>
  )
}