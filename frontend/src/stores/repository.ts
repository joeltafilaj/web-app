import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'

// Types
export interface Commit {
  id: string
  sha: string
  message: string
  author: string
  date: string
}

export interface Repository {
  id: string
  githubId: string
  name: string
  fullName: string
  starred: boolean
  description: string
  url: string
  commits: Commit[]
}

export const useRepositoryStore = defineStore('repository', () => {
  const repositories = ref<Repository[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchStarredRepositories = async () => {
    try {
      loading.value = true
      error.value = null
      const response = await api.get('/repositories/starred')
      repositories.value = response.data
    } catch (err) {
      error.value = (err as Error)?.message || 'Failed to fetch starred repositories'
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const clearError = () => {
    error.value = null
  }

  const updateRepository = (repository: Repository) => {
    const index = repositories.value.findIndex(r => r.id === repository.id)
    if (index !== -1) {
      repositories.value[index] = repository
    } else {
      repositories.value.push(repository)
    }
  }

  const clearRepositories = () => {
    repositories.value = []
  }

  return {
    repositories,
    loading,
    error,
    clearRepositories,
    clearError,
    fetchStarredRepositories,
    updateRepository,
  }
})