<script setup lang="ts">
import { computed } from 'vue'
import type { Repository } from '@/stores/repository'

interface Props {
  repository: Repository
}

const props = defineProps<Props>()

const languageData = computed(() => {
  if (!props.repository.languages) return []
  
  const languages = props.repository.languages
  const total = Object.values(languages).reduce((sum, bytes) => sum + bytes, 0)
  
  return Object.entries(languages)
    .map(([name, bytes]) => ({
      name,
      bytes,
      percentage: ((bytes / total) * 100).toFixed(1)
    }))
    .sort((a, b) => b.bytes - a.bytes)
})

const languageColors: Record<string, string> = {
  'TypeScript': '#3178c6',
  'JavaScript': '#f1e05a',
  'Python': '#3572A5',
  'Java': '#b07219',
  'Go': '#00ADD8',
  'Rust': '#dea584',
  'CSS': '#563d7c',
  'HTML': '#e34c26',
  'Vue': '#41b883',
  'React': '#61dafb',
  'PHP': '#4F5D95',
  'Ruby': '#701516',
  'C++': '#f34b7d',
  'C': '#555555',
  'Shell': '#89e051',
}

const getLanguageColor = (lang: string) => {
  return languageColors[lang] || '#6b7280'
}
</script>

<template>
  <div v-if="languageData.length > 0" class="card">
    <h3 class="text-xl font-bold text-gray-900 mb-6">Languages</h3>
    
    <div class="space-y-3">
      <div v-for="lang in languageData" :key="lang.name" class="flex items-center justify-between">
        <div class="flex items-center gap-3 flex-1">
          <div 
            class="w-3 h-3 rounded-full flex-shrink-0"
            :style="{ backgroundColor: getLanguageColor(lang.name) }"
          ></div>
          <span class="font-medium text-gray-900">{{ lang.name }}</span>
        </div>
        <div class="flex items-center gap-3">
          <div class="w-32 bg-gray-200 rounded-full h-2">
            <div 
              class="h-2 rounded-full transition-all duration-300"
              :style="{ 
                width: `${lang.percentage}%`,
                backgroundColor: getLanguageColor(lang.name)
              }"
            ></div>
          </div>
          <span class="text-sm text-gray-600 w-12 text-right">{{ lang.percentage }}%</span>
        </div>
      </div>
    </div>

    <div class="mt-6">
      <div class="flex h-2 rounded-full overflow-hidden">
        <div 
          v-for="lang in languageData" 
          :key="lang.name"
          :style="{ 
            width: `${lang.percentage}%`,
            backgroundColor: getLanguageColor(lang.name)
          }"
          class="transition-all duration-300"
          :title="`${lang.name}: ${lang.percentage}%`"
        ></div>
      </div>
    </div>
  </div>

  <!-- No Languages Available -->
  <div v-else class="card text-center py-8">
    <svg class="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
    <p class="text-gray-600 text-sm">No language data available</p>
  </div>
</template>

