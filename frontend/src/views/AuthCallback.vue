<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const errorMessage = ref<string | null>(null)
const isLoading = ref(false)

onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search)
  const token = urlParams.get('token')
  const error = urlParams.get('error')

  // Handle error from backend
  if (error) {
    errorMessage.value = error
    return
  }

  // Handle missing token
  if (!token) {
    errorMessage.value = 'No authentication token received'
    return
  }

  // Success - login and redirect
  handleLogin(token)
})

const handleLogin = async (token: string) => {
  try {
    isLoading.value = true
    const result = await authStore.login(token)
    
    if (result.success) {
      router.push('/dashboard')
    } else {
      errorMessage.value = result.error || 'Login failed'
    }
  } catch (error) {
    errorMessage.value = 'An unexpected error occurred'
  } finally {
    isLoading.value = false
  }
}

const goToLogin = () => {
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="card max-w-md w-full text-center">
      <!-- Loading State -->
      <div v-if="isLoading">
        <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto"></div>
        <p class="mt-4 text-gray-600">Authenticating...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="errorMessage" class="space-y-4">
        <svg class="w-16 h-16 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 class="text-xl font-bold text-gray-900">Authentication Failed</h2>
        <p class="text-gray-600">{{ errorMessage }}</p>
        <button 
          @click="goToLogin"
          class="mt-4 bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          Go to Login
        </button>
      </div>

      <!-- Success State (shouldn't be visible as user gets redirected) -->
      <div v-else>
        <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto"></div>
        <p class="mt-4 text-gray-600">Processing authentication...</p>
      </div>
    </div>
  </div>
</template>

