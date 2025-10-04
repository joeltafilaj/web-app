<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

// Types
import type { Repository } from '@/types'

// Utils
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'

// Components
import ErrorBanner from '@/components/ErrorBanner.vue'
import UserProfile from '@/components/UserProfile.vue'
import RepositoriesSection from '@/components/RepositoriesSection.vue'

const authStore = useAuthStore()
const router = useRouter()

const repositories = ref<Repository[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

const handleLogout = async () => {
  await authStore.logout()
  router.push('/')
}

const fetchRepositories = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    const response = await api.get('/repositories/starred')
    repositories.value = response.data
  } catch (err) {
    error.value = (err as Error)?.message || 'Failed to fetch starred repositories'
  } finally {
    isLoading.value = false
  }
}

const refreshRepositories = async () => {
  await fetchRepositories()
}

const clearError = () => {
  error.value = null
}

onMounted(() => {
  if (!authStore.isAuthenticated) {
    router.push('/')
    return
  }
  
  fetchRepositories()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <svg class="w-8 h-8 text-gray-800" fill="currentColor" viewBox="0 0 24 24">
              <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd" />
            </svg>
            <h1 class="text-xl font-bold text-gray-900">GitHub Commits Tracker</h1>
          </div>
          <div class="flex items-center gap-3">
            <router-link to="/profile" class="flex btn btn-secondary">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profile
            </router-link>
            <button @click="handleLogout" class="btn btn-secondary">
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="space-y-8">
        <!-- Error Banners -->
        <ErrorBanner 
          v-if="error" 
          type="error"
          :message="error"
          @dismiss="clearError()"
        />
        
        <!-- User Profile -->
        <UserProfile />

        <!-- Repositories Section -->
        <RepositoriesSection
          :repositories="repositories"
          :loading="isLoading"
          @refresh="refreshRepositories"
        />
      </div>
    </main>
  </div>
</template>
