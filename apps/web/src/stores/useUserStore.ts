import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { User, Account } from '@/types'
import { apiClient, handleApiError } from '@/lib/api'

interface UserState {
  // State
  user: User | null
  accounts: Account[]
  totalBalance: number
  isLoading: boolean
  error: string | null
  token: string | null
  isAuthenticated: boolean
  
  // Actions
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  setAccounts: (accounts: Account[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // API actions
  loginWithTelegram: (initData: string) => Promise<boolean>
  loadUserData: () => Promise<void>
  loadAccounts: () => Promise<void>
  createAccount: (data: { name: string, type?: Account['type'], currency?: Account['currency'], balance?: number, icon?: string, color?: string }) => Promise<Account | null>
  updateAccount: (id: string, updates: Partial<Account> & { is_active?: boolean }) => Promise<void>
  deleteAccount: (id: string) => Promise<void>
  calculateTotalBalance: () => void
  logout: () => void
}

export const useUserStore = create<UserState>()(
  devtools(
    (set, get) => {
      // Initialize API client with stored token
      const initialToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
      if (initialToken) {
        apiClient.setToken(initialToken)
      }

      return {
        // Initial state
        user: null,
        accounts: [],
        totalBalance: 0,
        isLoading: false,
        error: null,
        token: initialToken,
        isAuthenticated: !!initialToken,

      // Basic setters
      setUser: (user) => {
        set({ user, isAuthenticated: !!user }, false, 'setUser')
      },
      
      setToken: (token) => {
        set({ token, isAuthenticated: !!token }, false, 'setToken')
        apiClient.setToken(token)
        
        if (typeof window !== 'undefined') {
          if (token) {
            localStorage.setItem('auth_token', token)
          } else {
            localStorage.removeItem('auth_token')
          }
        }
      },

      setAccounts: (accounts) => {
        set({ accounts }, false, 'setAccounts')
        get().calculateTotalBalance()
      },
      
      setLoading: (isLoading) => set({ isLoading }, false, 'setLoading'),
      
      setError: (error) => set({ error }, false, 'setError'),

      // API actions
      loginWithTelegram: async (initData: string) => {
        const { setLoading, setError, setToken, setUser } = get()
        
        try {
          setLoading(true)
          setError(null)

          const response = await apiClient.authTelegram(initData)
          
          if (response.success && response.data) {
            setToken(response.data.token)
            setUser(response.data.user)
            return true
          } else {
            setError('Login failed')
            return false
          }
        } catch (error) {
          const errorMessage = handleApiError(error)
          setError(errorMessage)
          return false
        } finally {
          setLoading(false)
        }
      },

      loadUserData: async () => {
        const { setLoading, setError, setUser, token } = get()
        
        if (!token) {
          setError('No auth token')
          return
        }

        try {
          setLoading(true)
          setError(null)

          const response = await apiClient.authMe()
          
          if (response.success && response.data) {
            setUser(response.data.user)
            set({ totalBalance: response.data.total_balance }, false, 'loadUserData')
          }
        } catch (error) {
          const errorMessage = handleApiError(error)
          setError(errorMessage)
        } finally {
          setLoading(false)
        }
      },

      loadAccounts: async () => {
        const { setLoading, setError, setAccounts, token } = get()
        
        if (!token) {
          setError('No auth token')
          return
        }

        try {
          setLoading(true)
          setError(null)

          const response = await apiClient.getAccounts({ is_active: true })
          
          if (response.data) {
            setAccounts(response.data)
          }
        } catch (error) {
          const errorMessage = handleApiError(error)
          setError(errorMessage)
        } finally {
          setLoading(false)
        }
      },

      createAccount: async (data) => {
        const { setError, loadAccounts } = get()
        
        try {
          setError(null)
          
          const response = await apiClient.createAccount(data)
          
          if (response.success && response.data) {
            // Reload accounts to get fresh data
            await loadAccounts()
            return response.data
          }
          
          return null
        } catch (error) {
          const errorMessage = handleApiError(error)
          setError(errorMessage)
          return null
        }
      },

      updateAccount: async (id, updates) => {
        const { setError, loadAccounts } = get()
        
        try {
          setError(null)
          
          await apiClient.updateAccount(id, updates)
          
          // Reload accounts to get fresh data
          await loadAccounts()
        } catch (error) {
          const errorMessage = handleApiError(error)
          setError(errorMessage)
        }
      },

      deleteAccount: async (id) => {
        const { setError, loadAccounts } = get()
        
        try {
          setError(null)
          
          await apiClient.deleteAccount(id)
          
          // Reload accounts to get fresh data
          await loadAccounts()
        } catch (error) {
          const errorMessage = handleApiError(error)
          setError(errorMessage)
        }
      },
      
      calculateTotalBalance: () => {
        const { accounts } = get()
        const totalBalance = accounts
          .filter(account => account.is_active)
          .reduce((sum, account) => sum + account.balance, 0)
        set({ totalBalance }, false, 'calculateTotalBalance')
      },

      logout: () => {
        set({
          user: null,
          accounts: [],
          totalBalance: 0,
          token: null,
          isAuthenticated: false,
          error: null
        }, false, 'logout')
        
        apiClient.setToken(null)
        
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token')
        }
      }
    }
    },
    { name: 'user-store' }
  )
)