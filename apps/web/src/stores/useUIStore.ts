import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface UIState {
  showBalance: boolean
  currentScreen: string
  isBottomNavVisible: boolean
  theme: 'light' | 'dark' | 'auto'
  isLoading: boolean
  notifications: Array<{
    id: string
    type: 'success' | 'error' | 'info' | 'warning'
    title: string
    message?: string
    timestamp: number
  }>
  
  // Actions
  toggleShowBalance: () => void
  setCurrentScreen: (screen: string) => void
  setBottomNavVisible: (visible: boolean) => void
  setTheme: (theme: 'light' | 'dark' | 'auto') => void
  setLoading: (loading: boolean) => void
  addNotification: (notification: Omit<UIState['notifications'][0], 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
}

export const useUIStore = create<UIState>()(
  devtools(
    (set, get) => ({
      showBalance: true,
      currentScreen: 'dashboard',
      isBottomNavVisible: true,
      theme: 'auto',
      isLoading: false,
      notifications: [],

      toggleShowBalance: () => {
        const { showBalance } = get()
        set({ showBalance: !showBalance }, false, 'toggleShowBalance')
      },
      
      setCurrentScreen: (currentScreen) => set({ currentScreen }, false, 'setCurrentScreen'),
      
      setBottomNavVisible: (isBottomNavVisible) => set({ isBottomNavVisible }, false, 'setBottomNavVisible'),
      
      setTheme: (theme) => {
        set({ theme }, false, 'setTheme')
        
        // Применяем тему к документу
        if (typeof window !== 'undefined') {
          const root = document.documentElement
          if (theme === 'dark') {
            root.classList.add('dark')
          } else if (theme === 'light') {
            root.classList.remove('dark')
          } else {
            // auto - следуем системной теме
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
            if (systemTheme === 'dark') {
              root.classList.add('dark')
            } else {
              root.classList.remove('dark')
            }
          }
        }
      },
      
      setLoading: (isLoading) => set({ isLoading }, false, 'setLoading'),
      
      addNotification: (notification) => {
        const newNotification = {
          ...notification,
          id: Math.random().toString(36).substr(2, 9),
          timestamp: Date.now(),
        }
        
        const { notifications } = get()
        set({ 
          notifications: [...notifications, newNotification] 
        }, false, 'addNotification')
        
        // Автоматически удаляем уведомление через 5 секунд
        setTimeout(() => {
          get().removeNotification(newNotification.id)
        }, 5000)
      },
      
      removeNotification: (id) => {
        const { notifications } = get()
        set({ 
          notifications: notifications.filter(n => n.id !== id) 
        }, false, 'removeNotification')
      },
      
      clearNotifications: () => set({ notifications: [] }, false, 'clearNotifications'),
    }),
    { name: 'ui-store' }
  )
)