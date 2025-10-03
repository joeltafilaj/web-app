<script setup lang="ts">
import { computed, onBeforeMount } from 'vue'
import type { Repository } from '@/stores/repository'

interface Props {
  repository: Repository
}

const props = defineProps<Props>()

const languageColors: Record<string, string> = {}


onBeforeMount(() => {
  for (const lang in props.repository.languages) {
    languageColors[lang] = generateColorFromString()
  }
})

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


const generateColorFromString = (): string => {
  const h = Math.floor(Math.random() * 360);
  return `hsl(${h}, 70%, 60%)`;
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
            :style="{ backgroundColor: languageColors[lang.name] }"
          ></div>
          <span class="font-medium text-gray-900">{{ lang.name }}</span>
        </div>
        <div class="flex items-center gap-3">
          <div class="w-32 bg-gray-200 rounded-full h-2">
            <div 
              class="h-2 rounded-full transition-all duration-300"
              :style="{ 
                width: `${lang.percentage}%`,
                backgroundColor: languageColors[lang.name]
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
            backgroundColor: languageColors[lang.name]
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

