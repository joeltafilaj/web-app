<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

// Types
import type { Repository } from '@/types'

// Utils
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'

// Components
import CommitChart from '@/components/CommitChart.vue'
import LanguageChart from '@/components/LanguageChart.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const repository = ref<Repository | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)

const commitStats = computed(() => {
  if (!repository.value?.commits?.length) {
    return {
      totalCommits: 0,
      uniqueAuthors: 0,
      dateRange: { start: null, end: null },
      averageCommitsPerDay: 0,
      mostActiveAuthor: null,
    }
  }

  const commits = repository.value.commits
  const authors = [...new Set(commits.map(c => c.author))]
  const dates = commits.map(c => new Date(c.date)).sort((a, b) => a.getTime() - b.getTime())
  
  const startDate = dates[0]
  const endDate = dates[dates.length - 1]
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) || 1
  
  const authorCounts = authors.reduce((acc, author) => {
    acc[author] = commits.filter(c => c.author === author).length
    return acc
  }, {} as Record<string, number>)
  
  const mostActiveAuthor = Object.entries(authorCounts)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || null
  
  return {
    totalCommits: commits.length,
    uniqueAuthors: authors.length,
    dateRange: { start: startDate, end: endDate },
    averageCommitsPerDay: Math.round((commits.length / daysDiff) * 10) / 10,
    mostActiveAuthor,
  }
})

const recentCommits = computed(() => {
  if (!repository.value?.commits?.length) return []
  
  return repository.value.commits
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10)
})

const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const fetchRepository = async () => {
  const owner = route.params.owner as string
  const name = route.params.name as string
  
  if (!owner || !name) {
    error.value = 'Repository name is missing'
    return
  }

  isLoading.value = true
  error.value = null

  try {
    const response = await api.get(`/repositories/${owner}/${name}`)
    repository.value = response.data
  } catch (err: any) {
    error.value = err?.response?.data.error || 'Failed to fetch repository'
  } finally {
    isLoading.value = false
  }
}

const refreshRepository = async () => {
  await fetchRepository()
}

const goBack = () => {
  router.back()
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/')
}

onMounted(() => {
  if (!authStore.isAuthenticated) {
    router.push('/')
    return
  }
  fetchRepository()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <button @click="goBack" class="text-gray-600 hover:text-gray-900 transition-colors">
              <svg class="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 class="text-xl font-bold text-gray-900">{{ repository?.name || 'Repository Details' }}</h1>
          </div>
          <div class="flex items-center gap-3">
            <router-link to="/profile" class="flex btn btn-secondary">
              <svg class="size-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      <!-- Loading State -->
      <div v-if="isLoading && !repository" class="card">
        <div class="flex items-center justify-center py-12">
          <div class="text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p class="mt-4 text-gray-600">Loading repository...</p>
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div v-else-if="error && !repository" class="card text-center py-12">
        <svg class="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 class="text-lg font-medium text-gray-900 mb-2">Error Loading Repository</h3>
        <p class="text-gray-600 mb-4">{{ error }}</p>
        <div class="flex items-center justify-center gap-3">
          <button @click="refreshRepository" class="btn btn-primary">
            Try Again
          </button>
          <button @click="goBack" class="btn btn-secondary">
            Back to Dashboard
          </button>
        </div>
      </div>

      <!-- Repository Content -->
      <div v-else-if="repository" class="space-y-8">
        <!-- Repository Header -->
        <div class="card">
          <div class="flex items-start justify-between mb-6">
            <div class="flex-1">
              <h2 class="text-2xl font-bold text-gray-900 mb-2">{{ repository.name }}</h2>
              <p class="text-gray-600 mb-4">{{ repository.fullName }}</p>
              <p v-if="repository.description" class="text-gray-700 mb-4">
                {{ repository.description }}
              </p>
              <div class="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <span class="flex items-center gap-1">
                  <svg class="size-4" fill="currentColor" viewBox="0 0 24 24">
                    <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd" />
                  </svg>
                  {{ commitStats.totalCommits }} commits
                </span>
                <span class="flex items-center gap-1">
                  <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  {{ commitStats.uniqueAuthors }} contributors
                </span>
                <span v-if="commitStats.dateRange.start" class="flex items-center gap-1">
                  <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {{ formatDate(commitStats.dateRange.start) }} - {{ formatDate(commitStats.dateRange.end) }}
                </span>
              </div>

              <div class="flex items-center gap-6 text-sm text-gray-500">
                <span class="flex items-center gap-1">
                  <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  {{ commitStats.averageCommitsPerDay }} commits/day avg
                </span>
                <span v-if="commitStats.mostActiveAuthor" class="flex items-center gap-1">
                  <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Most active: {{ commitStats.mostActiveAuthor }}
                </span>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <button 
                @click="refreshRepository" 
                :disabled="isLoading"
                class="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                title="Refresh repository data from database"
              >
                <svg 
                  class="size-5" 
                  :class="{ 'animate-spin': isLoading }" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
              <a 
                :href="repository.url" 
                target="_blank"
                class="btn btn-primary no-underline flex items-center gap-2"
              >
                <svg class="size-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd" />
                </svg>
                View on GitHub
              </a>
            </div>
          </div>
        </div>

        <!-- Commit Chart -->
        <div class="card">
          <h3 class="text-xl font-bold text-gray-900 mb-6">Commit Activity</h3>
          <CommitChart :repository="repository" />
        </div>

        <!-- Language Chart -->
        <LanguageChart :repository="repository" />

        <!-- Recent Commits -->
        <div v-if="recentCommits.length > 0" class="card">
          <h3 class="text-xl font-bold text-gray-900 mb-6">Recent Commits</h3>
          <div class="space-y-4">
            <div v-for="commit in recentCommits.slice(0, 5)" :key="commit.id" class="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div class="size-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg class="size-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <div v-html="commit.message.replace(/\n/g, '<br />')"/>
                <div class="flex items-center gap-4 text-sm text-gray-500">
                  <span>{{ commit.author }}</span>
                  <span>{{ formatDate(new Date(commit.date)) }}</span>
                  <a 
                    :href="`https://github.com/${repository.fullName}/commit/${commit.sha}`"
                    target="_blank"
                    class="font-mono text-gray-400 hover:text-primary-700"
                    @click.stop
                  >
                    {{ commit.sha.substring(0, 7) }}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="!repository?.commits?.length" class="card text-center py-12">
          <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 class="text-lg font-medium text-gray-900 mb-2">No Commits Available</h3>
          <p class="text-gray-600">Commits are being fetched in the background. Refresh to check for updates.</p>
          <button @click="refreshRepository" class="mt-4 btn btn-primary">
            Refresh Repository
          </button>
        </div>
      </div>

      <!-- Repository Not Found -->
      <div v-else class="card text-center py-12">
        <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 class="text-lg font-medium text-gray-900 mb-2">Repository Not Found</h3>
        <p class="text-gray-600">This repository might not be in your starred list.</p>
        <button @click="goBack" class="mt-4 btn btn-primary">
          Back to Dashboard
        </button>
      </div>
    </main>
  </div>
</template>
