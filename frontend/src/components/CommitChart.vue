<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  CoreChartOptions,
  ChartData,
} from 'chart.js'

// Types
import type { Repository } from '@/stores/repository'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const props = defineProps<{
  repository: Repository
}>()

const chartData = computed<ChartData<'line'>>(() => {
  if (!props.repository.commits || props.repository.commits.length === 0) {
    return {
      labels: [],
      datasets: []
    }
  }

  // Group commits by date
  const commitsByDate = new Map<string, number>()
  
  props.repository.commits.forEach(commit => {
    const date = new Date(commit.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
    commitsByDate.set(date, (commitsByDate.get(date) || 0) + 1)
  })

  // Sort dates
  const sortedDates = Array.from(commitsByDate.keys()).sort((a, b) => {
    return new Date(a).getTime() - new Date(b).getTime()
  })

  return {
    labels: sortedDates,
    datasets: [
      {
        label: 'Commits',
        data: sortedDates.map(date => commitsByDate.get(date) as number),
        borderColor: 'rgb(37, 99, 235)',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        fill: true,
        tension: 0.4,
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    title: {
      display: true,
      text: `Commits per Day - ${props.repository.name}`,
      font: {
        size: 16,
        weight: 'bold',
      },
    },
    tooltip: {
      mode: 'index' as const,
      intersect: false,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        stepSize: 1,
      },
      title: {
        display: true,
        text: 'Number of Commits',
      },
    },
    x: {
      title: {
        display: true,
        text: 'Date',
      },
    },
  },
}
</script>

<template>
  <div class="card">
    <div class="h-96">
      <Line :data="chartData" :options="chartOptions as unknown as CoreChartOptions<'line'>" />
    </div>
    
    <div class="mt-6 pt-6 border-t border-gray-200">
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="text-center p-4 bg-primary-50 rounded-lg">
          <div class="text-3xl font-bold text-primary-700">
            {{ repository.commits.length }}
          </div>
          <div class="text-sm text-gray-600 mt-1">Total Commits</div>
        </div>
        
        <div class="text-center p-4 bg-green-50 rounded-lg">
          <div class="text-3xl font-bold text-green-700">
            {{ chartData.labels?.length }}
          </div>
          <div class="text-sm text-gray-600 mt-1">Active Days</div>
        </div>
        
        <div class="text-center p-4 bg-purple-50 rounded-lg">
          <div class="text-3xl font-bold text-purple-700">
            {{ repository.commits.length > 0 ? 
               (repository.commits.length / (chartData.labels?.length ?? 0)).toFixed(1) : 
               '0' }}
          </div>
          <div class="text-sm text-gray-600 mt-1">Avg. Commits/Day</div>
        </div>
      </div>
    </div>
  </div>
</template>

