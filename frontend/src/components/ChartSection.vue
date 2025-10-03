<script setup lang="ts">
import { computed } from 'vue'

// Types
import type { Repository } from '@/stores/repository'

// Components
import CommitChart from './CommitChart.vue'

const props = defineProps<{
  repositories: Repository[]
  selectedRepository: Repository | null
}>()

const repositoriesWithCommits = computed(() => {
  return props.repositories.filter(repo => repo.commits && repo.commits.length > 0)
})
</script>

<template>
  <div v-if="repositoriesWithCommits.length > 0" class="space-y-4">
    <h2 class="text-2xl font-bold text-gray-900">Commit Activity</h2>
    
    <!-- Chart Display -->
    <div v-if="selectedRepository && selectedRepository.commits && selectedRepository.commits.length > 0">
      <CommitChart :repository="selectedRepository" />
    </div>
    
    <!-- No Selection State -->
    <div v-else class="card">
      <div class="text-center py-12">
        <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p class="text-gray-600">Select a repository with commits to view the chart</p>
      </div>
    </div>
  </div>

  <!-- Processing State -->
  <div v-else class="card">
    <div class="text-center py-12">
      <svg class="w-16 h-16 text-gray-400 mx-auto mb-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p class="text-gray-600">Commits are being fetched in the background...</p>
      <p class="text-sm text-gray-500 mt-2">Charts will appear automatically as data arrives.</p>
    </div>
  </div>
</template>

