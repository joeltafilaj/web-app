<script setup lang="ts">
interface Props {
  message: string | null
  type?: 'error' | 'warning'
}

defineProps<Props>()

interface Emits {
  (event: 'dismiss'): void
}
const emit = defineEmits<Emits>()

const getColorClasses = (type: string) => {
  return type === 'error'
    ? 'bg-red-50 border-red-200 text-red-800'
    : 'bg-yellow-50 border-yellow-200 text-yellow-800'
}

const getIconColor = (type: string) => {
  return type === 'error' ? 'text-red-600' : 'text-yellow-600'
}

const getCloseHoverColor = (type: string) => {
  return type === 'error' 
    ? 'text-red-600 hover:text-red-800' 
    : 'text-yellow-600 hover:text-yellow-800'
}
</script>

<template>
  <div v-if="message"
    :class="[
      'rounded-lg p-4 flex items-center justify-between border',
      getColorClasses(type || 'error')
    ]"
  >
    <div class="flex items-center gap-3">
      <svg 
        class="w-5 h-5" 
        :class="getIconColor(type || 'error')"
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          v-if="type === 'error'" 
          stroke-linecap="round" 
          stroke-linejoin="round" 
          stroke-width="2" 
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
        />
        <path 
          v-else
          stroke-linecap="round" 
          stroke-linejoin="round" 
          stroke-width="2" 
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
        />
      </svg>
      <p class="text-sm font-medium">{{ message }}</p>
    </div>
    <button 
      @click="emit('dismiss')"
      :class="['transition-colors', getCloseHoverColor(type || 'error')]"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
</template>

