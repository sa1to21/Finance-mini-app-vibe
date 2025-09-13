// API Client for Finance Tracker Frontend
import type { CreateTransaction } from '@/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  details?: any
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
    has_more: boolean
  }
}

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

// Removed duplicate - imported at top

export interface CreateAccount {
  name: string
  type?: 'cash' | 'card' | 'bank' | 'crypto' | 'investment'
  currency?: 'RUB' | 'USD' | 'EUR' | 'BTC' | 'ETH'
  balance?: number
  icon?: string
  color?: string
}

export interface CreateCategory {
  name: string
  type: 'income' | 'expense'
  icon?: string
  color?: string
}

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public error: string,
    public details?: any
  ) {
    super(error)
    this.name = 'ApiError'
  }
}

class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
  }

  setToken(token: string | null) {
    this.token = token
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {})
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      })

      if (!response.ok) {
        let errorData: any = {}
        try {
          errorData = await response.json()
        } catch {
          // Response is not JSON
        }

        throw new ApiError(
          response.status,
          errorData.error || errorData.message || `HTTP ${response.status}`,
          errorData.details
        )
      }

      return await response.json()
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      
      throw new ApiError(
        0,
        error instanceof Error ? error.message : 'Network error'
      )
    }
  }

  // Health check
  async health() {
    return this.request<{ status: string; timestamp: string; uptime: number }>('/health')
  }

  // Auth endpoints
  async authTelegram(initData: string) {
    return this.request<ApiResponse<{
      token: string
      user: User
      expires_in: number
    }>>('/api/auth/telegram', {
      method: 'POST',
      body: JSON.stringify({ initData })
    })
  }

  async authMe() {
    return this.request<ApiResponse<{
      user: User
      total_balance: number
    }>>('/api/auth/me')
  }

  async authRefresh() {
    return this.request<ApiResponse<{
      token: string
      expires_in: number
    }>>('/api/auth/refresh', {
      method: 'POST'
    })
  }

  // Mock auth for development
  async authMock() {
    return this.request<ApiResponse<{
      initData: string
      user: any
      note: string
    }>>('/api/auth/mock', {
      method: 'POST'
    })
  }

  // Transaction endpoints
  async getTransactions(params?: {
    account_id?: string
    category_id?: string
    type?: 'income' | 'expense'
    date_from?: string
    date_to?: string
    min_amount?: number
    max_amount?: number
    search?: string
    page?: number
    limit?: number
  }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }

    const query = searchParams.toString()
    return this.request<PaginatedResponse<Transaction>>(
      `/api/transactions${query ? `?${query}` : ''}`
    )
  }

  async getTransaction(id: string) {
    return this.request<ApiResponse<Transaction>>(`/api/transactions/${id}`)
  }

  async createTransaction(data: CreateTransaction) {
    return this.request<ApiResponse<Transaction>>('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async updateTransaction(id: string, data: Partial<CreateTransaction>) {
    return this.request<ApiResponse<Transaction>>(`/api/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  async deleteTransaction(id: string) {
    return this.request<ApiResponse<{ message: string }>>(`/api/transactions/${id}`, {
      method: 'DELETE'
    })
  }

  // Account endpoints
  async getAccounts(params?: {
    is_active?: boolean
    type?: Account['type']
    currency?: Account['currency']
    page?: number
    limit?: number
  }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }

    const query = searchParams.toString()
    return this.request<PaginatedResponse<Account>>(
      `/api/accounts${query ? `?${query}` : ''}`
    )
  }

  async getAccount(id: string) {
    return this.request<ApiResponse<Account>>(`/api/accounts/${id}`)
  }

  async createAccount(data: CreateAccount) {
    return this.request<ApiResponse<Account>>('/api/accounts', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async updateAccount(id: string, data: Partial<CreateAccount> & { is_active?: boolean }) {
    return this.request<ApiResponse<Account>>(`/api/accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  async deleteAccount(id: string) {
    return this.request<ApiResponse<{ message: string }>>(`/api/accounts/${id}`, {
      method: 'DELETE'
    })
  }

  async getAccountsSummary() {
    return this.request<ApiResponse<{
      accounts: Account[]
      totals: Record<string, number>
      count: number
    }>>('/api/accounts/summary')
  }

  // Category endpoints
  async getCategories(params?: {
    type?: 'income' | 'expense'
    is_active?: boolean
    include_default?: boolean
    page?: number
    limit?: number
  }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString())
        }
      })
    }

    const query = searchParams.toString()
    return this.request<PaginatedResponse<Category>>(
      `/api/categories${query ? `?${query}` : ''}`
    )
  }

  async getCategory(id: string) {
    return this.request<ApiResponse<Category>>(`/api/categories/${id}`)
  }

  async createCategory(data: CreateCategory) {
    return this.request<ApiResponse<Category>>('/api/categories', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async updateCategory(id: string, data: Partial<CreateCategory> & { is_active?: boolean }) {
    return this.request<ApiResponse<Category>>(`/api/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  async deleteCategory(id: string) {
    return this.request<ApiResponse<{ message: string }>>(`/api/categories/${id}`, {
      method: 'DELETE'
    })
  }

  async getCategoriesByType(type: 'income' | 'expense') {
    return this.request<ApiResponse<Category[]>>(`/api/categories/by-type/${type}`)
  }
}

// Create singleton instance
export const apiClient = new ApiClient()

// Helper hook for error handling
export function handleApiError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.error
  }
  
  if (error instanceof Error) {
    return error.message
  }
  
  return 'Unknown error occurred'
}