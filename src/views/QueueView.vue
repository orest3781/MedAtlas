<template>
  <div class="min-h-screen bg-surface-darker p-6">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-2xl font-semibold text-white">Production Queue</h1>
          <p class="text-white/60 mt-1">{{ activeJobs.length }} Active Jobs</p>
        </div>
        <div class="flex items-center gap-4">
          <select v-model="filters.status"
            class="bg-surface-dark border border-accent/20 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-primary focus:border-primary">
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="on_hold">On Hold</option>
          </select>
          <input type="text" v-model="filters.search" placeholder="Search jobs..."
            class="bg-surface-dark border border-accent/20 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-primary focus:border-primary" />
        </div>
      </div>

      <!-- Job Queue -->
      <TransitionGroup name="list" tag="div" class="space-y-4">
        <div v-for="job in filteredJobs" :key="job.id"
          class="bg-surface-dark rounded-lg border border-accent/20 p-6 transition-all duration-300">
          <div class="flex items-start justify-between">
            <!-- Job Info -->
            <div>
              <div class="flex items-center gap-3 mb-2">
                <h3 class="text-lg font-medium text-white">{{ job.clientName }}</h3>
                <span class="text-white/60">•</span>
                <span class="text-white/60">{{ job.projectName }}</span>
                <span class="text-white/60">•</span>
                <span class="font-mono text-white/60">{{ job.id }}</span>
              </div>
              <div class="flex items-center gap-4 text-sm text-white/60">
                <div class="flex items-center gap-2">
                  <span>Started:</span>
                  <span>{{ formatDate(job.startTime) }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span>Due:</span>
                  <span>{{ formatDate(job.dueDate) }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <span>Priority:</span>
                  <span :class="getPriorityClass(job.priority)">
                    {{ formatPriority(job.priority) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2">
              <button @click="updateJobStatus(job.id, 'completed')"
                class="px-4 py-2 bg-success/20 text-success rounded hover:bg-success/30 transition-colors">
                Complete
              </button>
              <button @click="updateJobStatus(job.id, 'on_hold')"
                class="px-4 py-2 bg-warning/20 text-warning rounded hover:bg-warning/30 transition-colors">
                Hold
              </button>
            </div>
          </div>

          <!-- Progress -->
          <div class="mt-6">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-white">Progress</span>
              <span class="text-sm text-white/60">{{ getCompletedSteps(job) }}/{{ job.steps.length }} Steps</span>
            </div>
            <div class="h-2 bg-surface-darker rounded-full overflow-hidden">
              <div class="h-full bg-primary transition-all duration-300"
                :style="getProgressStyle(job)">
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              <div v-for="step in job.steps" :key="step.id"
                class="flex items-center gap-3 p-3 rounded bg-surface-darker">
                <div class="flex-shrink-0">
                  <div v-if="step.status === 'completed'"
                    class="w-6 h-6 rounded-full bg-success/20 text-success flex items-center justify-center">
                    <CheckIcon class="w-4 h-4" />
                  </div>
                  <div v-else-if="step.status === 'in_progress'"
                    class="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                    <SpinnerIcon class="w-4 h-4" />
                  </div>
                  <div v-else
                    class="w-6 h-6 rounded-full bg-white/10 text-white/60 flex items-center justify-center">
                    {{ step.order }}
                  </div>
                </div>
                <div>
                  <div class="text-sm font-medium text-white">{{ step.name }}</div>
                  <div class="text-xs text-white/60">{{ formatStepStatus(step.status) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="filteredJobs.length === 0" key="empty"
          class="bg-surface-dark rounded-lg border border-accent/20 p-8 text-center">
          <div class="text-lg font-medium text-white mb-2">No Active Jobs</div>
          <p class="text-white/60">There are no jobs matching your current filters.</p>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useJobStore } from '@/stores/jobs'
import { CheckIcon } from '@heroicons/vue/24/solid'
import SpinnerIcon from '@/components/icons/SpinnerIcon.vue'
import type { Job } from '@/types/database'

const jobStore = useJobStore()

// Filters
const filters = ref({
  status: 'all',
  search: ''
})

// Computed
const activeJobs = computed(() => {
  return jobStore.jobs.filter(job => job.status !== 'completed')
})

const filteredJobs = computed(() => {
  let result = activeJobs.value

  // Filter by status
  if (filters.value.status !== 'all') {
    result = result.filter(job => job.status === filters.value.status)
  }

  // Filter by search
  if (filters.value.search) {
    const searchTerm = filters.value.search.toLowerCase()
    result = result.filter(job =>
      job.clientName.toLowerCase().includes(searchTerm) ||
      job.projectName.toLowerCase().includes(searchTerm) ||
      job.id.toLowerCase().includes(searchTerm)
    )
  }

  return result
})

// Methods
const getProgressStyle = (job: Job) => {
  const percentage = (getCompletedSteps(job) / job.steps.length) * 100
  return {
    width: `${percentage}%`
  }
}

const getCompletedSteps = (job: Job) => {
  return job.steps.filter(step => step.status === 'completed').length
}

const updateJobStatus = async (jobId: string, status: string) => {
  try {
    await jobStore.updateJobStatus(jobId, status)
  } catch (error) {
    console.error('Failed to update job status:', error)
  }
}

const getPriorityClass = (priority: string) => {
  const classes = {
    low: 'text-success',
    medium: 'text-warning',
    high: 'text-error'
  }
  return classes[priority] || classes.low
}

const formatPriority = (priority: string) => {
  return priority.charAt(0).toUpperCase() + priority.slice(1)
}

const formatStepStatus = (status: string) => {
  return status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1)
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleString()
}
</script>

<style scoped>
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.list-leave-active {
  position: absolute;
}
</style> 