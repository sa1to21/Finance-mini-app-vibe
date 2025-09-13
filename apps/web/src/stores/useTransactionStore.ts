import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Transaction, Category, CreateTransaction, CreateTransactionForm } from '@/types'
import { apiClient, handleApiError } from '@/lib/api'

interface TransactionState {
  transactions: Transaction[]
  categories: Category[]
  recentTransactions: Transaction[]
  monthlyIncome: number
  monthlyExpenses: number
  isLoading: boolean
  error: string | null
  
  // Actions
  setTransactions: (transactions: Transaction[]) => void
  setCategories: (categories: Category[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  calculateMonthlyStats: () => void
  getRecentTransactions: (limit?: number) => void
  
  // API Actions
  loadTransactions: (params?: any) => Promise<void>
  loadCategories: () => Promise<void>
  createTransaction: (data: CreateTransaction) => Promise<Transaction | null>
  updateTransaction: (id: string, updates: Partial<CreateTransaction>) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>
}

export const useTransactionStore = create<TransactionState>()(
  devtools(
    (set, get) => ({
      transactions: [],
      categories: [],
      recentTransactions: [],
      monthlyIncome: 0,
      monthlyExpenses: 0,
      isLoading: false,
      error: null,

      setTransactions: (transactions) => {
        set({ transactions }, false, 'setTransactions')
        get().calculateMonthlyStats()
        get().getRecentTransactions()
      },
      
      setCategories: (categories) => set({ categories }, false, 'setCategories'),
      
      setLoading: (isLoading) => set({ isLoading }, false, 'setLoading'),
      
      setError: (error) => set({ error }, false, 'setError'),
      
      calculateMonthlyStats: () => {
        const { transactions } = get()
        const currentMonth = new Date().getMonth()
        const currentYear = new Date().getFullYear()
        
        const monthlyTransactions = transactions.filter(transaction => {
          const transactionDate = new Date(transaction.date)
          return transactionDate.getMonth() === currentMonth && 
                 transactionDate.getFullYear() === currentYear
        })
        
        const monthlyIncome = monthlyTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0)
          
        const monthlyExpenses = monthlyTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0)
        
        set({ monthlyIncome, monthlyExpenses }, false, 'calculateMonthlyStats')
      },
      
      getRecentTransactions: (limit = 5) => {
        const { transactions } = get()
        const recentTransactions = transactions
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, limit)
        set({ recentTransactions }, false, 'getRecentTransactions')
      },

      // API Actions
      loadTransactions: async (params) => {
        const { setLoading, setError, setTransactions } = get()
        
        try {
          setLoading(true)
          setError(null)
          
          const response = await apiClient.getTransactions(params)
          
          if (response.data) {
            setTransactions(response.data)
          }
        } catch (error) {
          const errorMessage = handleApiError(error)
          setError(errorMessage)
        } finally {
          setLoading(false)
        }
      },

      loadCategories: async () => {
        const { setError, setCategories } = get()
        
        try {
          setError(null)
          
          const response = await apiClient.getCategories({ include_default: true })
          
          if (response.data) {
            setCategories(response.data)
          }
        } catch (error) {
          const errorMessage = handleApiError(error)
          setError(errorMessage)
        }
      },

      createTransaction: async (data) => {
        const { setError, loadTransactions } = get()
        
        try {
          setError(null)
          
          const response = await apiClient.createTransaction(data)
          
          if (response.success && response.data) {
            // Reload transactions to get fresh data
            await loadTransactions()
            return response.data
          }
          
          return null
        } catch (error) {
          const errorMessage = handleApiError(error)
          setError(errorMessage)
          return null
        }
      },

      updateTransaction: async (id, updates) => {
        const { setError, loadTransactions } = get()
        
        try {
          setError(null)
          
          await apiClient.updateTransaction(id, updates)
          
          // Reload transactions to get fresh data
          await loadTransactions()
        } catch (error) {
          const errorMessage = handleApiError(error)
          setError(errorMessage)
        }
      },

      deleteTransaction: async (id) => {
        const { setError, loadTransactions } = get()
        
        try {
          setError(null)
          
          await apiClient.deleteTransaction(id)
          
          // Reload transactions to get fresh data
          await loadTransactions()
        } catch (error) {
          const errorMessage = handleApiError(error)
          setError(errorMessage)
        }
      },
    }),
    { name: 'transaction-store' }
  )
)