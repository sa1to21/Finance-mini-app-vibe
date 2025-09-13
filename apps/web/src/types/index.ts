// User types (matching API response)
export interface User {
  id: string
  telegram_id: number
  username: string | null
  first_name: string | null
  last_name: string | null
  language_code: string | null
  created_at: string
  updated_at: string
}

// Account types (matching API response)
export interface Account {
  id: string
  user_id: string
  name: string
  balance: number
  currency: 'RUB' | 'USD' | 'EUR' | 'BTC' | 'ETH'
  type: 'cash' | 'card' | 'bank' | 'crypto' | 'investment'
  icon: string
  color: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// Category types (matching API response)
export interface Category {
  id: string
  user_id: string | null
  name: string
  type: 'income' | 'expense'
  icon: string
  color: string
  is_default: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

// Transaction types (matching API response)
export interface Transaction {
  id: string
  user_id: string
  account_id: string
  category_id: string
  amount: number
  type: 'income' | 'expense'
  description: string | null
  date: string
  created_at: string
  updated_at: string
  
  // Relations (populated by API joins)
  account?: {
    id: string
    name: string
    type: string
    currency: string
    icon: string
    color: string
  }
  category?: {
    id: string
    name: string
    type: string
    icon: string
    color: string
  }
}

// Transfer types
export interface Transfer {
  id: string
  userId: string
  fromAccountId: string
  toAccountId: string
  amount: number
  description?: string
  date: string
  createdAt: string
  
  // Relations
  fromAccount?: Account
  toAccount?: Account
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Form types  
export interface CreateTransactionForm {
  type: 'income' | 'expense'
  amount: number
  categoryId: string
  accountId: string
  description?: string
  date?: string
}

// API Create types (matching backend expectation)
export interface CreateTransaction {
  account_id: string
  category_id: string
  amount: number
  type: 'income' | 'expense'
  description?: string
  date?: string
}

export interface CreateAccountForm {
  name: string
  type: Account['type']
  currency: string
  initialBalance: number
}

export interface CreateCategoryForm {
  name: string
  type: 'income' | 'expense'
  color: string
  icon: string
}

// Analytics types
export interface AnalyticsData {
  totalBalance: number
  monthlyIncome: number
  monthlyExpenses: number
  monthlyChange: number
  categoryExpenses: Array<{
    categoryId: string
    categoryName: string
    amount: number
    percentage: number
  }>
  monthlyTrends: Array<{
    month: string
    income: number
    expenses: number
  }>
}