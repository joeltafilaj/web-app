import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'

// Types
export interface User {
  id: string
  username: string
  name: string
  avatarUrl: string
  email: string
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const isInitialized = ref(false)

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const hasToken = computed(() => !!token.value)

  const setToken = (newToken: string) => {
    token.value = newToken
    localStorage.setItem('token', newToken)
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
  }

  const clearToken = () => {
    token.value = null
    user.value = null
    error.value = null
    localStorage.removeItem('token')
    delete api.defaults.headers.common['Authorization']
  }

  const checkAuth = async (): Promise<boolean> => {
    if (!token.value) {
      isInitialized.value = true
      return false
    }

    try {
      loading.value = true
      error.value = null
      
      api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
      const response = await api.get('/auth/status')
      user.value = response.data.user
      
      return true
    } catch (err: any) {
      console.error('Auth check failed:', err)
      
      if (err.response?.status === 401) {
        error.value = 'Session expired. Please log in again.'
      } else if (err.code === 'ECONNABORTED') {
        error.value = 'Connection timeout. Please check your network.'
      } else {
        error.value = err.response?.data?.error || 'Authentication failed'
      }
      
      clearToken()
      return false
    } finally {
      loading.value = false
      isInitialized.value = true
    }
  }

  const login = async (authToken: string): Promise<{ success: boolean; error?: string }> => {
    try {
      loading.value = true
      error.value = null
      
      setToken(authToken)
      const success = await checkAuth()
      
      if (!success || !user.value) {
        throw new Error('Failed to fetch user data')
      }
      
      return { success: true }
    } catch (err: any) {
      clearToken()
      const errorMessage = err.message || 'Login failed'
      error.value = errorMessage
      return { success: false, error: errorMessage }
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      clearToken()
    }
  }

  const clearError = () => {
    error.value = null
  }

  const handleStorageChange = (event: StorageEvent) => {
    if (event.key !== 'token') return

      if (event.newValue === null) {
        clearToken()
        
        if (window.location.pathname !== '/login') {
          window.location.href = '/auth/callback?error=User logged out'
        }
      } else if (event.newValue && event.newValue !== token.value) {
        setToken(event.newValue)
        
        checkAuth().catch(() => clearToken())
      }
  }

  // Cross-tab sync
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorageChange)
    
  }

  return {
    // State
    token,
    user,
    loading,
    error,
    isInitialized,
    
    // Computed
    isAuthenticated,
    hasToken,
    
    login,
    logout,
    checkAuth,
    clearError,
    setToken,
    clearToken,
  }
})