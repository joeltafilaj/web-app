<script setup lang="ts">
// Types
import type { Repository } from '@/stores/repository'

interface Props {
  repositories: Repository[]
}

defineProps<Props>()

const selected = defineModel<Repository | null>('selected')
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div 
      v-for="repo in repositories.filter(repo => repo.starred)" 
      :key="repo.id"
      @click="selected = repo"
      class="card cursor-pointer transition-all hover:shadow-md hover:border-primary-300"
      :class="{
        'border-primary-500 ring-2 ring-primary-200': selected?.id === repo.id
      }"
    >
      <div class="space-y-3">
        <div class="flex items-start justify-between gap-4">
          <div class="flex-1 min-w-0">
            <h3 class="font-semibold text-gray-900 truncate">{{ repo.name }}</h3>
            <p class="text-sm text-gray-500 truncate">{{ repo.fullName }}</p>
          </div>
          <div v-if="repo.commits && repo.commits.length > 0" 
               class="flex items-center gap-1 bg-primary-100 text-primary-700 px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {{ repo.commits.length }} commits
          </div>
        </div>
        
        <p v-if="repo.description" class="text-sm text-gray-600 line-clamp-2">
          {{ repo.description }}
        </p>
        <p v-else class="text-sm text-gray-400 italic">
          No description available
        </p>

        <div class="flex items-center justify-between pt-2 border-t border-gray-100">
          <a 
            :href="repo.url" 
            target="_blank" 
            @click.stop
            class="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
          >
            View on GitHub
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
          
          <div v-if="!repo.commits || repo.commits.length === 0" class="text-xs text-gray-400 flex items-center gap-1">
            <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Fetching commits...
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

