<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import api from '@/services/api'

const authStore = useAuthStore()
const router = useRouter()

const userStats = ref({
  totalRepositories: 0,
  totalCommits: 0,
  mostActiveRepo: null as any,
  accountCreated: null as string | null,
  lastActivity: null as string | null
})

const loading = ref(false)
const error = ref<string | null>(null)

const handleLogout = async () => {
  await authStore.logout()
  router.push('/')
}

const goToDashboard = () => {
  router.push('/dashboard')
}

const fetchUserStats = async () => {
  try {
    loading.value = true
    error.value = null
    
    // Fetch user profile with stats
    const response = await api.get('/user/profile')
    userStats.value = response.data
    
  } catch (err) {
    error.value = (err as Error)?.message || 'Failed to fetch profile data'
  } finally {
    loading.value = false
  }
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Unknown'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

onMounted(() => {
  if (!authStore.isAuthenticated) {
    router.push('/')
    return
  }
  
  fetchUserStats()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <button @click="goToDashboard" class="text-gray-600 hover:text-gray-900">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 class="text-xl font-bold text-gray-900">Profile</h1>
          </div>
          <button @click="handleLogout" class="btn btn-secondary">
            Logout
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="space-y-8">
        <!-- Error Banner -->
        <div v-if="error" class="card bg-red-50 border-red-200">
          <div class="flex items-center gap-3">
            <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-red-700">{{ error }}</p>
          </div>
        </div>

        <!-- User Profile Card -->
        <div class="card">
          <div class="flex items-center gap-6">
            <img 
              v-if="authStore.user?.avatarUrl" 
              :src="authStore.user.avatarUrl" 
              :alt="authStore.user.username"
              class="w-24 h-24 rounded-full border-2 border-primary-200"
            />
            <div class="flex-1">
              <h2 class="text-3xl font-bold text-gray-900">
                {{ authStore.user?.name || authStore.user?.username }}
              </h2>
              <p class="text-gray-600 text-lg">@{{ authStore.user?.username }}</p>
              <p v-if="authStore.user?.email" class="text-gray-500 mt-1">
                {{ authStore.user.email }}
              </p>
              <p v-if="userStats.accountCreated" class="text-sm text-gray-500 mt-2">
                Member since {{ formatDate(userStats.accountCreated) }}
              </p>
            </div>
            <a 
              :href="`https://github.com/${authStore.user?.username}`"
              target="_blank"
              class="btn btn-primary flex items-center gap-2"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd" />
              </svg>
              View on GitHub
            </a>
          </div>
        </div>

        <!-- Statistics Grid -->
        <div v-if="!loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <!-- Total Repositories -->
          <div class="card text-center">
            <div class="text-3xl font-bold text-primary-600">{{ userStats.totalRepositories }}</div>
            <div class="text-gray-600 mt-1">Repositories Tracked</div>
          </div>

          <!-- Total Commits -->
          <div class="card text-center">
            <div class="text-3xl font-bold text-primary-600">{{ userStats.totalCommits }}</div>
            <div class="text-gray-600 mt-1">Commits Analyzed</div>
          </div>

          <!-- Most Active Repo -->
          <div class="card text-center">
            <div class="text-lg font-semibold text-gray-900 truncate">
              {{ userStats.mostActiveRepo?.name || 'N/A' }}
            </div>
            <div class="text-gray-600 mt-1">Most Active Repository</div>
          </div>

          <!-- Last Activity -->
          <div class="card text-center">
            <div class="text-lg font-semibold text-gray-900">
              {{ formatDate(userStats.lastActivity) }}
            </div>
            <div class="text-gray-600 mt-1">Last Activity</div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="card">
          <div class="flex items-center justify-center py-12">
            <div class="text-center">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p class="mt-4 text-gray-600">Loading profile data...</p>
            </div>
          </div>
        </div>

        <!-- Most Active Repository Details -->
        <div v-if="userStats.mostActiveRepo && !loading" class="card">
          <h3 class="text-xl font-bold text-gray-900 mb-4">Most Active Repository</h3>
          <div class="flex items-center gap-4">
            <div class="flex-1">
              <h4 class="text-lg font-semibold text-gray-900">{{ userStats.mostActiveRepo.fullName }}</h4>
              <p v-if="userStats.mostActiveRepo.description" class="text-gray-600 mt-1">
                {{ userStats.mostActiveRepo.description }}
              </p>
              <div class="flex items-center gap-4 mt-3 text-sm text-gray-500">
                <span>{{ userStats.mostActiveRepo.commits?.length || 0 }} commits</span>
                <span v-if="userStats.mostActiveRepo.starred" class="text-yellow-500">⭐ Starred</span>
              </div>
            </div>
            <a 
              :href="userStats.mostActiveRepo.url"
              target="_blank"
              class="btn btn-secondary"
            >
              View Repository
            </a>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
