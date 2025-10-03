<script setup lang="ts">
// Types
import type { Repository } from '@/stores/repository'

// Components
import RepositoryList from './RepositoryList.vue'


interface Props {
  repositories: Repository[]
  loading: boolean
}

defineProps<Props>()

const selected = defineModel<Repository | null>('selected')

interface Emits {
  (event: 'refresh'): void
}
const emit = defineEmits<Emits>()

</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold text-gray-900">Starred Repositories</h2>
      <button 
        @click="emit('refresh')" 
        :disabled="loading"
        class="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        <svg 
          class="w-5 h-5" 
          :class="{ 'animate-spin': loading }" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Refresh
      </button>
    </div>
    <!-- Loading State -->
    <div v-if="loading && repositories.length === 0" class="card">
      <div class="flex items-center justify-center py-12">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p class="mt-4 text-gray-600">Loading your starred repositories...</p>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="repositories.length === 0" class="card">
      <div class="text-center py-12">
        <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <p class="text-gray-600">No starred repositories found</p>
      </div>
    </div>

    <!-- Repository List -->
    <RepositoryList 
      v-else
      :repositories="repositories"
      v-model:selected="selected"
    />
  </div>
</template>