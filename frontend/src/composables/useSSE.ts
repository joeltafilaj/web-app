import { ref, onUnmounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'

export interface SSEMessage {
  type: string
  repositoryId?: string
  repoFullName?: string
  count?: number
  error?: string
  message?: string
  repository?: any // Full repository object with commits
}

export function useSSE() {
  const authStore = useAuthStore()
  const eventSource = ref<EventSource | null>(null)
  const isConnected = ref(false)
  const error = ref<string | null>(null)
  const isActive = ref(false) // Track if SSE is actively needed
  const pendingJobs = ref(0) // Track pending commit jobs

  const connect = () => {
    if (!authStore.token || isConnected.value) return

    isActive.value = true

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    const url = `${apiUrl}/api/events/stream?token=${authStore.token}`

    eventSource.value = new EventSource(url)

    eventSource.value.onopen = () => {
      isConnected.value = true
      error.value = null
    }

    eventSource.value.onerror = (err: any) => {
      isConnected.value = false
      
      if (err.target?.readyState === EventSource.CLOSED) {
        error.value = 'Real-time connection closed unexpectedly'
      } else if (err.target?.readyState === EventSource.CONNECTING) {
        error.value = 'Attempting to reconnect to real-time updates...'
      } else {
        error.value = 'Failed to connect to real-time updates. Check your network connection.'
      }
    }
  }

  const disconnect = () => {
    if (eventSource.value) {
      eventSource.value.close()
      eventSource.value = null
      isConnected.value = false
      isActive.value = false
    }
  }

  const onMessage = (callback: (data: SSEMessage) => void) => {
    if (!eventSource.value) return

    eventSource.value.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        callback(data)
      } catch (err) {
        error.value = 'Failed to parse SSE message'
      }
    }
  }

  // Job tracking methods
  const setPendingJobs = (count: number) => {
    pendingJobs.value = count
  }

  const decrementPendingJobs = () => {
    pendingJobs.value = Math.max(0, pendingJobs.value - 1)
    if (pendingJobs.value === 0) {
      // Disconnect immediately when all jobs complete
      disconnect()
    }
  }

  const resetPendingJobs = () => {
    pendingJobs.value = 0
  }

  onUnmounted(() => {
    disconnect()
  })

  const clearError = () => {
    error.value = null
  }

  // Watch for auth changes
  watch(() => authStore.isAuthenticated, (isAuth) => {
    if (!isAuth && isConnected.value) {
      disconnect()
    }
  })

  // Reconnect on token change
  watch(() => authStore.token, (newToken, oldToken) => {
    if (newToken && oldToken && newToken !== oldToken && isConnected.value) {
      disconnect()
      error.value = null
      connect()
    }
  })

  return {
    isConnected,
    error,
    connect,
    disconnect,
    onMessage,
    clearError,
    setPendingJobs,
    decrementPendingJobs,
    resetPendingJobs,
  }
}